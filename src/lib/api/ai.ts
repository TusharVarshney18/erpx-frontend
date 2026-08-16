import { api } from "@/lib/api/client";

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatResponse = {
  message: { role: string; content: string };
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  model: string;
  latency: number;
  finishReason: string;
};

export async function aiChat(messages: AIMessage[]): Promise<ChatResponse> {
  return api.post<ChatResponse>("/ai/chat", { messages });
}

export async function aiChatWithProvider(
  provider: string,
  messages: AIMessage[],
): Promise<ChatResponse> {
  return api.post<ChatResponse>(`/ai/chat/${provider}`, { messages });
}

export async function aiHealth() {
  return api.get<any>("/ai/health");
}

export async function aiProviders() {
  return api.get<{ providers: string[]; count: number }>("/ai/providers");
}
