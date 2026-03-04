import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send, Bot, User, Sparkles, Code2, Lightbulb, RotateCcw } from "lucide-react";

// ── Markdown-ish renderer ─────────────────────────────────────────
function MessageContent({ text }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner   = part.slice(3, -3);
          const firstNL = inner.indexOf("\n");
          const lang    = firstNL > -1 ? inner.slice(0, firstNL).trim() : "";
          const code    = firstNL > -1 ? inner.slice(firstNL + 1) : inner;
          return (
            <span key={i} className="chat-code-block">
              {lang && <span className="chat-code-lang">{lang}</span>}
              <pre><code>{code.trim()}</code></pre>
            </span>
          );
        }
        const inline = part.split(/(`[^`]+`)/g);
        return (
          <span key={i}>
            {inline.map((chunk, j) =>
              chunk.startsWith("`") && chunk.endsWith("`") && chunk.length > 2
                ? <code key={j} className="chat-inline-code">{chunk.slice(1, -1)}</code>
                : <span key={j}>{chunk}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="chat-typing-indicator">
      <span /><span /><span />
    </div>
  );
}

const QUICK_PROMPTS = [
  { icon: Lightbulb, label: "Hint",       text: "Give me a hint without spoiling the solution."               },
  { icon: Code2,     label: "Approach",   text: "What algorithmic approach should I use?"                     },
  { icon: Sparkles,  label: "Complexity", text: "What's the time and space complexity of the optimal solution?" },
];

// ── Props ─────────────────────────────────────────────────────────
// messages    : Message[]  — owned by ProblemPage, survives tab switches
// setMessages : Dispatch   — owned by ProblemPage
// problem     : object     — the current problem data
function ChatAi({ problem, messages, setMessages }) {
  const [isTyping, setIsTyping]   = useState(false);
  const messagesEndRef             = useRef(null);
  const inputRef                   = useRef(null);

  const { register, handleSubmit, reset, watch } = useForm();
  const watchedMessage = watch("message", "");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    if (!text?.trim()) return;
    const newMessages = [...messages, { role: "user", parts: [{ text }] }];
    setMessages(newMessages);
    setIsTyping(true);
    reset();

    try {
      const response = await axiosClient.post("/ai/chat", {
        messages:    newMessages,
        title:       problem?.title,
        description: problem?.description,
        testCases:   problem?.visibleTestCases,
        startCode:   problem?.startCode,
      });
      setMessages((prev) => [
        ...prev,
        { role: "model", parts: [{ text: response.data.message }] },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", parts: [{ text: "Sorry, something went wrong. Please try again." }] },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onSubmit      = (data) => sendMessage(data.message);
  const onQuickPrompt = (text) => sendMessage(text);
  const onReset       = ()     => setMessages([{
    role: "model",
    parts: [{ text: `Session reset. What would you like to know about **${problem?.title || "this problem"}**?` }],
  }]);

  const msgCount = messages.filter((m) => m.role === "user").length;

  return (
    <>
      <style>{`
        .chat-ai-root {
          display: flex; flex-direction: column; height: 100%;
          background: #0d0d0f; font-family: 'JetBrains Mono','Fira Code','Cascadia Code',monospace;
          position: relative; overflow: hidden;
        }
        .chat-ai-root::before {
          content:''; position:absolute; inset:0;
          background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px);
          pointer-events:none; z-index:0;
        }
        .chat-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid rgba(99,255,180,.12); background:rgba(13,13,15,.95); backdrop-filter:blur(8px); position:relative; z-index:2; flex-shrink:0; }
        .chat-header-left { display:flex; align-items:center; gap:8px; }
        .chat-header-icon { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#63ffb4 0%,#00b4d8 100%); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .chat-header-title { font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#63ffb4; }
        .chat-header-sub   { font-size:10px; color:rgba(255,255,255,.3); letter-spacing:.06em; }
        .chat-header-badge { font-size:9px; padding:2px 7px; border-radius:99px; background:rgba(99,255,180,.1); color:#63ffb4; border:1px solid rgba(99,255,180,.25); letter-spacing:.08em; }
        .chat-reset-btn { background:transparent; border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.35); width:26px; height:26px; border-radius:6px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .2s; }
        .chat-reset-btn:hover { border-color:rgba(99,255,180,.35); color:#63ffb4; background:rgba(99,255,180,.06); }
        .chat-messages { flex:1; overflow-y:auto; padding:16px 14px; display:flex; flex-direction:column; gap:14px; position:relative; z-index:1; scroll-behavior:smooth; }
        .chat-messages::-webkit-scrollbar { width:3px; }
        .chat-messages::-webkit-scrollbar-thumb { background:rgba(99,255,180,.15); border-radius:99px; }
        .chat-msg-row { display:flex; gap:9px; animation:msgIn .25s cubic-bezier(.16,1,.3,1) both; }
        .chat-msg-row.user { flex-direction:row-reverse; }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .chat-avatar { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
        .chat-avatar.model { background:linear-gradient(135deg,rgba(99,255,180,.2),rgba(0,180,216,.2)); border:1px solid rgba(99,255,180,.25); color:#63ffb4; }
        .chat-avatar.user  { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:rgba(255,255,255,.5); }
        .chat-bubble-wrap  { display:flex; flex-direction:column; gap:3px; max-width:88%; }
        .chat-msg-row.user .chat-bubble-wrap { align-items:flex-end; }
        .chat-bubble { padding:9px 13px; border-radius:12px; font-size:12.5px; line-height:1.7; white-space:pre-wrap; word-break:break-word; }
        .chat-bubble.model { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); color:rgba(255,255,255,.88); border-bottom-left-radius:4px; }
        .chat-bubble.user  { background:linear-gradient(135deg,rgba(99,255,180,.15),rgba(0,180,216,.1)); border:1px solid rgba(99,255,180,.2); color:rgba(255,255,255,.92); border-bottom-right-radius:4px; }
        .chat-code-block { display:block; margin:8px 0 4px; border-radius:8px; overflow:hidden; border:1px solid rgba(99,255,180,.15); background:#111318; }
        .chat-code-lang  { display:block; padding:4px 10px; font-size:9.5px; text-transform:uppercase; letter-spacing:.1em; color:#63ffb4; background:rgba(99,255,180,.07); border-bottom:1px solid rgba(99,255,180,.1); }
        .chat-code-block pre { margin:0; padding:10px 12px; overflow-x:auto; font-size:11.5px; line-height:1.65; color:#a8d8b9; }
        .chat-inline-code { background:rgba(99,255,180,.1); border:1px solid rgba(99,255,180,.18); padding:1px 5px; border-radius:4px; font-size:11.5px; color:#63ffb4; }
        .chat-typing-row { display:flex; align-items:center; gap:9px; animation:msgIn .2s both; }
        .chat-typing-indicator { display:flex; align-items:center; gap:4px; padding:11px 14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:12px; border-bottom-left-radius:4px; }
        .chat-typing-indicator span { width:5px; height:5px; border-radius:50%; background:#63ffb4; animation:typingBounce 1.1s ease-in-out infinite; opacity:.5; }
        .chat-typing-indicator span:nth-child(2) { animation-delay:.15s; }
        .chat-typing-indicator span:nth-child(3) { animation-delay:.3s; }
        @keyframes typingBounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }
        .chat-quick-prompts { display:flex; gap:6px; padding:6px 14px 10px; flex-wrap:wrap; position:relative; z-index:2; flex-shrink:0; }
        .chip { display:flex; align-items:center; gap:5px; padding:4px 10px; border-radius:99px; font-size:10.5px; letter-spacing:.04em; font-family:inherit; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.04); color:rgba(255,255,255,.5); transition:all .18s; }
        .chip:hover:not(:disabled) { border-color:rgba(99,255,180,.35); color:#63ffb4; background:rgba(99,255,180,.07); transform:translateY(-1px); }
        .chip:disabled { opacity:.3; cursor:not-allowed; }
        .chat-input-area { padding:0 10px 12px; position:relative; z-index:2; flex-shrink:0; }
        .chat-input-box  { display:flex; align-items:flex-end; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:12px; transition:border-color .2s,box-shadow .2s; overflow:hidden; }
        .chat-input-box:focus-within { border-color:rgba(99,255,180,.4); box-shadow:0 0 0 3px rgba(99,255,180,.06); }
        .chat-textarea { flex:1; background:transparent; border:none; outline:none; padding:10px 12px; font-size:12.5px; font-family:inherit; color:rgba(255,255,255,.88); resize:none; min-height:38px; max-height:120px; line-height:1.5; }
        .chat-textarea::placeholder { color:rgba(255,255,255,.22); }
        .chat-send-btn { background:transparent; border:none; padding:8px 12px; cursor:pointer; color:rgba(99,255,180,.5); display:flex; align-items:center; justify-content:center; transition:color .18s,transform .15s; flex-shrink:0; align-self:flex-end; margin-bottom:1px; }
        .chat-send-btn:hover:not(:disabled) { color:#63ffb4; transform:translateX(1px); }
        .chat-send-btn:disabled { opacity:.25; cursor:not-allowed; }
        .chat-send-btn.has-text { color:#63ffb4; }
        .chat-input-hint { font-size:9.5px; color:rgba(255,255,255,.18); padding:4px 4px 0; letter-spacing:.04em; }
      `}</style>

      <div className="chat-ai-root">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-header-icon"><Bot size={13} color="#0d0d0f" strokeWidth={2.5} /></div>
            <div>
              <div className="chat-header-title">AI Assistant</div>
              <div className="chat-header-sub">Context-aware · No spoilers</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {msgCount > 0 && <span className="chat-header-badge">{msgCount} msg{msgCount !== 1 ? "s" : ""}</span>}
            <button className="chat-reset-btn" onClick={onReset} disabled={isTyping} title="Reset conversation">
              <RotateCcw size={11} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, i) => {
            const isModel = msg.role === "model";
            return (
              <div key={i} className={`chat-msg-row ${isModel ? "model" : "user"}`}>
                <div className={`chat-avatar ${isModel ? "model" : "user"}`}>
                  {isModel ? <Bot size={12} strokeWidth={2.5} /> : <User size={12} strokeWidth={2.5} />}
                </div>
                <div className="chat-bubble-wrap">
                  <div className={`chat-bubble ${isModel ? "model" : "user"}`}>
                    <MessageContent text={msg.parts[0].text} />
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="chat-typing-row">
              <div className="chat-avatar model"><Bot size={12} strokeWidth={2.5} /></div>
              <TypingIndicator />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="chat-quick-prompts">
          {QUICK_PROMPTS.map(({ icon: Icon, label, text }) => (
            <button key={label} className="chip" onClick={() => onQuickPrompt(text)} disabled={isTyping}>
              <Icon size={10} />{label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="chat-input-box">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Ask for a hint, approach, or complexity..."
                className="chat-textarea"
                disabled={isTyping}
                onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(onSubmit)(); } }}
                {...register("message", { required: true, minLength: 2 })}
              />
              <button
                type="submit"
                className={`chat-send-btn ${watchedMessage?.length >= 2 ? "has-text" : ""}`}
                disabled={isTyping || !watchedMessage?.trim() || watchedMessage?.length < 2}
              >
                <Send size={14} strokeWidth={2.5} />
              </button>
            </div>
            <div className="chat-input-hint">Enter to send · Shift+Enter for new line</div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ChatAi;