import { Bot, UserRound } from "lucide-react";
import type { Message } from "../types";

type MessageBubbleProps = {
  message: Pick<Message, "sender" | "text" | "createdAt">;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(message.createdAt));

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
          <Bot size={18} aria-hidden="true" />
        </div>
      )}

      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "rounded-br-md bg-[#12343b] text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
        <p className={`mt-1 text-right text-[11px] ${isUser ? "text-white/70" : "text-slate-400"}`}>
          {time}
        </p>
      </div>

      {isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
          <UserRound size={17} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
