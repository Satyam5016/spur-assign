import { Router } from "express";
import { getConversationHistory, postMessage } from "../controllers/chat.controller.js";

export const chatRouter = Router();

chatRouter.post("/message", postMessage);
chatRouter.get("/history/:sessionId", getConversationHistory);
