import { useState } from "react";

const API_URL = "https://gocy869z5b.execute-api.eu-west-1.amazonaws.com/ask";

function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setOutput(""); // Clear previous output
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setOutput(data.response);
    } catch (error) {
      console.error("Error calling Bedrock:", error);
      setOutput("Error: Could not reach the AI agent.");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-6 text-gray-900">
          Bedrock AI Agent
        </h1>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask the agent something..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>

        <div className="border border-gray-300 rounded-lg p-4 h-48 overflow-auto bg-gray-50 text-gray-700 whitespace-pre-wrap">
          {loading ? (
            <span className="text-gray-400 italic">Agent is thinking...</span>
          ) : output ? (
            output
          ) : (
            <span className="text-gray-400">Output will appear here...</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;