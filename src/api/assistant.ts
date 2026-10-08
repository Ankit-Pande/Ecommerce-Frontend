import { http } from "@/api/http";
import type { ApiData, Product } from "@/lib/types";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  // Lets the Next button load the next page of the same question.
  more?: { history: ChatMessage[]; page: number };
  confirm?: boolean;
};

type AssistantReply = {
  reply: string;
  products?: Product[];
  hasMore?: boolean;
  confirm?: boolean;
};

// Sends the recent chat to the backend assistant; only role and text go over the wire.
export async function askAssistant(
  messages: ChatMessage[],
  options: { page?: number; confirm?: boolean } = {},
) {
  const history = messages.map(({ role, content }) => ({ role, content }));
  return (
    await http.post<ApiData<AssistantReply>>("/api/assistant/chat", {
      messages: history,
      ...options,
    })
  ).data;
}
