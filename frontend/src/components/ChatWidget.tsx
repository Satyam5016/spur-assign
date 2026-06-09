import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { SendHorizontal, Sparkles } from "lucide-react";
import { fetchChatHistory, sendChatMessage } from "../api/chatApi";
import type { Message } from "../types";
import { MessageBubble } from "./MessageBubble";

const SESSION_STORAGE_KEY = "spur:novaCartSessionId";
const MAX_MESSAGE_LENGTH = 1000;

function createOptimisticMessage(text: string): Message {
  return {
    id: crypto.randomUUID(),
    conversationId: "pending",
    sender: "user",
    text,
    createdAt: new Date().toISOString()
  };
}

export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem(SESSION_STORAGE_KEY)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const trimmedInput = input.trim();
  const canSend = trimmedInput.length > 0 && trimmedInput.length <= MAX_MESSAGE_LENGTH && !isLoading;
  const charactersLeft = MAX_MESSAGE_LENGTH - input.length;

  const welcomeMessage = useMemo<Message>(
    () => ({
      id: "welcome",
      conversationId: "local",
      sender: "ai",
      text: "Hi, I am NovaCart support. How can I help with shipping, returns, refunds, payments, or order tracking?",
      createdAt: new Date().toISOString()
    }),
    []
  );

  useEffect(() => {
    if (!sessionId) {
      setMessages([welcomeMessage]);
      return;
    }

    let isMounted = true;

    fetchChatHistory(sessionId)
      .then((history) => {
        if (isMounted) {
          setMessages(history.messages.length > 0 ? history.messages : [welcomeMessage]);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMessages([welcomeMessage]);
          setError("Could not load previous messages.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, welcomeMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();

    if (!canSend) {
      return;
    }

    const userText = trimmedInput;
    setInput("");
    setError(null);
    setIsLoading(true);
    setMessages((current) => [...current, createOptimisticMessage(userText)]);

    try {
      const response = await sendChatMessage(userText, sessionId ?? undefined);
      setSessionId(response.sessionId);
      localStorage.setItem(SESSION_STORAGE_KEY, response.sessionId);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          conversationId: response.sessionId,
          sender: "ai",
          text: response.reply,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Message failed to send.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <section className="flex h-[min(760px,calc(100vh-32px))] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-slate-50 shadow-soft">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
            <Sparkles size={20} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-950">NovaCart Support</h1>
            <p className="text-sm text-slate-500">AI live chat agent</p>
          </div>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          Online
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="ml-12 text-sm font-medium text-slate-500">Agent is typing...</div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4">
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_MESSAGE_LENGTH + 1}
              rows={2}
              className="max-h-36 min-h-12 w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              placeholder="Type your message..."
              aria-label="Message"
            />
            <p className={`mt-1 text-xs ${charactersLeft < 0 ? "text-red-600" : "text-slate-400"}`}>
              {charactersLeft} characters remaining
            </p>
          </div>

          <button
            type="submit"
            disabled={!canSend}
            className="mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Send message"
            title="Send message"
          >
            <SendHorizontal size={20} aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  );
}
