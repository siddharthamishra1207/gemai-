import { NextRequest, NextResponse } from "next/server";

// Define the shape of the incoming request body
type ChatHistoryEntry = {
  role: "user" | "bot";
  text: string;
};

type ChatRequest = {
  message: string;
  history?: ChatHistoryEntry[];
};

// Define the shape of the chat model input/output if needed
type GeminiMessage = {
  role: string;
  parts: string;
};

export async function POST(req: NextRequest) {
  try {
    const data: ChatRequest = await req.json();
    const { message, history = [] } = data;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Prepare conversation history for Gemini format
    const formattedHistory: GeminiMessage[] = history.map(entry => ({
      role: entry.role === "user" ? "user" : "model",
      parts: entry.text,
    }));

    formattedHistory.push({ role: "user", parts: message });

    // Call Gemini API
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + process.env.GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: formattedHistory,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error }, { status: response.status });
    }

    const responseData = await response.json();
    const botReply = responseData.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";

    return NextResponse.json({ response: botReply }, { status: 200 });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
