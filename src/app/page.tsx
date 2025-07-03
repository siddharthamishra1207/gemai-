"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

type Message = { role: "user" | "bot"; text: string };

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [theme, setTheme] = useState<"light"|"dark">("light");
  const chatEnd = useRef<HTMLDivElement | null>(null);

  // Theme toggle: store in localStorage and apply class to html
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light"|"dark" | null;
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = saved || system;
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const scrollToBottom = () => chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const usr = { role: "user", text: input };
    setMessages(prev => [...prev, usr]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ message: input, history: messages }),
      });
      const { response } = await res.json();
      setMessages(prev => [...prev, { role: "bot", text: response }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="flex flex-col h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow">
        <h1 className="text-xl font-semibold">Gemini AI Assistant</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setMessages([])}
            className="px-3 py-1 border rounded-md bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100"
          >
            Clear Chat
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-3 py-1 border rounded-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow text-sm ${
              m.role === "user"
                ? "bg-blue-500 text-white rounded-br-none"
                : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-none"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-500 italic">Gemini is thinking...</div>}
        <div ref={chatEnd} />
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 border-t flex gap-2">
        <textarea
          className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type your message..."
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
        >Send</button>
      </div>
    </main>
  );
}
