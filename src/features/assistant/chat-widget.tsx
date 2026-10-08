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

// Only the last few turns go to the backend, which keeps every request small.
const HISTORY_SENT = 6;
const MAX_LENGTH = 500;

const SUGGESTIONS = [
  "Running shoes under ₹2000",
  "Gift ideas for a 5 year old",
  "Best phones under ₹20,000",
  "Where is my order?",
];

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

  // Sends `sent` to the assistant and shows the reply after `shown`.
  async function ask(
    shown: ChatMessage[],
    sent: ChatMessage[],
    options: { page?: number; confirm?: boolean } = {},
  ) {
    setMessages(shown);
    setThinking(true);
    try {
      const answer = await askAssistant(sent, options);
      const nextPage = (options.page ?? 0) + 1;
      setMessages([
        ...shown,
        {
          role: "assistant",
          content: answer.reply,
          products: answer.products,
          confirm: answer.confirm,
          more: answer.hasMore ? { history: sent, page: nextPage } : undefined,
        },
      ]);
    } catch (error) {
      setMessages([
        ...shown,
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

  // Sends one typed question.
  function send(question: string) {
    const content = question.trim().slice(0, MAX_LENGTH);
    if (!content || thinking) return;
    setText("");
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    void ask(next, next.slice(-HISTORY_SENT));
  }

  // Loads the next 5 products of the same earlier question.
  function showMore(more: NonNullable<ChatMessage["more"]>) {
    if (thinking) return;
    const shown = messages.map((m) =>
      m.more === more ? { ...m, more: undefined } : m,
    );
    void ask(shown, more.history, { page: more.page });
  }

  // Answers the assistant's "confirm?" question.
  function answerConfirm(yes: boolean) {
    if (thinking) return;
    const next: ChatMessage[] = [
      ...messages.map((m) => ({ ...m, confirm: undefined })),
      { role: "user", content: yes ? "Yes, confirm" : "No, cancel" },
    ];
    void ask(next, next.slice(-HISTORY_SENT), { confirm: yes });
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
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-night md:inset-auto md:bottom-6 md:right-6 md:h-[600px] md:w-[400px] md:overflow-hidden md:rounded-3xl md:shadow-2xl md:ring-1 md:ring-black/5"
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
            className="flex-1 space-y-3 overflow-y-auto bg-ivory p-4 dark:bg-white/[0.02]"
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
                      className="rounded-full border border-accent/30 bg-white px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-white dark:bg-white/5"
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
                    className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-white text-ink shadow-card dark:bg-white/10 dark:text-gray-100"}`}
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
                          className="w-32 shrink-0 rounded-xl border border-sand bg-white p-2 transition hover:border-accent dark:border-white/10 dark:bg-white/5"
                        >
                          <span className="relative block aspect-square overflow-hidden rounded-lg bg-mist">
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
                  {message.more && (
                    <button
                      type="button"
                      onClick={() => showMore(message.more!)}
                      disabled={thinking}
                      className="mt-2 rounded-full border border-accent/30 bg-white px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-white disabled:opacity-50 dark:bg-white/5"
                    >
                      Next 5 products
                    </button>
                  )}
                  {message.confirm && index === messages.length - 1 && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => answerConfirm(true)}
                        disabled={thinking}
                        className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-white transition hover:bg-accent-dark disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => answerConfirm(false)}
                        disabled={thinking}
                        className="rounded-full border border-sand bg-white px-4 py-1.5 text-xs font-bold text-ink transition hover:border-accent disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-card dark:bg-white/10 w-fit">
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

          <div className="border-t border-sand p-3 dark:border-white/10">
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
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white transition hover:bg-accent-dark disabled:opacity-40"
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
