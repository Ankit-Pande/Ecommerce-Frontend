import { http } from "@/api/http";
import type { ApiData, Product } from "@/lib/types";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
};

type AssistantReply = { reply: string; products?: Product[] };

// Sends the recent chat to the backend assistant; only role and text go over the wire.
export async function askAssistant(messages: ChatMessage[]) {
  const history = messages.map(({ role, content }) => ({ role, content }));
  return (
    await http.post<ApiData<AssistantReply>>("/api/assistant/chat", {
      messages: history,
    })
  ).data;
}
