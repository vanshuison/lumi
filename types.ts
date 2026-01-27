
export type MessageRole = 'user' | 'assistant' | 'system';

export interface GroundingLink {
  uri: string;
  title: string;
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
  isThinking?: boolean;
  isSpeaking?: boolean;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
}
