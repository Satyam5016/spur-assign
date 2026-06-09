import { GoogleGenAI } from "@google/genai";
import type { Message } from "@prisma/client";

const SYSTEM_PROMPT = `You are a helpful support agent for a small e-commerce store called NovaCart. Answer clearly, politely, and concisely. Use the store FAQ when relevant. If you do not know something, say that you can connect the customer to human support.

FAQ knowledge:
- Shipping: We ship across India. Standard delivery takes 3-5 business days. Express delivery takes 1-2 business days.
- International shipping: We currently ship only within India.
- Returns: Customers can return products within 7 days of delivery if unused and in original packaging.
- Refunds: Refunds are processed within 5-7 business days after return inspection.
- Support hours: Monday to Saturday, 10 AM to 7 PM IST.
- Payment: We support UPI, credit/debit cards, net banking, Razorpay, and Cash on Delivery for selected locations.
- Order tracking: Customers receive a tracking link by SMS/email after dispatch.`;

const FALLBACK_REPLY =
  "I am sorry, I am having trouble reaching our AI support system right now. I can connect you to human support, or you can try again in a moment.";

function toGeminiRole(sender: string): "user" | "model" {
  return sender === "ai" ? "model" : "user";
}

export async function generateReply(history: Message[], userMessage: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not configured. Returning fallback reply.");
    return FALLBACK_REPLY;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      contents: [
        ...history.slice(-8).map((message) => ({
          role: toGeminiRole(message.sender),
          parts: [{ text: message.text }]
        })),
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.4,
        maxOutputTokens: 300
      }
    });

    return response.text?.trim() || FALLBACK_REPLY;
  } catch (error) {
    console.error("Gemini request failed:", error);
    return FALLBACK_REPLY;
  }
}
