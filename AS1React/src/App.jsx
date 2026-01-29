import { useState } from "react";
import Header from "./layouts/Header";
import Conversation from "./layouts/Conversation";
import Footer from "./layouts/Footer";
import SidePanel from "./layouts/SidePanel";

const API_URL = "https://9kdou5cfm0.execute-api.eu-west-1.amazonaws.com/ask";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Toggle state - open by default per requirement 4.1

  const handleSend = async () => {
    // Input validation - prevent empty or whitespace-only messages
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const userMessage = {
      role: "user",
      content: trimmedInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedInput }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const agentMessage = {
        role: "assistant",
        content: data.response,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Could not reach the AI agent." },
      ]);
    } finally {
      setLoading(false);
    }
  };

return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <SidePanel isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 flex flex-col items-center justify-center p-4 transition-all duration-300 ease-in-out">
          <div className="bg-white shadow-lg rounded-3xl p-6 w-full max-w-4xl h-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
            <Conversation
              input={input}
              setInput={setInput}
              messages={messages}
              loading={loading}
              handleSend={handleSend}
            />
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
export default App;
