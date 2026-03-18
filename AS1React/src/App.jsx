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
import { authComponents, authFormFields, authTheme } from './components/AuthLayout';
import { ThemeProvider } from '@aws-amplify/ui-react';
import { useTheme } from "./hooks/useTheme";

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

// ─── Logging helpers ───────────────────────────────────────────────────────
const log = (label, data) => {
  console.groupCollapsed(`[App] ${label}`);
  if (data !== undefined) console.log(data);
  console.groupEnd();
};

const logError = (label, err) => {
  console.group(`[App] ${label}`);
  console.error(err);
  console.groupEnd();
};
// ───────────────────────────────────────────────────────────────────────────

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [userId, setUserId] = useState(null);
  const { theme, toggleTheme } = useTheme();


  const sessionIdRef = useRef(null);
  useEffect(() => {
    sessionIdRef.current = sessionId;
    log("sessionId state → ref sync", { sessionId });
  }, [sessionId]);

  useEffect(() => {
    const init = async () => {
      log("init() started");
      const session = await fetchAuthSession();
      const uid = session.tokens.idToken?.payload?.sub;

      if (!uid) {
        log("init() — no userId yet, aborting");
        return;
      }

      log("User authenticated", { userId: uid });
      setUserId(uid);

      const sid = generateSessionId(uid);
      setSessionId(sid);
      sessionIdRef.current = sid;
      log("Initial sessionId generated", { sessionId: sid });

      await loadConversations(uid);
    };
    init();
  }, []);

  const loadConversations = async (uid) => {
    if (!uid) {
      log("loadConversations() — uid is empty, skipping");
      return;
    }
    log("loadConversations() called", { userId: uid });
    try {
      const token = await getAuthToken();
      const url = `${CONVERSATIONS_URL}?userId=${uid}`;
      log("GET conversations request", { url });

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      log("GET conversations response", { status: res.status, ok: res.ok });

      if (res.ok) {
        const data = await res.json();
        log("Conversations loaded", { count: data.conversations?.length, conversations: data.conversations });
        setConversations(data.conversations || []);
      } else {
        log("GET conversations non-OK response", { status: res.status });
      }
    } catch (err) {
      logError("loadConversations() failed", err);
    }
  };

  const saveConversation = async (sid, title, updatedMessages) => {
    log("saveConversation() called", { sessionId: sid, title, messageCount: updatedMessages.length });

    if (!sid) {
      log("saveConversation() — sessionId is empty, skipping");
      return;
    }

    try {
      const [token, uid] = await Promise.all([getAuthToken(), getUserId()]);

      if (!uid || !sid) {
        log("saveConversation() — uid or sid missing, skipping", { uid, sid });
        return;
      }

      const payload = {
        userId: uid,
        sessionId: sid,
        title,
        messages: updatedMessages,
        lastUpdated: new Date().toISOString()
      };
      log("POST conversations payload", payload);

      const res = await fetch(CONVERSATIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      log("POST conversations response", { status: res.status, ok: res.ok });
    } catch (err) {
      logError("saveConversation() failed", err);
    }
  };

  const handleNewChat = () => {
    log("handleNewChat() called", { previousSessionId: sessionIdRef.current });
    setMessages([]);
    setInput("");
    const sid = generateSessionId(userId);
    setSessionId(sid);
    sessionIdRef.current = sid;
    log("New sessionId generated", { sessionId: sid });
  };

  const handleSelectConversation = (conversation) => {
    log("handleSelectConversation() called", {
      selectedSessionId: conversation.sessionId,
      previousSessionId: sessionIdRef.current,
      messageCount: conversation.messages?.length
    });
    setSessionId(conversation.sessionId);
    sessionIdRef.current = conversation.sessionId;
    setMessages(conversation.messages || []);
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();

    log("handleSend() called", {
      prompt: trimmedInput,
      sessionId: sessionIdRef.current,
      sessionIdState: sessionId,
      sessionIdMatch: sessionIdRef.current === sessionId,
      currentMessageCount: messages.length,
      loading
    });

    if (!trimmedInput || loading) {
      log("handleSend() — blocked", { emptyInput: !trimmedInput, loading });
      return;
    }

    const currentSessionId = sessionIdRef.current;

    const newUserMessage = {
      role: "user",
      content: [{ text: trimmedInput }],
    };

    const historyToSend = [...messages];
    const isFirstMessage = historyToSend.length === 0;

    log("Message state before send", {
      historyLength: historyToSend.length,
      isFirstMessage,
      newMessage: newUserMessage
    });

    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);
    setInput("");

    try {
      const token = await getAuthToken();

      const requestPayload = {
        prompt: trimmedInput,
        session_id: currentSessionId,
      };

      log("POST /ask request", {
        url: API_URL,
        payload: requestPayload,
        sessionIdSent: currentSessionId
      });

      const startTime = Date.now();
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestPayload),
      });

      const duration = Date.now() - startTime;
      log("POST /ask response received", {
        status: response.status,
        ok: response.ok,
        durationMs: duration
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      log("POST /ask response body", {
        response: data.response,
        session_id: data.session_id,
        sessionIdMatch: data.session_id === currentSessionId
      });

      const agentMessage = {
        role: "assistant",
        content: [{ text: data.response }],
      };

      const updatedMessages = [...historyToSend, newUserMessage, agentMessage];
      log("Updated message list", {
        totalMessages: updatedMessages.length,
        messages: updatedMessages
      });

      setMessages(updatedMessages);

      const title = isFirstMessage
        ? trimmedInput.slice(0, 50)
        : conversations.find(c => c.sessionId === currentSessionId)?.title || trimmedInput.slice(0, 50);

      log("Conversation title resolved", { title, isFirstMessage });

      await saveConversation(currentSessionId, title, updatedMessages);

      setConversations((prev) => {
        const exists = prev.find(c => c.sessionId === currentSessionId);
        log("Updating sidebar conversations", {
          exists: !!exists,
          currentSessionId,
          totalConversations: prev.length
        });
        if (exists) {
          return prev.map(c =>
            c.sessionId === currentSessionId
              ? { ...c, messages: updatedMessages, lastUpdated: new Date().toISOString() }
              : c
          );
        }
        return [{
          sessionId: currentSessionId,
          title,
          messages: updatedMessages,
          lastUpdated: new Date().toISOString()
        }, ...prev];
      });

    } catch (err) {
      logError("handleSend() fetch failed", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: [{ text: "Error: Could not reach the AI agent." }] }
      ]);
    } finally {
      setLoading(false);
      log("handleSend() complete", { sessionId: currentSessionId });
    }
  };

  return (
    <ThemeProvider theme={authTheme}>
      <Authenticator components={authComponents} formFields={authFormFields}>
        {({ signOut, user }) => (
          <div className="flex flex-col h-screen bg-surface-950 text-brand-90/80 overflow-hidden">
            <Header user={user} onLogout={signOut} theme={theme} toggleTheme={toggleTheme} />
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
                <div className="bg-surface-900 shadow-2xl rounded-3xl p-6 w-full max-w-4xl h-full max-h-[85vh] flex flex-col overflow-hidden border border-surface-border">
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