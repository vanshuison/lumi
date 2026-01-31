
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GroundingLink, Attachment, PersonaType, ImageSize } from "../types";

/**
 * Lumina Intelligence Service
 * Optimized for Gemini 3 and 2.5 with advanced grounding and generation protocols.
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
  deepThink: boolean = false,
  imageGenerationConfig?: { enabled: boolean; size: ImageSize }
) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Intelligence core configuration missing. System offline.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // --- MODEL SELECTION LOGIC ---
  let effectiveModel = modelName;
  let systemInstruction = PERSONA_PROMPTS[persona];
  let tools: any[] = [{ googleSearch: {} }];
  let toolConfig: any = undefined;
  let imageConfig: any = undefined;

  // 1. IMAGE GENERATION (Nano Banana Pro)
  if (imageGenerationConfig?.enabled) {
    effectiveModel = 'gemini-3-pro-image-preview';
    imageConfig = {
      imageSize: imageGenerationConfig.size
    };
    // System instruction is less relevant for image gen but we keep a basic one
    systemInstruction = "Generate high-quality images based on the user prompt.";
  }
  // 2. IMAGE EDITING / VISION (Nano Banana)
  else if (attachments.some(a => a.type === 'image')) {
    effectiveModel = 'gemini-2.5-flash-image';
    // Remove tools that aren't supported or needed for simple image editing
    tools = []; 
  }
  // 3. SPATIAL GROUNDING (Maps)
  else if (location && location.latitude && location.longitude) {
    effectiveModel = 'gemini-2.5-flash'; 
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
  // 4. TEXT / DEFAULT
  else {
    // If fast/lite is requested via modelName, keep it. Otherwise standard logic.
  }

  // Map roles to 'user' and 'model'
  const contents: any = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: h.parts
  }));

  const userParts: any[] = [{ text: prompt }];
  
  // Handle Attachments
  attachments.forEach(att => {
    userParts.push({
      inlineData: { data: att.data, mimeType: att.mimeType }
    });
  });

  contents.push({ role: 'user', parts: userParts });

  // Construct Memory Context (Only for text models usually, but harmless to add)
  if (memories.length > 0 && !imageGenerationConfig?.enabled) {
    systemInstruction += `\n\nCORE MEMORY:\n${memories.map(m => `- ${m}`).join('\n')}`;
  }

  if (deepThink && !imageGenerationConfig?.enabled) {
    systemInstruction += `\n\nPROTOCOL: DEEP THINKING. Explicitly list reasoning steps.`;
  }

  if (!imageGenerationConfig?.enabled) {
    systemInstruction += `\n\nFORMATTING: Use Markdown.`;
  }

  const config: any = {
    systemInstruction,
    tools: effectiveModel.includes('flash-lite') ? undefined : tools, // Lite doesn't support tools
    toolConfig: effectiveModel.includes('flash-lite') ? undefined : toolConfig,
    imageConfig,
    thinkingConfig: (effectiveModel.includes('pro') || effectiveModel.includes('flash')) && !location && !deepThink && !imageGenerationConfig?.enabled && !effectiveModel.includes('image') && !effectiveModel.includes('lite') ? { thinkingBudget: 16000 } : undefined
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: effectiveModel,
      contents,
      config
    });

    // Parse Response (Could be Text or Image)
    let text = "";
    let generatedImage: { mimeType: string, data: string } | undefined;

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          text += part.text;
        }
        if (part.inlineData) {
          generatedImage = {
            mimeType: part.inlineData.mimeType,
            data: part.inlineData.data
          };
        }
      }
    }

    if (!text && !generatedImage) throw new Error("Intelligence stream timed out or returned empty.");
    
    // Extract Grounding
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

    return { text, groundingLinks, generatedImage };
  } catch (error: any) {
    console.error("Gemini Critical Failure:", error);
    throw new Error(error.message || "Intelligence stream interrupted.");
  }
};

/**
 * Extracts potential memories from a user message.
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
