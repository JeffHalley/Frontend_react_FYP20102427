import { useEffect, useRef } from "react";

function Conversation({ input, setInput, messages, loading, handleSend }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 min-h-0">

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-surface-700 scrollbar-track-transparent">
        <div className="max-w-2xl mx-auto py-4 space-y-6">

          {messages.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <p className="text-text-muted text-sm font-medium">
                Ask the agent something to begin…
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-text-muted mb-1 px-1">
                {msg.role === "user" ? "You" : "Agent"}
              </span>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-brand-80 text-white rounded-br-sm shadow-md shadow-brand-80/20"
                  : "bg-surface-800 text-text-primary rounded-bl-sm border border-surface-border"
              }`}>
                {Array.isArray(msg.content)
                  ? (msg.content[0].text || JSON.stringify(msg.content[0], null, 2))
                  : msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-text-muted mb-1 px-1">Agent</span>
              <div className="bg-surface-800 border border-surface-border rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-brand-90/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-brand-90/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-brand-90/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-surface-border pt-4">
        <div className="max-w-2xl mx-auto flex gap-3 items-center">
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
            placeholder="Ask something..."
            className="flex-1 px-4 py-3 bg-surface-800 border border-surface-border text-text-primary rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-80/60 focus:border-brand-80/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 placeholder:text-text-muted text-sm"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="cursor-pointer px-6 py-3 bg-brand-80 hover:bg-brand-90 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-md shadow-brand-80/20 hover:shadow-brand-90/30 active:scale-95 shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Conversation;