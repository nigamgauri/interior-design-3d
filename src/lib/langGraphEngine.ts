import { GoogleGenerativeAI } from '@google/generative-ai';
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import * as THREE from 'three';

// ─── Api Key helper ─────────────────────────────────────────────────────────

const getApiKey = () => {
  const g = globalThis as any;
  if (typeof g.process !== 'undefined' && g.process.env && g.process.env.VITE_GEMINI_API_KEY) {
    return g.process.env.VITE_GEMINI_API_KEY;
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return '';
};

// ─── Graph State Definition ──────────────────────────────────────────────────

export interface GraphState {
  imageUrl?: string;
  userInput?: string;
  intent?: 'reconstruct_layout' | 'invalid_input' | 'help_query' | 'low_confidence';
  intentConfidence: number;
  recommendations: any;
  renderingData: any;
  errors: string[];
  retryCount: number;
  maxRetries: number;
  feedback: string;
}

const GraphStateAnnotation = Annotation.Root({
  imageUrl: Annotation<string>(),
  userInput: Annotation<string>(),
  intent: Annotation<'reconstruct_layout' | 'invalid_input' | 'help_query' | 'low_confidence'>(),
  intentConfidence: Annotation<number>(),
  recommendations: Annotation<any>(),
  renderingData: Annotation<any>(),
  errors: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  retryCount: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
  maxRetries: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 3,
  }),
  feedback: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "",
  })
});

// Helper for fetching image bytes
async function fetchImageBase64(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  // Support both browser and Node.js Buffer conversion
  const g = globalThis as any;
  if (typeof g.Buffer !== 'undefined') {
    return {
      base64: g.Buffer.from(arrayBuffer).toString('base64'),
      mimeType: response.headers.get('content-type') || 'image/png'
    };
  } else {
    // Browser fallback
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return {
      base64: btoa(binary),
      mimeType: response.headers.get('content-type') || 'image/png'
    };
  }
}

// ─── Node 1: Intent Classification ──────────────────────────────────────────

async function intentClassificationNode(state: typeof GraphStateAnnotation.State): Promise<Partial<typeof GraphStateAnnotation.State>> {
  console.log(' [LangGraph] Node: intent_classification');

  // Direct mock check to enable local testing
  if (state.userInput && state.userInput.startsWith('mock:')) {
    const mode = state.userInput.split(':')[1];
    console.log(` [LangGraph] Mock mode active: ${mode}`);
    if (mode === 'happy' || mode === 'replan') {
      return { intent: 'reconstruct_layout', intentConfidence: 1.0 };
    }
    if (mode === 'fallback') {
      return { intent: 'low_confidence', intentConfidence: 0.3 };
    }
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return { 
      intent: 'low_confidence', 
      intentConfidence: 0.0, 
      errors: ['VITE_GEMINI_API_KEY is missing'] 
    };
  }

  // Fallback if no input provided
  if (!state.imageUrl && !state.userInput) {
    return { intent: 'invalid_input', intentConfidence: 1.0 };
  }

  // Clarification path trigger simulation (e.g. if text input contains ambiguous keywords)
  if (state.userInput && (state.userInput.toLowerCase().includes('maybe') || state.userInput.toLowerCase().includes('not sure'))) {
    return { intent: 'low_confidence', intentConfidence: 0.3 };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    let prompt = `You are an intent classification agent for a 3D floor plan SaaS platform called "Floor Lift".
    Analyze the input and classify the user's intent into exactly one of these:
    - 'reconstruct_layout': The user wants to upload a floor plan image and generate/reconstruct a 3D model.
    - 'invalid_input': The input does not represent a floor plan image or is corrupted/unrelated.
    - 'help_query': The user is asking a question or seeking assistance.

    Respond ONLY with a JSON object in this format:
    {
      "intent": "reconstruct_layout" | "invalid_input" | "help_query",
      "confidence": 0.0 to 1.0,
      "reason": "Brief justification"
    }`;

    let result;
    if (state.imageUrl) {
      const imgData = await fetchImageBase64(state.imageUrl);
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imgData.base64,
            mimeType: imgData.mimeType
          }
        }
      ]);
    } else {
      result = await model.generateContent([prompt, `User Input: ${state.userInput}`]);
    }

    const text = (await result.response).text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid classifier response");
    const res = JSON.parse(jsonMatch[0]);

    return {
      intent: res.intent,
      intentConfidence: res.confidence
    };
  } catch (err: any) {
    console.warn(' [LangGraph] Intent classification warning, using default:', err.message);
    return {
      intent: 'reconstruct_layout',
      intentConfidence: 0.8
    };
  }
}

// ─── Node 2: Recommendation Generation ───────────────────────────────────────

async function recommendationNode(state: typeof GraphStateAnnotation.State): Promise<Partial<typeof GraphStateAnnotation.State>> {
  console.log(' [LangGraph] Node: recommendation. Retry count:', state.retryCount);
  const nextRetryCount = state.feedback ? state.retryCount + 1 : state.retryCount;

  // Direct mock check to enable local testing
  if (state.userInput && state.userInput.startsWith('mock:')) {
    const mode = state.userInput.split(':')[1];
    if (mode === 'fallback' || state.intent === 'low_confidence') {
      console.log(' [LangGraph] Mock fallback recommendation triggered');
      return {
        recommendations: {
          note: "Fallback degraded response due to invalid or low-confidence intent",
          rooms: [
            { name: "Default Living Room", corners: [[1, 1], [6, 1], [6, 6], [1, 6]], recommended_furniture: [{ type: "Sofa", position: [3, 3] }] }
          ]
        },
        retryCount: nextRetryCount
      };
    }

    if (mode === 'replan') {
      if (state.retryCount === 0) {
        console.log(' [LangGraph] Mock out-of-bounds recommendation triggered to test replanning');
        return {
          recommendations: {
            rooms: [
              { name: "Living Room", corners: [[1, 1], [25, 1], [25, 25], [1, 25]], recommended_furniture: [] }
            ]
          },
          retryCount: nextRetryCount
        };
      } else {
        console.log(' [LangGraph] Mock corrected recommendation triggered on replan retry');
        return {
          recommendations: {
            rooms: [
              { name: "Living Room", corners: [[1, 1], [10, 1], [10, 10], [1, 10]], recommended_furniture: [{ type: "Sofa", position: [5, 5] }] }
            ]
          },
          retryCount: nextRetryCount
        };
      }
    }

    // Default mock happy path
    return {
      recommendations: {
        rooms: [
          { name: "Living Room", corners: [[1, 1], [10, 1], [10, 10], [1, 10]], recommended_furniture: [{ type: "Sofa", position: [5, 5] }] },
          { name: "Bedroom", corners: [[10, 1], [18, 1], [18, 10], [10, 10]], recommended_furniture: [{ type: "Double Bed", position: [14, 5] }] }
        ]
      },
      retryCount: nextRetryCount
    };
  }

  // Degraded / Fallback path if we had low confidence or invalid inputs
  if (state.intent === 'invalid_input' || state.intent === 'low_confidence' || state.intent === 'help_query') {
    console.log(' [LangGraph] Fallback recommendation route triggered');
    return {
      recommendations: {
        note: "Fallback degraded response due to invalid or low-confidence intent",
        rooms: [
          { name: "Default Living Room", size: [5, 5], center: [2.5, 2.5], furniture: ["Sofa"] },
          { name: "Default Bedroom", size: [4, 4], center: [7, 2.5], furniture: ["Double Bed"] }
        ]
      },
      retryCount: nextRetryCount
    };
  }

  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Prompt that incorporates feedback if replanning is active
  let feedbackPrompt = "";
  if (state.feedback) {
    feedbackPrompt = `\nCRITICAL FEEDBACK FROM PREVIOUS RUN: The previous layout had an issue: "${state.feedback}". Please correct this in your recommended layouts. Adjust positions or add/remove objects to ensure valid output.`;
  }

  const prompt = `Analyze this floor plan. Recommend a high-level spatial architecture layout.
  Define rooms and recommend key furniture placements.
  Ensure all dimensions and coordinates are positive values between 0 and 20.
  ${feedbackPrompt}

  Return ONLY a valid JSON object:
  {
    "rooms": [
      { "name": "Living Room" | "Bedroom" | "Kitchen" | "Bathroom", "corners": [[x,y], [x,y], [x,y], [x,y]], "recommended_furniture": [{"type": "Sofa" | "Double Bed" | "Dining Table" | "Desk", "position": [x,y]}] }
    ]
  }`;

  try {
    let result;
    if (state.imageUrl) {
      const imgData = await fetchImageBase64(state.imageUrl);
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imgData.base64,
            mimeType: imgData.mimeType
          }
        }
      ]);
    } else {
      result = await model.generateContent([prompt, `Context: ${state.userInput}`]);
    }

    const text = (await result.response).text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in recommendations");
    const recommendations = JSON.parse(jsonMatch[0]);

    return { recommendations, retryCount: nextRetryCount };
  } catch (err: any) {
    console.error(' [LangGraph] Recommendation generation failed:', err.message);
    // Degraded fallback recommendation
    return {
      recommendations: {
        rooms: [
          { name: "Living Room", corners: [[1,1], [6,1], [6,6], [1,6]], recommended_furniture: [{ type: "Sofa", position: [3, 3] }] }
        ]
      },
      retryCount: nextRetryCount
    };
  }
}

// ─── Node 3: Rendering Preparation ───────────────────────────────────────────

async function renderingNode(state: typeof GraphStateAnnotation.State): Promise<Partial<typeof GraphStateAnnotation.State>> {
  console.log(' [LangGraph] Node: rendering');

  const rec = state.recommendations;
  if (!rec || !rec.rooms) {
    return {
      renderingData: null,
      feedback: "Recommendations are empty or invalid"
    };
  }

  // Parse recommendations and build the skeletal wall structures, room boundaries, and furniture lists
  const walls: any[] = [];
  const rooms: any[] = [];
  const furniture: any[] = [];

  // Generate walls around room boundaries
  rec.rooms.forEach((r: any) => {
    if (r.corners && r.corners.length >= 3) {
      rooms.push({
        name: r.name,
        corners: r.corners
      });

      // Construct walls connecting the corners
      for (let i = 0; i < r.corners.length; i++) {
        const start = r.corners[i];
        const end = r.corners[(i + 1) % r.corners.length];
        walls.push({
          start,
          end,
          thickness: 0.15,
          height: 2.6
        });
      }

      // Add furniture
      if (r.recommended_furniture) {
        r.recommended_furniture.forEach((f: any) => {
          furniture.push({
            id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: f.type,
            position: f.position || [0, 0],
            rotation: 0
          });
        });
      }
    }
  });

  // Intentional validation rule for demo replanning trigger:
  // If no walls are generated, or if any coordinate is outside [0, 20], trigger feedback/replanning.
  let feedback = "";
  if (walls.length === 0) {
    feedback = "Failed to render: No valid walls could be generated from room corners.";
  }

  // Check coordinates range to see if it exceeds 20 (invalid coordinate trigger for replanning)
  const outOfBounds = walls.some(w => w.start[0] > 20 || w.start[1] > 20 || w.end[0] > 20 || w.end[1] > 20);
  if (outOfBounds) {
    feedback = "Failed to render: Wall coordinates exceed the maximum bounds of 20 meters.";
  }

  return {
    renderingData: { walls, rooms, furniture },
    feedback
  };
}

// ─── Conditional Routing Edges ───────────────────────────────────────────────

function routeIntent(state: typeof GraphStateAnnotation.State) {
  if (state.intent === 'invalid_input' || state.intent === 'low_confidence' || state.intent === 'help_query' || state.intentConfidence < 0.5) {
    console.log(' [LangGraph] Route: Fallback (low confidence/invalid intent)');
    return 'fallback_path';
  }
  return 'recommendation';
}

function routeRendering(state: typeof GraphStateAnnotation.State) {
  if (state.feedback) {
    if (state.retryCount < state.maxRetries) {
      console.log(` [LangGraph] Route: Replanning Loop (retry ${state.retryCount + 1}/${state.maxRetries})`);
      return 'replan';
    } else {
      console.log(' [LangGraph] Route: Max retries exceeded. Falling back to default layout.');
      return 'max_retries_fallback';
    }
  }
  return 'end';
}

// ─── Build and compile the StateGraph ────────────────────────────────────────

const workflow = new StateGraph(GraphStateAnnotation)
  .addNode('intent_classification', intentClassificationNode)
  .addNode('recommendation', recommendationNode)
  .addNode('rendering', renderingNode)
  .addEdge(START, 'intent_classification')
  
  // Conditional edge from intent classification
  .addConditionalEdges(
    'intent_classification',
    routeIntent,
    {
      fallback_path: 'recommendation', // Still route to recommendation but recommendation will handle fallback mode
      recommendation: 'recommendation'
    }
  )
  .addEdge('recommendation', 'rendering')
  
  // Conditional edge from rendering (replanning loop)
  .addConditionalEdges(
    'rendering',
    routeRendering,
    {
      replan: 'recommendation',
      max_retries_fallback: END,
      end: END
    }
  );

export const graph = workflow.compile();

// ─── External entry point matching original API ──────────────────────────────

export async function processFloorPlanWithLangGraph(imageUrl: string, userInput?: string): Promise<any> {
  console.log(' [NEURAL_ENGINE] Running LangGraph StateGraph...');
  
  const initialState = {
    imageUrl,
    userInput,
    retryCount: 0,
    maxRetries: 2,
    errors: [],
    feedback: ''
  };

  const finalState = await graph.invoke(initialState);
  
  if (finalState.renderingData) {
    return finalState.renderingData;
  }

  // Graceful fallback structure if all else fails
  return {
    walls: [
      { start: [1, 1], end: [15, 1], thickness: 0.15, height: 2.6 },
      { start: [15, 1], end: [15, 15], thickness: 0.15, height: 2.6 },
      { start: [15, 15], end: [1, 15], thickness: 0.15, height: 2.6 },
      { start: [1, 15], end: [1, 1], thickness: 0.15, height: 2.6 }
    ],
    rooms: [
      { name: "Default Living Room", corners: [[1, 1], [15, 1], [15, 15], [1, 15]] }
    ],
    furniture: [
      { id: "default-sofa", type: "Sofa", position: [5, 5], rotation: 0 }
    ]
  };
}
