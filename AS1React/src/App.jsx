import { useState, useEffect, useRef } from "react";
import Header from "./layouts/Header";
import Conversation from "./layouts/Conversation";
import Footer from "./layouts/Footer";
import SidePanel from "./layouts/SidePanel";
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import { createAuthComponents, authFormFields, authTheme } from './components/AuthLayout';
import { ThemeProvider } from '@aws-amplify/ui-react';
import { useTheme } from "./hooks/useTheme";
import WikiPage from "./components/WikiPage";
import DataExplorer from "./components/DataExplorer";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_InEmJzi7l',
      userPoolClientId: '5drb7ldq84uohj7bsqf7jap0u4',
      loginWith: {
        email: true
      }
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

const logError = (label, err) => {
  console.group(`[App] ${label}`);
  console.error(err);
  console.groupEnd();
};

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showWiki, setShowWiki] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const authComponents = createAuthComponents(() => setShowWiki(true));

  const sessionIdRef = useRef(null);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    const init = async () => {
      const session = await fetchAuthSession();
      const uid = session.tokens.idToken?.payload?.sub;
      if (!uid) return;
      setUserId(uid);
      const sid = generateSessionId(uid);
      setSessionId(sid);
      sessionIdRef.current = sid;
      await loadConversations(uid);
    };
    init();
  }, []);

  const loadConversations = async (uid) => {
    if (!uid) return;
    try {
      const token = await getAuthToken();
      const res = await fetch(`${CONVERSATIONS_URL}?userId=${uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      logError("loadConversations() failed", err);
    }
  };

  const saveConversation = async (sid, title, updatedMessages) => {
    if (!sid) return;
    try {
      const [token, uid] = await Promise.all([getAuthToken(), getUserId()]);
      if (!uid || !sid) return;
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
      logError("saveConversation() failed", err);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    const sid = generateSessionId(userId);
    setSessionId(sid);
    sessionIdRef.current = sid;
  };

  const handleSelectConversation = (conversation) => {
    setSessionId(conversation.sessionId);
    sessionIdRef.current = conversation.sessionId;
    setMessages(conversation.messages || []);
  };

  // Called by DataExplorer - sets the input and immediately sends
  const handleExplorerQuery = (prompt) => {
    setInput(prompt);
    // Use a short timeout so the input state flushes before handleSend reads it
    setTimeout(() => {
      handleSendWithPrompt(prompt);
    }, 0);
  };

  const handleSendWithPrompt = async (prompt) => {
    const trimmedInput = prompt.trim();
    if (!trimmedInput || loading) return;

    const currentSessionId = sessionIdRef.current;
    const newUserMessage = { role: "user", content: [{ text: trimmedInput }] };
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
        body: JSON.stringify({ prompt: trimmedInput, session_id: currentSessionId }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();

      const agentMessage = { role: "assistant", content: [{ text: data.response }] };
      const updatedMessages = [...historyToSend, newUserMessage, agentMessage];
      setMessages(updatedMessages);

      const title = isFirstMessage
        ? trimmedInput.slice(0, 50)
        : conversations.find(c => c.sessionId === currentSessionId)?.title || trimmedInput.slice(0, 50);

      await saveConversation(currentSessionId, title, updatedMessages);

      setConversations((prev) => {
        const exists = prev.find(c => c.sessionId === currentSessionId);
        if (exists) {
          return prev.map(c =>
            c.sessionId === currentSessionId
              ? { ...c, messages: updatedMessages, lastUpdated: new Date().toISOString() }
              : c
          );
        }
        return [{ sessionId: currentSessionId, title, messages: updatedMessages, lastUpdated: new Date().toISOString() }, ...prev];
      });

    } catch (err) {
      logError("handleSend() failed", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: [{ text: "Error: Could not reach the AI agent." }] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    await handleSendWithPrompt(input);
  };

  if (showWiki) {
    return <WikiPage onBack={() => setShowWiki(false)} />;
  }

  return (
    <ThemeProvider theme={authTheme}>
      <Authenticator components={authComponents} formFields={authFormFields}>
        {({ signOut, user }) => (
          <div className="flex flex-col h-screen bg-surface-950 text-text-primary overflow-hidden">
            <Header
              user={user}
              onLogout={signOut}
              theme={theme}
              toggleTheme={toggleTheme}
              onOpenExplorer={() => setIsExplorerOpen(true)}
            />
            <div className="flex flex-1 overflow-hidden">
              <SidePanel
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                conversations={conversations}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
                activeSessionId={sessionId}
              />
              <main className="flex-1 flex flex-col overflow-hidden p-6">
                <Conversation
                  input={input}
                  setInput={setInput}
                  messages={messages}
                  loading={loading}
                  handleSend={handleSend}
                />
                <Footer />
              </main>
            </div>

            <DataExplorer
              isOpen={isExplorerOpen}
              onClose={() => setIsExplorerOpen(false)}
              onSendQuery={handleExplorerQuery}
            />
          </div>
        )}
      </Authenticator>
    </ThemeProvider>
  );
}

export default App;