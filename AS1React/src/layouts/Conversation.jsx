// Conversation.js
function Conversation({ input, setInput, messages, loading, handleSend }) {
  return (
    // min-h-0 is critical here to allow the flex child to shrink/scroll
    <div className="flex flex-col flex-1 min-h-0"> 
      
      {/* Message history */}
      <div className="flex-1 overflow-y-auto mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
        {messages.length === 0 && (
          <p className="text-black text-center">
            Ask the agent something to begin…
          </p>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
              msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-200 text-gray-800 rounded-bl-none"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start italic text-gray-500 text-sm">Agent thinking...</div>
        )}
      </div>

      {/* Input - stays at bottom of the white box */}
      <div className="flex gap-2 pt-2">
        <input
          type="text"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask something..."
          className="flex-1 px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Send
        </button>
      </div>
    </div>
  );
}

export default Conversation;