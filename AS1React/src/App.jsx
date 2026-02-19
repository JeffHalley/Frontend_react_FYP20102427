import { useState } from "react";
import Header from "./layouts/Header";
import Conversation from "./layouts/Conversation";
import Footer from "./layouts/Footer";
import SidePanel from "./layouts/SidePanel";
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth'; // To get the token
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import { authComponents, authFormFields, authTheme } from './components/AuthLayout';
import { ThemeProvider } from '@aws-amplify/ui-react';

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_InEmJzi7l',
      userPoolClientId: '5drb7ldq84uohj7bsqf7jap0u4'
    }
  }
});

const API_URL = "https://nqwrxqgze5.execute-api.eu-west-1.amazonaws.com/ask";


function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    // 1. Prepare the new local message for immediate UI update
    const newUserMessage = {
      role: "user",
      content: [{ text: trimmedInput }],
    };

    // Update UI immediately for responsiveness
    // keep 'messages' as the history to send to the backend
    const historyToSend = [...messages];
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);
    setInput("");

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken?.toString();
      // 2. Send the OLD history + the NEW prompt
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: trimmedInput,
          messages: historyToSend
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // 3. Sync state with the full history from the server
      // This includes the prompt we just sent AND the AI response
      if (data.history) {
        setMessages(data.history);
      } else {
        const agentMessage = {
          role: "assistant",
          content: [{ text: data.response }],
        };
        setMessages((prev) => [...prev, agentMessage]);
      }

    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: [{ text: "Error: Could not reach the AI agent." }]
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={authTheme}>
      <Authenticator components={authComponents} formFields={authFormFields}>
        {({ signOut, user }) => (
          <div className="flex flex-col h-screen bg-gray-900 text-gray-100 overflow-hidden">
            <Header user={user} onLogout={signOut} />
            <div className="flex flex-1 overflow-hidden">
              <SidePanel
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />
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
        )}
      </Authenticator>
    </ThemeProvider>
  );
}

export default App;