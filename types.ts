
export type MessageRole = 'user' | 'assistant' | 'system';

export interface GroundingLink {
  uri: string;
  title: string;
}

export interface Attachment {
  type: 'image' | 'file';
  mimeType: string;
  data: string; // Base64
  name?: string;
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface Message {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  groundingLinks?: GroundingLink[];
  attachments?: Attachment[];
  isThinking?: boolean;
  isSpeaking?: boolean;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
}

export interface Memory {
  id: string;
  content: string;
  category: 'preference' | 'fact' | 'project';
  created_at: string;
}

export type PersonaType = 'default' | 'founder' | 'coder' | 'writer' | 'analyst';

export interface Persona {
  id: PersonaType;
  name: string;
  icon: string;
  systemInstruction: string;
  description: string;
}

export type ImageSize = '1K' | '2K' | '4K';
