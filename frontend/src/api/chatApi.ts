import type { HistoryResponse, SendMessageResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Request failed. Please try again.");
  }

  return response.json() as Promise<T>;
}

export function sendChatMessage(message: string, sessionId?: string) {
  return request<SendMessageResponse>("/chat/message", {
    method: "POST",
    body: JSON.stringify({ message, sessionId })
  });
}

export function fetchChatHistory(sessionId: string) {
  return request<HistoryResponse>(`/chat/history/${encodeURIComponent(sessionId)}`);
}
