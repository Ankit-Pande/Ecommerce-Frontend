"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SendHorizontal } from "lucide-react";
import { askAssistant, type ChatMessage } from "@/api/assistant";
import { errorMessage } from "@/api/http";
import { LogoIcon } from "@/components/ui/logo-icon";
import { SafeImage } from "@/components/ui/safe-image";
import { tintFor } from "@/lib/colors";
import { inr } from "@/lib/format";
import { loginHref } from "@/lib/links";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

const WELCOME =
  "Namaste! Ask me about ApnaKart products, your cart or your orders.";
const QUICK_QUESTIONS = [
  { text: "Running shoes", color: "#D6F0FF" },
  { text: "Top discounts", color: "#E6DDFF" },
  { text: "My orders", color: "#FFD9E6" },
  { text: "My cart", color: "#DDF5C9" },
];
const WHO_OPTIONS = ["Men", "Women", "Kids"];
const CHIP =
  "min-h-10 shrink-0 rounded-full px-3.5 text-sm font-semibold disabled:opacity-50";

// The chat window: messages with product links, quick questions, Next/Who/Confirm chips and the input.
export function AssistantPanel({ onClose }: { onClose: () => void }) {
  const messages = useUiStore((state) => state.chatMessages);
  const setMessages = useUiStore((state) => state.setChatMessages);
  const loggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const pathname = usePathname();
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const last = messages[messages.length - 1];
  const lastReply = last?.role === "assistant" ? last : null;

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  // Sends the chat and adds the assistant's reply (or the error text) to it.
  async function ask(next: ChatMessage[], confirm?: boolean) {
    setMessages(next);
    setThinking(true);
    try {
      const { reply, ...extra } = await askAssistant(next.slice(-20), confirm);
      setMessages([...next, { role: "assistant", content: reply, ...extra }]);
    } catch (error) {
      const content = errorMessage(
        error,
        "Sorry, I could not answer right now.",
      );
      setMessages([...next, { role: "assistant", content }]);
    } finally {
      setThinking(false);
    }
  }

  // Sends a typed or tapped question (2 to 300 characters).
  function send(question: string) {
    const content = question.replace(/\s+/g, " ").trim().slice(0, 300);
    if (content.length < 2 || thinking) return;
    setText("");
    void ask([...messages, { role: "user", content }]);
  }

  // Answers yes or no to an action the assistant asked to confirm.
  function answerConfirm(yes: boolean) {
    if (thinking) return;
    const content = yes ? "Yes, confirm" : "No, cancel";
    void ask([...messages, { role: "user", content }], yes);
  }

  return (
    <section
      aria-label="ApnaKart AI"
      className="flex max-h-[min(640px,calc(100dvh-32px))] flex-col overflow-hidden rounded-[32px] border-4 border-accent bg-white shadow-[0_20px_56px_rgba(15,42,46,.45)]"
    >
      <div className="flex items-center gap-3 bg-accent pb-[18px] pl-4 pr-2.5 pt-3.5 text-white">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-white">
          <LogoIcon
            size={40}
            tile="fill-sunny"
            line="#0F2A2E"
            wheels="#0F2A2E"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[22px] font-extrabold leading-tight">
            ApnaKart AI
          </p>
          <p className="text-sm">Products · Cart · Orders</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="h-11 w-11 shrink-0 rounded-full border-2 border-white text-[22px]"
        >
          ×
        </button>
      </div>

      <div
        ref={listRef}
        className="flex min-h-[240px] flex-1 flex-col gap-3 overflow-y-auto p-3.5"
      >
        <Bubble mine={false}>{WELCOME}</Bubble>
        {messages.map((message, index) => (
          <Bubble key={index} mine={message.role === "user"}>
            {message.content}
            {message.products?.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="mt-2 flex min-h-14 w-full items-center gap-2.5 whitespace-normal rounded-2xl bg-white py-1.5 pl-1.5 pr-3 text-ink"
              >
                <span
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl"
                  style={{ background: tintFor(product.id) }}
                >
                  <SafeImage
                    src={product.image}
                    alt=""
                    sizes="48px"
                    className="object-contain p-1"
                  />
                </span>
                <span className="line-clamp-2 min-w-0 flex-1 text-sm">
                  {product.name}
                </span>
                <span className="font-extrabold">
                  {inr(product.finalPricePaise)}
                </span>
              </Link>
            ))}
          </Bubble>
        ))}
        {thinking && (
          <Bubble mine={false}>
            <span className="text-muted">Typing…</span>
          </Bubble>
        )}
        {messages.length === 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_QUESTIONS.map((question) => (
              <button
                key={question.text}
                type="button"
                onClick={() => send(question.text)}
                className="flex min-h-[84px] flex-col justify-between rounded-[20px] p-3.5 text-left text-[17px] font-extrabold"
                style={{ background: question.color }}
              >
                {question.text}
                <span aria-hidden className="self-end text-xl">
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto px-3.5 pb-2">
          {lastReply?.confirm ? (
            <>
              <button
                type="button"
                onClick={() => answerConfirm(true)}
                disabled={thinking}
                className={`${CHIP} bg-accent text-white`}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => answerConfirm(false)}
                disabled={thinking}
                className={`${CHIP} bg-grey`}
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
                    className={`${CHIP} bg-sunny`}
                  >
                    {who}
                  </button>
                ))}
              {lastReply?.hasMore && (
                <button
                  type="button"
                  onClick={() =>
                    send(`Next ${lastReply.products?.length ?? 5} products`)
                  }
                  disabled={thinking}
                  className={`${CHIP} bg-sunny`}
                >
                  Next {lastReply.products?.length ?? 5} products
                </button>
              )}
              {QUICK_QUESTIONS.map((question) => (
                <button
                  key={question.text}
                  type="button"
                  onClick={() => send(question.text)}
                  disabled={thinking}
                  className={CHIP}
                  style={{ background: question.color }}
                >
                  {question.text}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {!loggedIn && (
        <p className="px-4 pb-2 text-sm text-muted">
          <Link
            href={loginHref(pathname)}
            onClick={onClose}
            className="font-extrabold text-accent"
          >
            Log in
          </Link>{" "}
          to ask about your cart and orders.
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
        }}
        className="mx-3 mb-3 flex gap-1.5 rounded-full bg-ink p-1.5"
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={300}
          aria-label="Message to assistant"
          placeholder="Type your question"
          className="min-h-12 min-w-0 flex-1 bg-transparent px-3.5 text-white outline-none placeholder:text-white/60 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <button
          type="submit"
          disabled={thinking}
          aria-label="Send message"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sunny text-ink disabled:opacity-60"
        >
          <SendHorizontal
            className="h-[22px] w-[22px]"
            strokeWidth={2.4}
            aria-hidden
          />
        </button>
      </form>
    </section>
  );
}

// One chat bubble (the user's on the right).
function Bubble({
  mine,
  children,
}: {
  mine: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`max-w-[90%] whitespace-pre-line px-3.5 py-3 font-semibold ${mine ? "self-end rounded-[22px_22px_6px_22px] bg-accent text-white" : "self-start rounded-[22px_22px_22px_6px] bg-sunny-light"}`}
    >
      {children}
    </div>
  );
}
