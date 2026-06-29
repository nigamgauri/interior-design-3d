import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageUrl, projectId } = req.body;

  if (!imageUrl || !projectId) {
    return res.status(400).json({ error: 'Missing imageUrl or projectId' });
  }

  const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    // Fetch image and convert to base64 for Gemini
    const imageResp = await fetch(imageUrl);
    const imageBuffer = await imageResp.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    const prompt = `You are an architectural AI specialist for "Floor Lift". 
              Analyze this high-resolution floor plan image and reconstruct the architectural layout with high precision.
              
              Task: Reconstruct the skeletal structure (walls) and spatial regions (rooms).
              
              Rules:
              1. **Coordinate System**: Use a localized coordinate system from 0 to 20 (meters approximate).
              2. **Walls**: Identify all load-bearing and interior walls. Output as [x1, y1] to [x2, y2]. Each wall MUST be a straight line.
              3. **Rooms**: Identify distinct room types (Kitchen, Bedroom, Living Room, etc.) and their bounding corners.
              4. **Output**: Return ONLY a valid JSON object. No architectural commentary.
              
              JSON Schema:
              {
                "walls": [
                  { "start": [x, y], "end": [x, y], "thickness": 0.15, "height": 2.5 }
                ],
                "rooms": [
                  { "name": "Room Name", "corners": [[x,y], [x,y], [x,y], [x,y]] }
                ]
              }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageResp.headers.get('content-type') || 'image/jpeg'
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from text (sometimes Gemini adds markdown blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const resultJson = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!resultJson) {
      throw new Error('Could not parse JSON from Gemini response');
    }

    return res.status(200).json(resultJson);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
