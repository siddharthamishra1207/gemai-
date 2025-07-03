// app/api/chat/route.ts

import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-2.5-flash";

type Message = { role: "user" | "bot"; text: string; };

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] }: { message: string; history?: Message[] } =
      await req.json();

    // Build conversation for Gemini
    const contents = [
      ...history.map((m) => ({
        role: m.role === "bot" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.error("Gemini error:", err);
      return NextResponse.json(
        { error: "Gemini API failed", details: err },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const botText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini.";

    return NextResponse.json({ response: botText });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
