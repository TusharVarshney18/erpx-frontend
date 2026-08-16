"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Maximize2, Minimize2, Bot, ArrowUp, Loader2, Crown } from "lucide-react";
import { cn } from "@/design-system";
import { aiChat } from "@/lib/api/ai";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Show me revenue trends",
  "Which products are low in stock?",
  "Summarize today's activity",
  "Top 5 customers this month",
  "Cash flow forecast",
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const { status, ctx } = useFeatureAccess();
  const restricted = !ctx.isSuperAdmin && status("ai") === "DEMO_RESTRICTED";
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI assistant. Ask me anything about your business performance, trends, or operations.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));
      const res = await aiChat([...history, { role: "user" as const, content: q }]);
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res?.message?.content || "I'm sorry, I couldn't generate a response.",
      };
      setMessages((prev) => [...prev, reply]);
    } catch (e: any) {
      const msg = e?.message ?? "";
      const status = e?.status ?? e?.statusCode;
      const isProviderMissing =
        status === 503 ||
        /provider|not configured|no provider|unavailable|503/i.test(msg);
      const fallback = isProviderMissing
        ? "AI provider is not configured. Set up an LLM provider (e.g. Ollama or OpenAI) in the backend configuration to enable AI."
        : "Something went wrong while contacting the AI service. Please try again.";
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallback,
      };
      setMessages((prev) => [...prev, reply]);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-ai shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-5 w-5 text-white" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          width: minimized ? "auto" : 380,
          height: minimized ? "auto" : 520,
        }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
        className={cn(
          "fixed bottom-6 right-6 z-40 overflow-hidden",
          "rounded-2xl border border-border bg-card shadow-dialog",
          minimized ? "p-0" : "flex flex-col",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 border-b border-border",
            minimized ? "p-2" : "py-3",
          )}
        >
          {!minimized && (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ai/10">
                <Bot className="h-4 w-4 text-ai" />
              </div>
              <span className="text-sm font-semibold">AI Assistant</span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setMinimized(!minimized)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors"
              aria-label={minimized ? "Maximize" : "Minimize"}
            >
              {minimized ? (
                <Maximize2 className="h-3.5 w-3.5" />
              ) : (
                <Minimize2 className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors"
              aria-label="Close AI Assistant"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {restricted ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
                  <Crown className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold">AI is a Premium feature</p>
                <p className="text-xs text-muted-foreground">
                  Upgrade to Premium to unlock AI capabilities in the demo workspace.
                </p>
              </div>
            ) : (
            <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            <div className="px-4 py-2 border-t border-border/50">
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-border p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || busy}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-opacity"
                aria-label="Send message"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
              </button>
            </div>
            </>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
