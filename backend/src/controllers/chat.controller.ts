import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../middleware/error.middleware.js";
import { getHistory, sendMessage } from "../services/chat.service.js";

const messageSchema = z.object({
  message: z
    .string({
      required_error: "Message is required.",
      invalid_type_error: "Message must be a string."
    })
    .trim()
    .min(1, "Message cannot be empty.")
    .max(1000, "Message must be 1000 characters or fewer."),
  sessionId: z.string().trim().min(1).optional()
});

export async function postMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = messageSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid request body.");
    }

    const result = await sendMessage(parsed.data.message, parsed.data.sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getConversationHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionIdParam = req.params.sessionId;
    const sessionId = typeof sessionIdParam === "string" ? sessionIdParam.trim() : "";

    if (!sessionId) {
      throw new ApiError(400, "Session ID is required.");
    }

    const messages = await getHistory(sessionId);
    res.json({ sessionId, messages });
  } catch (error) {
    next(error);
  }
}
