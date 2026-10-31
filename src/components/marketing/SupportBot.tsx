import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, Send, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { ErpxMascot } from "@/components/auth/ErpxMascot";
import { COMPARISON_GROUPS, GST_NOTE, PLANS, formatInr } from "@/config/plans";

type SupportPath = "/pricing" | "/product" | "/auth" | "/demo";
type SupportLink = { label: string; to: SupportPath };
type ChatMessage = { role: "assistant" | "user"; text: string; links?: SupportLink[] };

const TOPICS = [
  { label: "Plans & pricing", prompt: "pricing" },
  { label: "Product help", prompt: "product modules" },
  { label: "Sign-in help", prompt: "sign in help" },
  { label: "Request a call", prompt: "request a call" },
];

function pricingAnswer() {
  const summary = PLANS.map((plan) => {
    if (plan.id === "free") return `${plan.name}: free`;
    if (plan.monthlyInr === null) return `${plan.name}: custom pricing`;
    const annual = plan.yearlyInr ? ` or ${formatInr(plan.yearlyInr)}/month billed yearly` : "";
    return `${plan.name}: ${formatInr(plan.monthlyInr)}/month${annual}`;
  }).join(" · ");
  return `${summary}. ${GST_NOTE} See the full comparison for plan limits and features.`;
}

function supportAnswer() {
  const row = COMPARISON_GROUPS.find((group) => group.title === "Security & support")
    ?.rows.find((item) => item.label === "Support");
  return row
    ? `Support by plan: Free — ${row.values.free}; Starter — ${row.values.starter}; Pro — ${row.values.pro}; Enterprise — ${row.values.enterprise}.`
    : "Compare the support included with each plan on the pricing page.";
}

function answerQuestion(question: string): Omit<ChatMessage, "role"> {
  const query = question.toLowerCase();
  if (/call|phone|human|person|sales|talk to|contact/.test(query)) {
    return {
      text: "Request a call through our demo form. Share your details and the team will reply within one business day. There isn't a phone number published on this page.",
      links: [{ label: "Request a call", to: "/demo" }],
    };
  }
  if (/price|pricing|plan|cost|subscription|billing/.test(query)) {
    return { text: pricingAnswer(), links: [{ label: "Compare plans", to: "/pricing" }] };
  }
  if (/support|help|issue|problem/.test(query)) {
    return {
      text: supportAnswer(),
      links: [
        { label: "Compare support plans", to: "/pricing" },
        { label: "Request a call", to: "/demo" },
      ],
    };
  }
  if (/login|log in|sign in|password|account|workspace/.test(query)) {
    return {
      text: "Sign in with your work email or Google. If you forgot your password, choose “Forgot password?” on the sign-in page.",
      links: [{ label: "Go to sign in", to: "/auth" }],
    };
  }
  if (/module|accounting|inventory|crm|hr|sales|invoice|product/.test(query)) {
    return {
      text: "ERPX brings Accounting, Sales & Billing, Inventory, CRM and HR together in one workspace. Explore the modules or ask our team for a walkthrough.",
      links: [
        { label: "Explore ERPX", to: "/product" },
        { label: "Book a walkthrough", to: "/demo" },
      ],
    };
  }
  if (/gst|tax/.test(query)) {
    return {
      text: "All ERPX plans include GST-ready invoicing. Subscription prices are listed in INR and exclude 18% GST.",
      links: [{ label: "View pricing", to: "/pricing" }],
    };
  }
  if (/migrat|tally|excel|import/.test(query)) {
    return {
      text: "Our team can help bring over your chart of accounts, opening balances and masters. Self-serve import templates are available for lists.",
      links: [{ label: "Request a migration walkthrough", to: "/demo" }],
    };
  }
  const extra = /annual|yearly|year\b/.test(query)
    ? "Annual billing is available; the pricing page shows yearly rates and savings."
    : /trial|free plan|trial ends/.test(query)
      ? "Your workspace stays available on the Free plan after a trial. Paid modules are restricted until you upgrade; workspace data is not deleted."
      : /user|seat|team size|member/.test(query)
        ? "A user is any teammate with a login to your workspace. The pricing page lists the user limit for each plan."
        : null;
  return extra
    ? { text: extra, links: [{ label: "See plan details", to: "/pricing" }] }
    : {
        text: "I can help with pricing, plan support, product modules, sign-in and migration. Choose a topic or request a call with our team.",
        links: [
          { label: "Browse pricing", to: "/pricing" },
          { label: "Request a call", to: "/demo" },
        ],
      };
}

export function SupportBot() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hi! I’m ERPX support. I can help with plans, product questions, account access, or getting a call from our team." },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !widgetRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, messages]);

  const sendMessage = (question: string, label = question) => {
    if (!question.trim()) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: label },
      { role: "assistant", ...answerQuestion(question) },
    ]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    setDraft("");
    sendMessage(question);
  };

  return (
    <div ref={widgetRef} className="support-bot" data-open={open ? "true" : "false"}>
      {open && (
        <section id="erpx-support-panel" className="support-bot__panel" role="dialog" aria-label="ERPX support chat">
          <header className="support-bot__header">
            <span className="support-bot__avatar" aria-hidden="true"><ErpxMascot className="h-10 w-9" /></span>
            <span className="support-bot__identity">
              <strong>ERPX support</strong>
              <small>Automated help · Available any time</small>
            </span>
            <button type="button" className="support-bot__close" aria-label="Close support chat" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div className="support-bot__messages" ref={messagesRef} aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={`support-bot__message support-bot__message--${message.role}`}>
                <p>{message.text}</p>
                {message.links?.length ? (
                  <div className="support-bot__links">
                    {message.links.map((link) => (
                      <Link key={link.label} to={link.to} onClick={() => setOpen(false)} className="support-bot__link">
                        {link.label}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="support-bot__topics" aria-label="Choose a support topic">
                {TOPICS.map((topic) => (
                  <button key={topic.label} type="button" className="support-bot__topic" onClick={() => sendMessage(topic.prompt, topic.label)}>
                    {topic.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <form className="support-bot__form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about pricing or support"
              aria-label="Ask ERPX support a question"
              maxLength={240}
            />
            <button type="submit" disabled={!draft.trim()} aria-label="Send message"><Send className="h-4 w-4" aria-hidden="true" /></button>
          </form>
          <footer className="support-bot__footer">
            Need a person? <Link to="/demo" onClick={() => setOpen(false)}>Request a call</Link>
          </footer>
        </section>
      )}

      <button
        type="button"
        className="support-bot__launcher"
        aria-label={open ? "Close ERPX support chat" : "Open ERPX support chat"}
        aria-expanded={open}
        aria-controls="erpx-support-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="support-bot__hint" aria-hidden="true">Need help?</span>
        <ErpxMascot className="support-bot__mascot" />
      </button>
    </div>
  );
}