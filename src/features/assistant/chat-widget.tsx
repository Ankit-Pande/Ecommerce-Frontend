"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { askAssistant, type ChatMessage } from "@/api/assistant";
import { errorMessage } from "@/api/http";
import { SafeImage } from "@/components/ui/safe-image";
import { inr, tintFor } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

// The backend counts "Next" clicks from the chat, so enough turns go with each question.
const HISTORY_SENT = 20;
const MAX_LENGTH = 500;
const WHO_OPTIONS = ["Men", "Women", "Kids"];
const CHIP =
  "min-h-9 rounded-full border border-field bg-white px-3 text-sm font-semibold text-ink transition hover:border-accent disabled:opacity-50";
const SUGGESTIONS = ["Phones under ₹20,000", "Gaming laptop", "My orders", "My cart"];
const WELCOME = "Namaste! Ask me about ApnaKart products, your cart or your orders.";

// Removes extra spaces and repeated marks like "!!!" or "....".
function cleanQuestion(text: string) {
  return text
    .replace(/([^\p{L}\p{N}\s])\1+/gu, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LENGTH);
}

// Floating shopping assistant: ask, get answers with product rows, close.
export function ChatWidget() {
  const open = useUiStore((state) => state.chatOpen);
  const setOpen = useUiStore((state) => state.setChatOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking, open]);

  // Shows `next`, sends its last turns to the assistant and adds the reply.
  async function ask(next: ChatMessage[], confirm?: boolean) {
    setMessages(next);
    setThinking(true);
    try {
      const { reply, ...extra } = await askAssistant(
        next.slice(-HISTORY_SENT),
        confirm,
      );
      setMessages([...next, { role: "assistant", content: reply, ...extra }]);
    } catch (error) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: errorMessage(
            error,
            "Sorry, I could not answer right now. Please try again in a moment.",
          ),
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  // Sends a typed question or a button text.
  function send(question: string) {
    const content = cleanQuestion(question);
    if (!content || thinking) return;
    setText("");
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    if ((content.match(/[\p{L}\p{N}]/gu) ?? []).length < 2) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Please type a little more, like 'phone under ₹20000'.",
        },
      ]);
      return;
    }
    void ask(next);
  }

  // Answers the assistant's "confirm?" question.
  function answerConfirm(yes: boolean) {
    if (thinking) return;
    void ask(
      [
        ...messages,
        { role: "user", content: yes ? "Yes, confirm" : "No, cancel" },
      ],
      yes,
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 min-h-[52px] rounded-full border-[3px] border-white bg-discount px-[22px] font-extrabold text-white shadow-[0_8px_24px_rgba(15,42,46,.3)]"
      >
        AI Assistant
      </button>
    );
  }

  const last = messages[messages.length - 1];
  const lastReply = last?.role === "assistant" ? last : undefined;

  return (
    <section
      aria-label="AI assistant"
      className="fixed bottom-4 right-4 z-50 flex max-h-[min(540px,calc(100vh-32px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_12px_40px_rgba(15,42,46,.3)]"
    >
      <div className="flex items-center justify-between bg-accent py-2 pl-4 pr-2 text-white">
        <span className="text-lg font-extrabold">ApnaKart Assistant</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close assistant"
          className="h-11 w-11 text-2xl"
        >
          ×
        </button>
      </div>

      <div
        ref={listRef}
        className="flex min-h-[220px] flex-1 flex-col gap-2 overflow-y-auto p-3"
      >
        <p className="max-w-[88%] self-start rounded-2xl bg-ground px-3 py-2">
          {WELCOME}
        </p>

        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3 py-2 ${message.role === "user" ? "self-end bg-accent text-white" : "self-start bg-ground"}`}
          >
            {message.content}
            {message.products?.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                onClick={() => setOpen(false)}
                className="mt-1.5 flex min-h-11 items-center gap-2 whitespace-normal rounded-xl bg-white py-1 pl-1 pr-2.5 text-ink"
              >
                <span
                  className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg"
                  style={{ background: tintFor(product.id) }}
                >
                  <SafeImage
                    src={product.image}
                    alt=""
                    sizes="36px"
                    className="object-contain p-0.5"
                  />
                </span>
                <span className="line-clamp-2 flex-1 text-sm">
                  {product.name}
                </span>
                <span className="font-extrabold">
                  {inr(product.finalPricePaise)}
                </span>
              </Link>
            ))}
          </div>
        ))}

        {thinking && (
          <p className="self-start rounded-2xl bg-ground px-3 py-2 text-muted">
            Typing…
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 px-3 pb-2">
        {lastReply?.confirm ? (
          <>
            <button
              type="button"
              onClick={() => answerConfirm(true)}
              disabled={thinking}
              className={`${CHIP} border-accent bg-accent text-white`}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => answerConfirm(false)}
              disabled={thinking}
              className={CHIP}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {lastReply?.askWho &&
              WHO_OPTIONS.map((who) => (
                <button
                  key={who}
                  type="button"
                  onClick={() => send(who)}
                  disabled={thinking}
                  className={CHIP}
                >
                  {who}
                </button>
              ))}
            {lastReply?.hasMore && (
              <button
                type="button"
                onClick={() =>
                  send(`Next ${lastReply.products?.length} products`)
                }
                disabled={thinking}
                className={CHIP}
              >
                Next {lastReply.products?.length} products
              </button>
            )}
            {messages.length === 0 &&
              SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className={CHIP}
                >
                  {suggestion}
                </button>
              ))}
          </>
        )}
      </div>

      {!loggedIn && (
        <p className="px-3 pb-2 text-sm text-muted">
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            onClick={() => setOpen(false)}
            className="font-semibold text-accent"
          >
            Log in
          </Link>{" "}
          for cart and orders.
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
        }}
        className="flex gap-1.5 border-t border-line p-2.5"
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={MAX_LENGTH}
          placeholder="Ask about products, cart or orders"
          aria-label="Message to assistant"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-field px-3.5 outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={!text.trim() || thinking}
          className="min-h-11 rounded-xl bg-accent px-[18px] font-extrabold text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
