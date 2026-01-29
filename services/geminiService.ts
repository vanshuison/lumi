
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GroundingLink, Attachment, PersonaType } from "../types";

/**
 * Lumina Intelligence Service
 * Optimized for Gemini 3 and 2.5 with advanced grounding protocols.
 */

const PERSONA_PROMPTS: Record<PersonaType, string> = {
  default: `You are Lumina, an elite AI intelligence agent. Mission: Provide responses that are "Concise yet Profound".`,
  founder: `You are in FOUNDER MODE. Be direct, strategic, and result-oriented. Focus on ROI, leverage, and scalability. No fluff. Use bullet points.`,
  coder: `You are a SENIOR PRINCIPAL ENGINEER. Focus on clean, efficient, scalable code. Always think about edge cases, security, and performance. Use modern patterns.`,
  writer: `You are a WORLD-CLASS EDITOR. Focus on tone, rhythm, and clarity. Improve prose to be evocative and punchy.`,
  analyst: `You are a DATA SCIENTIST. Be empirical. Ask for data sources. Structure answers in tables and logical steps. Focus on probabilities and outliers.`
};

export const generateIntelligentResponse = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[],
  attachments: Attachment[] = [],
  location?: { latitude: number; longitude: number },
  modelName: string = 'gemini-3-flash-preview',
  persona: PersonaType = 'default',
  memories: string[] = [],
  deepThink: boolean = false
) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Intelligence core configuration missing. System offline.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Map roles to 'user' and 'model' as required by Gemini API
  const contents: any = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: h.parts
  }));

  const userParts: any[] = [{ text: prompt }];
  
  // Handle Attachments (Images & PDFs)
  attachments.forEach(att => {
    userParts.push({
      inlineData: { data: att.data, mimeType: att.mimeType }
    });
  });

  contents.push({ role: 'user', parts: userParts });

  // TOOL SELECTION & MODEL OVERRIDE
  let tools: any[] = [{ googleSearch: {} }];
  let toolConfig: any = undefined;
  let effectiveModel = modelName;

  // If location is provided, we MUST use Gemini 2.5 for Maps grounding support
  if (location && location.latitude && location.longitude) {
    effectiveModel = 'gemini-2.5-flash'; // Required for Google Maps grounding
    tools = [{ googleSearch: {} }, { googleMaps: {} }];
    toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      }
    };
  }

  // Construct System Instruction with Memory Injection
  let systemInstruction = PERSONA_PROMPTS[persona];
  
  if (memories.length > 0) {
    systemInstruction += `\n\nCORE MEMORY (Use these facts to personalize the answer):\n${memories.map(m => `- ${m}`).join('\n')}`;
  }

  if (deepThink) {
    systemInstruction += `\n\nPROTOCOL: DEEP THINKING. Before answering, explicitly list your reasoning steps. Analyze the problem from first principles.`;
  }

  systemInstruction += `\n\nFORMATTING: Use Markdown. Bold key terms.`;

  const config: any = {
    systemInstruction,
    tools,
    toolConfig,
    thinkingConfig: (effectiveModel.includes('pro') || effectiveModel.includes('flash')) && !location && !deepThink ? { thinkingBudget: 16000 } : undefined
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: effectiveModel,
      contents,
      config
    });

    const text = response.text;
    if (!text) throw new Error("Intelligence stream timed out or safety triggered.");
    
    const groundingLinks: GroundingLink[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          groundingLinks.push({ uri: chunk.web.uri, title: chunk.web.title });
        } else if (chunk.maps) {
          groundingLinks.push({ uri: chunk.maps.uri, title: chunk.maps.title });
        }
      });
    }

    return { text, groundingLinks };
  } catch (error: any) {
    console.error("Gemini Critical Failure:", error);
    throw new Error(error.message || "Intelligence stream interrupted.");
  }
};

/**
 * Extracts potential memories from a user message.
 * This runs in the background to build the user profile.
 */
export const extractMemories = async (text: string): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: 'user',
        parts: [{ text: `Analyze this message and extract any permanent facts, preferences, or project details about the user. Return ONLY a JSON array of strings. If none, return []. Message: "${text}"` }]
      }],
      config: { responseMimeType: "application/json" }
    });
    
    const jsonStr = response.text;
    if (!jsonStr) return [];
    return JSON.parse(jsonStr);
  } catch (e) {
    return [];
  }
};

/**
 * Text-to-Speech Engine
 */
export const generateSpeech = async (text: string, voiceName: string = 'Kore') => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("TTS Configuration Missing.");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this with professional clarity: ${text.slice(0, 800)}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
