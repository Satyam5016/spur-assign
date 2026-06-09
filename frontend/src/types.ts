export type Sender = "user" | "ai";

export type Message = {
  id: string;
  conversationId: string;
  sender: Sender;
  text: string;
  createdAt: string;
};

export type SendMessageResponse = {
  reply: string;
  sessionId: string;
};

export type HistoryResponse = {
  sessionId: string;
  messages: Message[];
};
