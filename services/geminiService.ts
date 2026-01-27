
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GroundingLink } from "../types";

/**
 * Lumina Intelligence Service
 * Optimized for Gemini 3 and 2.5 with advanced grounding protocols.
 */
export const generateIntelligentResponse = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[],
  image?: { data: string; mimeType: string },
  location?: { latitude: number; longitude: number },
  modelName: string = 'gemini-3-flash-preview'
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
  if (image) {
    userParts.push({
      inlineData: { data: image.data, mimeType: image.mimeType }
    });
  }

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

  const config: any = {
    systemInstruction: `You are Lumina, an elite AI intelligence agent with real-time web and spatial awareness.
    MISSION: Provide responses that are "Concise yet Profound".
    
    RICH FORMATTING PROTOCOL:
    - Always use Markdown to structure your data.
    - BOLD key concepts and primary answers for immediate scanning.
    - Use ITALICS for nuanced details or secondary insights.
    - Use TABLES for comparative data or multi-column information.
    - Use BULLETED or NUMBERED LISTS for steps, features, or recommendations.
    - Use CODE BLOCKS (with language tags) for any technical data, code, or structured JSON.
    - Use BLOCKQUOTES for citations or profound philosophical insights.
    
    CAPABILITIES:
    - REAL-TIME DATA: Always leverage the googleSearch tool for recent news, trending topics, or general web inquiries.
    - SPATIAL AWARENESS & RECOMMENDATIONS: When spatial grounding is active, prioritize providing highly specific, context-aware recommendations for restaurants, hotels, and local venues.
    - INTELLIGENCE LAYER: For basic questions, give a direct answer then add one "Advanced Protocol" (a deep conceptual insight or future-looking prediction).
    
    TONE: Professional, executive, and slightly futuristic.`,
    tools,
    toolConfig,
    thinkingConfig: (effectiveModel.includes('pro') || effectiveModel.includes('flash')) && !location ? { thinkingBudget: 16000 } : undefined
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
