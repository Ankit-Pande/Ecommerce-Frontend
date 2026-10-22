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

// Sends the chat (each message cut to 1,000 characters) and returns the assistant's answer.
export async function askAssistant(messages: ChatMessage[], confirm?: boolean) {
  const history = messages.map(({ role, content }) => ({
    role,
    content: content.slice(0, 1000),
  }));
  return (
    await http.post<ApiData<AssistantReply>>("/api/assistant/chat", {
      messages: history,
      confirm,
    })
  ).data;
}
