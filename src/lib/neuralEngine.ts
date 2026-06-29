import { GoogleGenerativeAI } from '@google/generative-ai';

export const processFloorPlan = async (imageUrl: string) => {
  console.log(' [NEURAL_ENGINE] Starting reconstruction for:', imageUrl);
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error(' [NEURAL_ENGINE] ERROR: VITE_GEMINI_API_KEY is missing!');
    throw new Error('API Key Missing: Please check your .env file and RESTART your terminal.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Upgraded to Gemini 2.0 Flash for modern performance and API compatibility
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  try {
    console.log(' [NEURAL_ENGINE] Fetching image bytes...');
    const response = await fetch(imageUrl, {
      mode: 'cors', // Explicitly request CORS
      credentials: 'omit'
    });
    
    if (!response.ok) {
      console.error(' [NEURAL_ENGINE] Image fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch image from storage: ${response.statusText}. Check your Supabase Storage CORS settings.`);
    }

    const blob = await response.blob();
    console.log(' [NEURAL_ENGINE] Image converted to blob, size:', blob.size);
    
    const base64Promise = new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const imageBase64 = await base64Promise;
    console.log(' [NEURAL_ENGINE] Image base64 prepared. Sending to Gemini...');

    const prompt = `You are an elite architectural AI for the "Floor Lift" 3D platform. 
              Analyze this floor plan image with extreme precision for 3D reconstruction.
              
              Task: Deconstruct the image into a perfectly structured architectural JSON.
              
              Architectural Constraints:
              1. **Geometric Fidelity**: Ensure all walls are perfectly straight. 
              2. **Scale Mapping**: Use a consistent coordinate system (0 to 20 range).
              3. **Wall Connectivity**: Walls MUST connect at corners with no gaps.
              4. **Object Detection**: Identify furniture (Bed, Sofa, Dining Table, Desk). Use centroids for positioning.
              
              Output Requirements:
              - Return ONLY a valid JSON object.
              
              JSON Schema:
              {
                "walls": [
                  { "start": [x1, y1], "end": [x2, y2], "thickness": 0.15, "height": 2.6 }
                ],
                "rooms": [
                  { "name": "Room Name", "corners": [[x,y], [x,y]] }
                ],
                "furniture": [
                  { "type": "Sofa", "position": [x, y], "rotation": 0 }
                ]
              }`;

    const result = await model.generateContent([
      {
        text: prompt
      },
      {
        inlineData: {
          data: imageBase64,
          mimeType: blob.type || 'image/png'
        }
      }
    ]);

    console.log(' [NEURAL_ENGINE] Awaiting Gemini response...');
    const resultResponse = await result.response;
    const text = resultResponse.text();
    console.log(' [NEURAL_ENGINE] Raw response received. Parsing JSON...');
    
    // Extract JSON from text (sometimes Gemini adds markdown blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(' [NEURAL_ENGINE] FAILED to parse JSON from response:', text);
      throw new Error('Could not parse architectural data from AI response.');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    console.log(' [NEURAL_ENGINE] SUCCESS! Reconstruction complete.');
    return parsedData;
  } catch (error: any) {
    console.error(' [NEURAL_ENGINE] CRITICAL ERROR:', error);
    
    // Explicitly handle Quota errors for the user
    if (error.message?.includes('429') || error.status === 429) {
      throw new Error('API QUOTA EXHAUSTED: This Google AI key has reached its daily limit. Please provide a fresh key or wait for the reset.');
    }
    
    if (error.message?.includes('API_KEY_INVALID') || error.status === 403) {
      throw new Error('INVALID API KEY: The key provided is either inactive or restricted. Please check your .env file.');
    }

    throw error;
  }
};
