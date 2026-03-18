function Conversation({ input, setInput, messages, loading, handleSend }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">

      <div className="flex-1 overflow-y-auto mb-6 p-4 border border-surface-border rounded-xl bg-surface-950 space-y-4 scrollbar-thin scrollbar-thumb-surface-700 scrollbar-track-surface-900">
        {messages.length === 0 && (
          <p className="text-brand-80/30 text-center font-medium py-8">
            Ask the agent something to begin…
          </p>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap transition-all duration-200 hover:shadow-md ${
              msg.role === "user"
                ? "bg-brand-80 text-white rounded-br-md shadow-sm shadow-brand-80/30"
                : "bg-surface-800 text-brand-90/80 rounded-bl-md border border-surface-border"
            }`}>
              {Array.isArray(msg.content) ? (msg.content[0].text || JSON.stringify(msg.content[0], null, 2)) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start italic text-brand-80/30 text-sm">Agent thinking...</div>
        )}
      </div>

      <div className="flex gap-3 pt-2 border-t border-surface-border">
        <input
          type="text"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
          placeholder="Ask something..."
          className="flex-1 px-4 py-3 bg-surface-900 border border-surface-border text-brand-90/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-80/50 focus:border-brand-80/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 placeholder-brand-80/20"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-6 py-3 bg-brand-80 hover:bg-brand-90 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md shadow-brand-80/20 hover:shadow-brand-90/30 active:scale-95"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Conversation;