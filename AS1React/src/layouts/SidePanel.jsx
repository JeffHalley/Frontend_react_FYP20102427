function SidePanel({ isOpen, toggleSidebar, conversations = [], onSelectConversation, onNewChat, activeSessionId }) {
  return (
    <div className="flex h-full">
      <aside className={`bg-surface-900 border-r border-surface-border transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${isOpen ? "w-64" : "w-0"}`}>
        <div className={`${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"} transition-all duration-300 ease-in-out delay-75 flex flex-col flex-1 overflow-hidden p-5`}>

          <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Your chats</h2>
            <button
              onClick={onNewChat}
              className="cursor-pointer text-xs text-text-muted hover:text-brand-100 transition-colors duration-200 px-2 py-1 rounded hover:bg-brand-90/10 font-medium"
            >
              + New
            </button>
          </div>

          <ul className="space-y-1 text-sm overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-surface-700 scrollbar-track-transparent">
            {conversations.length === 0 ? (
              <li className="text-text-muted text-xs px-3 py-2">No conversations yet</li>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.sessionId === activeSessionId;
                return (
                  <li
                    key={conv.sessionId}
                    onClick={() => onSelectConversation(conv)}
                    className={`cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group border-l-2 ${
                      isActive
                        ? "border-brand-90 bg-brand-90/10 text-text-primary"
                        : "border-transparent hover:border-surface-border hover:bg-surface-800 text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    <span className="truncate text-xs leading-relaxed">{conv.title || "Untitled"}</span>
                  </li>
                );
              })
            )}
          </ul>

        </div>
      </aside>

      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="bg-surface-900 border border-l-0 border-surface-border px-2 py-3 rounded-r-lg hover:bg-surface-800 text-text-muted hover:text-text-primary transition-all duration-200 flex items-center justify-center w-6 h-14 active:scale-95"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg
            className={`w-3 h-3 transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default SidePanel;