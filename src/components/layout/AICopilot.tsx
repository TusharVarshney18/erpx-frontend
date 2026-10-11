import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Send,
  X,
  TrendingUp,
  FileBarChart2,
  PackageSearch,
  BrainCircuit,
  Loader2,
  Crown,
} from "lucide-react";
import { aiChat } from "@/lib/api/ai";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";

type Msg = { role: "user" | "ai"; text: string };

function friendlyAIMessage(e: unknown): string {
  const obj = (e ?? {}) as { message?: string; status?: number; statusCode?: number };
  const msg = String(obj.message ?? "");
  const status = obj.status ?? obj.statusCode;

  if (
    /not included in your current plan|upgrade to a plan with ai|not available on your current plan/i.test(
      msg,
    )
  ) {
    return "AI Copilot isn't included in your current plan. Upgrade to a plan with AI to ask questions about your live ERP data.";
  }
  if (/ai is disabled|disabled for this organization/i.test(msg)) {
    return "AI is turned off for your organization. An admin can enable it in Company Settings.";
  }
  if (/monthly ai usage limit|usage limit reached|monthly.*limit/i.test(msg)) {
    return "Your organization has reached its monthly AI usage limit. It resets at the start of your next billing period, or an admin can raise the cap.";
  }
  if (/too many ai requests|rate limit|wait a moment/i.test(msg) || status === 429) {
    return "You're sending requests too quickly. Please wait a moment and try again.";
  }
  if (/permission/i.test(msg) || status === 403) {
    return "You don't have permission to access that data. Ask an admin if you need access.";
  }
  if (/provider|not configured|no provider|unavailable/i.test(msg) || status === 503) {
    return "The AI provider is unavailable right now. Please try again later.";
  }
  return "Something went wrong while contacting the AI service. Please try again.";
}

const examples = [
  { icon: TrendingUp, text: "Show top customers by revenue" },
  { icon: FileBarChart2, text: "Generate monthly profit report" },
  { icon: PackageSearch, text: "Which SKUs need reordering this week?" },
  { icon: BrainCircuit, text: "Predict next month's sales" },
];

export function AICopilot() {
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const { status, ctx } = useFeatureAccess();
  const restricted = !ctx.isSuperAdmin && status("ai") === "DEMO_RESTRICTED";
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: "Hi — I'm the ERPX Copilot. Ask me anything about your business, or pick a prompt below.",
    },
  ]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;

    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);

    try {
      const history = [...messages, { role: "user" as const, text: q }].slice(-10).map((m) => ({
        role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      }));
      const res = await aiChat(history);
      const reply = res?.message?.content || "I'm sorry, I couldn't generate a response.";
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: friendlyAIMessage(e) }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full gradient-primary p-0 shadow-glow transition-transform hover:scale-105"
        aria-label="Open AI Copilot"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[600px] max-h-[80vh] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border shadow-elevate glass-strong animate-scale-in">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">ERPX Copilot</div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> AI Assistant
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Close AI Copilot"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4 py-3">
            {restricted ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI is a Premium feature</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upgrade to Premium to unlock AI capabilities in the demo workspace.
                  </p>
                </div>
                <Button
                  className="h-9 gradient-primary text-white"
                  onClick={() => setUpgradeOpen(true)}
                >
                  <Crown className="mr-1.5 h-3.5 w-3.5" /> Upgrade to Premium
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "gradient-primary whitespace-pre-wrap text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {m.role === "user" ? (
                        m.text
                      ) : (
                        <div className="markdown [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_li]:ml-4 [&_ol]:list-decimal [&_p:not(:last-child)]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-black/10 [&_pre]:p-2 [&_ul]:list-disc">
                          <ReactMarkdown>{m.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {busy && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                    </div>
                  </div>
                )}

                {messages.length <= 1 && (
                  <div className="pt-2">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Try asking
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {examples.map((e) => (
                        <button
                          key={e.text}
                          onClick={() => send(e.text)}
                          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
                        >
                          <e.icon className="h-3.5 w-3.5 text-primary" />
                          {e.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {!restricted && (
            <div className="border-t border-border p-2">
              <div className="flex items-center gap-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask anything about your business…"
                  aria-label="Ask the AI copilot"
                  className="h-9 border-0 bg-muted/60 focus-visible:ring-1"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 gradient-primary"
                  aria-label="Send message"
                  onClick={() => send()}
                  disabled={busy || !input.trim()}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </Button>
              </div>
              <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
                <span>Powered by ERPX AI</span>
                <Badge variant="secondary" className="h-4 text-[9px]">
                  Beta
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
