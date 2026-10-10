import { http } from "@/api/http";
import type { ApiData, Product } from "@/lib/types";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  hasMore?: boolean;
  askWho?: boolean;
  confirm?: boolean;
};

type AssistantReply = Omit<ChatMessage, "role" | "content"> & { reply: string };

// Sends the recent chat to the backend assistant; only role and text go over the wire.
export async function askAssistant(messages: ChatMessage[], confirm?: boolean) {
  const history = messages.map(({ role, content }) => ({ role, content }));
  return (
    await http.post<ApiData<AssistantReply>>("/api/assistant/chat", {
      messages: history,
      confirm,
    })
  ).data;
}
