import { useState, useEffect } from "react";
import Header from "./layouts/Header";
import Conversation from "./layouts/Conversation";
import Footer from "./layouts/Footer";
import SidePanel from "./layouts/SidePanel";
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import { authComponents, authFormFields, authTheme } from './components/AuthLayout';
import { ThemeProvider } from '@aws-amplify/ui-react';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_InEmJzi7l',
      userPoolClientId: '5drb7ldq84uohj7bsqf7jap0u4'
    }
  }
});

const API_URL = "https://nqwrxqgze5.execute-api.eu-west-1.amazonaws.com/ask";
const CONVERSATIONS_URL = "https://nqwrxqgze5.execute-api.eu-west-1.amazonaws.com/conversations";

const generateSessionId = (userId) => `${userId}-${crypto.randomUUID()}`;

const getAuthToken = async () => {
  const session = await fetchAuthSession();
  return session.tokens.idToken?.toString();
};

const getUserId = async () => {
  const session = await fetchAuthSession();
  return session.tokens.idToken?.payload?.sub;
};

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [userId, setUserId] = useState(null);

  // Fetch userId from JWT on load and initialise a session
  useEffect(() => {
    const init = async () => {
      const session = await fetchAuthSession();
      const uid = session.tokens.idToken?.payload?.sub;
      setUserId(uid);
      setSessionId(generateSessionId(uid));
      await loadConversations(uid);
    };
    init();
  }, []);

const loadConversations = async () => {
  try {
    const [token, uid] = await Promise.all([getAuthToken(), getUserId()]);
    const res = await fetch(`${CONVERSATIONS_URL}?userId=${uid}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations || []);
    }
  } catch (err) {
    console.error("Failed to load conversations:", err);
  }
};

const saveConversation = async (sid, title, updatedMessages) => {
  try {
    const [token, uid] = await Promise.all([getAuthToken(), getUserId()]);
    await fetch(CONVERSATIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: uid,
        sessionId: sid,
        title,
        messages: updatedMessages,
        lastUpdated: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error("Failed to save conversation:", err);
  }
};

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setSessionId(generateSessionId(userId));
  };

  const handleSelectConversation = (conversation) => {
    setSessionId(conversation.sessionId);
    setMessages(conversation.messages || []);
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const newUserMessage = {
      role: "user",
      content: [{ text: trimmedInput }],
    };

    const historyToSend = [...messages];
    const isFirstMessage = historyToSend.length === 0;

    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);
    setInput("");

    try {
      const token = await getAuthToken();

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: trimmedInput,
          session_id: sessionId,
          messages: historyToSend
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      const agentMessage = {
        role: "assistant",
        content: [{ text: data.response }],
      };

      const updatedMessages = data.history || [...historyToSend, newUserMessage, agentMessage];
      setMessages(updatedMessages);

      // Auto-title from first user message (truncated to 50 chars)
      const title = isFirstMessage
        ? trimmedInput.slice(0, 50)
        : conversations.find(c => c.sessionId === sessionId)?.title || trimmedInput.slice(0, 50);

      await saveConversation(sessionId, title, updatedMessages);

      // Update local sidebar list
      setConversations((prev) => {
        const exists = prev.find(c => c.sessionId === sessionId);
        if (exists) {
          return prev.map(c =>
            c.sessionId === sessionId
              ? { ...c, messages: updatedMessages, lastUpdated: new Date().toISOString() }
              : c
          );
        }
        return [{
          sessionId,
          title,
          messages: updatedMessages,
          lastUpdated: new Date().toISOString()
        }, ...prev];
      });

    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: [{ text: "Error: Could not reach the AI agent." }] }
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
                conversations={conversations}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
                activeSessionId={sessionId}
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