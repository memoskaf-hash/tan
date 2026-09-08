import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const requests = new Map<string, { count: number; reset: number }>();

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const now = Date.now();
        const entry = requests.get(ip);
        if (entry && entry.reset > now && entry.count >= 10) {
          return Response.json({ error: "Too many messages. Please try again later." }, { status: 429 });
        }
        if (!entry || entry.reset <= now) requests.set(ip, { count: 1, reset: now + 60_000 });
        else entry.count++;
        const key = process.env.OPENAI_API_KEY;
        if (!key) return Response.json({ error: "Chat is not configured: OPENAI_API_KEY is missing." }, { status: 503 });
        const parsed = z.object({ message: z.string().trim().min(1).max(2000) }).safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Message must be between 1 and 2000 characters." }, { status: 400 });
        const { message } = parsed.data;
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "system", content: "You are a concise helpful store assistant." }, { role: "user", content: message }] }),
        });
        const data = await response.json();
        return Response.json({ reply: data.choices?.[0]?.message?.content ?? "Unable to answer." }, { status: response.status });
      },
    },
  },
});
