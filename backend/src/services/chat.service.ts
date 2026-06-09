import type { Message } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { generateReply } from "./llm.service.js";

export type ChatResponse = {
  reply: string;
  sessionId: string;
};

export async function sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  const existingConversation = sessionId
    ? await prisma.conversation.findUnique({ where: { id: sessionId } })
    : null;

  const conversation = existingConversation ?? (await prisma.conversation.create({ data: {} }));

  const recentHistory = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 8
  });

  const orderedHistory = recentHistory.reverse();

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: "user",
      text: message
    }
  });

  const reply = await generateReply(orderedHistory, message);

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: "ai",
      text: reply
    }
  });

  return {
    reply,
    sessionId: conversation.id
  };
}

export async function getHistory(sessionId: string): Promise<Message[]> {
  return prisma.message.findMany({
    where: { conversationId: sessionId },
    orderBy: { createdAt: "asc" }
  });
}
