function SidePanel({ isOpen, toggleSidebar, conversations = [], onSelectConversation, onNewChat, activeSessionId }) {
  return (
    <div className="flex">
      <aside className={`bg-surface-900 border-r border-surface-border transition-all duration-300 ease-in-out overflow-hidden shadow-xl ${isOpen ? "w-64 p-6" : "w-0 p-0"}`}>
        <div className={`${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"} transition-all duration-300 ease-in-out delay-75 whitespace-nowrap`}>

          <div className="flex items-center justify-between border-b border-surface-border pb-2 mb-6">
            <h2 className="text-lg font-semibold text-brand-90">Your chats</h2>
            <button
              onClick={onNewChat}
              className="text-xs text-brand-90/50 hover:text-brand-100 transition-colors duration-200 px-2 py-1 rounded hover:bg-brand-90/10"
            >
              + New
            </button>
          </div>

          <ul className="space-y-3 text-sm">
            {conversations.length === 0 ? (
              <li className="text-brand-80/30 text-sm px-3">No conversations yet</li>
            ) : (
              conversations.map((conv) => (
                <li
                  key={conv.sessionId}
                  onClick={() => onSelectConversation(conv)}
                  className={`hover:text-brand-100 hover:bg-brand-90/10 cursor-pointer flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group
                    ${conv.sessionId === activeSessionId ? "text-brand-100 bg-brand-90/10" : "text-brand-80/50"}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-200
                    ${conv.sessionId === activeSessionId ? "bg-brand-100" : "bg-brand-70/60 group-hover:bg-brand-90"}`}
                  />
                  <span className="truncate">{conv.title || "Untitled"}</span>
                </li>
              ))
            )}
          </ul>

        </div>
      </aside>

      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="bg-surface-900 border border-l-0 border-surface-border p-3 rounded-r-lg hover:bg-surface-800 text-brand-80/40 hover:text-brand-100 transition-all duration-200 flex items-center justify-center min-w-10 h-14 shadow-md active:scale-95"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default SidePanel;