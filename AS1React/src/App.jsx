import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleSend = () => {
    // For demonstration, we'll just echo the input to output, placeholder for real logic
    setOutput(input);
    setInput("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          UI Test Panel
        </h1>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Send
          </button>
        </div>

        <div className="border border-gray-300 rounded-lg p-4 h-32 overflow-auto bg-gray-50 text-gray-700">
          {output ? output : <span className="text-gray-400">Output will appear here...</span>}
        </div>
      </div>
    </div>
  );
}

export default App;
