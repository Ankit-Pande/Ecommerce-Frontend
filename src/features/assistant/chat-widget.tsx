"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { askAssistant, type ChatMessage } from "@/api/assistant";
import { errorMessage } from "@/api/http";
import { SafeImage } from "@/components/ui/safe-image";
import { inr } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";

// The backend counts "Next" clicks from the chat, so enough turns go with each question.
const HISTORY_SENT = 20;
const MAX_LENGTH = 500;
const WHO_OPTIONS = ["Men", "Women", "Kids"];
const QUICK_BUTTON =
  "rounded-full border border-accent/30 bg-white px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-white disabled:opacity-50";

const SUGGESTIONS = [
  "Phones under ₹20,000",
  "Gaming laptop with 16GB RAM",
  "Men's jeans under ₹1500",
  "Where is my order?",
];

// Removes extra spaces and repeated marks like "!!!" or "....".
function cleanQuestion(text: string) {
  return text
    .replace(/([^\p{L}\p{N}\s])\1+/gu, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LENGTH);
}

// Floating shopping assistant: ask, get answers with product cards, clear or close.
export function ChatWidget() {
  const [open, setOpen] = useState(false);
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
  }, [messages, thinking]);

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

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open shopping assistant"
          className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-accent to-violet-600 text-white shadow-soft transition hover:scale-105 md:bottom-6 md:right-6"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Shopping assistant"
          className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:bottom-6 md:right-6 md:h-[600px] md:w-[400px] md:overflow-hidden md:rounded-3xl md:shadow-2xl md:ring-1 md:ring-black/5"
        >
          <header className="flex items-center gap-3 bg-gradient-to-r from-accent to-violet-600 px-4 py-3 text-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Back"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
              <Bot className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-sm font-extrabold">
                ApnaKart Assistant
              </span>
              <span className="block text-[11px] text-white/80">
                Ask about products, prices or your orders
              </span>
            </span>
            <button
              type="button"
              onClick={() => setMessages([])}
              disabled={messages.length === 0 || thinking}
              aria-label="Clear chat"
              title="Clear chat"
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="hidden h-9 w-9 place-items-center rounded-full hover:bg-white/15 md:grid"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-ground p-4"
          >
            {messages.length === 0 && (
              <div className="pt-6 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-accent to-violet-600 text-white">
                  <Sparkles className="h-6 w-6" />
                </span>
                <p className="mt-3 font-display text-lg font-extrabold">
                  Hi! How can I help?
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Ask in English or Hinglish. Try one of these:
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className={QUICK_BUTTON}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    message.role === "user" ? "max-w-[80%]" : "max-w-[92%]"
                  }
                >
                  <p
                    className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-white text-ink shadow-card"}`}
                  >
                    {message.content}
                  </p>
                  {message.products && message.products.length > 0 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {message.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={() => setOpen(false)}
                          className="w-32 shrink-0 rounded-xl border border-line bg-white p-2 transition hover:border-accent"
                        >
                          <span className="relative block aspect-square overflow-hidden rounded-lg bg-ground">
                            <SafeImage
                              src={product.image}
                              alt={product.name}
                              sizes="128px"
                              className="object-contain p-1.5"
                            />
                          </span>
                          <span className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-4">
                            {product.name}
                          </span>
                          <span className="mt-0.5 block text-xs font-extrabold">
                            {inr(product.finalPricePaise)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {index === messages.length - 1 &&
                    (message.askWho || message.hasMore) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.askWho &&
                          WHO_OPTIONS.map((who) => (
                            <button
                              key={who}
                              type="button"
                              onClick={() => send(who)}
                              disabled={thinking}
                              className={QUICK_BUTTON}
                            >
                              {who}
                            </button>
                          ))}
                        {message.hasMore && (
                          <button
                            type="button"
                            onClick={() =>
                              send(`Next ${message.products?.length} products`)
                            }
                            disabled={thinking}
                            className={QUICK_BUTTON}
                          >
                            Next {message.products?.length} products
                          </button>
                        )}
                      </div>
                    )}
                  {message.confirm && index === messages.length - 1 && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => answerConfirm(true)}
                        disabled={thinking}
                        className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-white transition hover:bg-accent disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => answerConfirm(false)}
                        disabled={thinking}
                        className="rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold text-ink transition hover:border-accent disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-card w-fit">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-2 w-2 animate-bounce rounded-full bg-accent"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-line p-3">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send(text);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={MAX_LENGTH}
                placeholder="Ask anything about shopping…"
                aria-label="Your question"
                className="field flex-1 rounded-full"
              />
              <button
                type="submit"
                disabled={!text.trim() || thinking}
                aria-label="Send"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white transition hover:bg-accent disabled:opacity-40"
              >
                <SendHorizontal className="h-5 w-5" />
              </button>
            </form>
            {!loggedIn && (
              <p className="mt-2 text-center text-[11px] text-gray-500">
                <Link
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  onClick={() => setOpen(false)}
                  className="font-semibold text-accent"
                >
                  Log in
                </Link>{" "}
                for cart, orders and smarter answers.
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
