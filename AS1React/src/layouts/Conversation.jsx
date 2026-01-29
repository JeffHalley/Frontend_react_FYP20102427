// Conversation.js
function Conversation({ input, setInput, messages, loading, handleSend }) {
  return (
    // min-h-0 is critical here to allow the flex child to shrink/scroll
    <div className="flex flex-col flex-1 min-h-0"> 
      
      {/* Message history */}
      <div className="flex-1 overflow-y-auto mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {messages.length === 0 && (
          <p className="text-gray-600 text-center font-medium py-8">
            Ask the agent something to begin…
          </p>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap shadow-sm transition-all duration-200 hover:shadow-md ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-br-md" 
                : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start italic text-gray-500 text-sm">Agent thinking...</div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <input
          type="text"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask something..."
          className="flex-1 px-4 py-3 border text-gray-800 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 placeholder-gray-500"
        />
        <button 
          onClick={handleSend} 
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Conversation;