function Header({ user, onLogout, theme, toggleTheme, onOpenExplorer }) {
  const userId = user?.username || user?.userId || "Guest";

  return (
    <header className="w-full bg-surface-950 border-b border-surface-border py-3 px-6 z-10 flex justify-between items-center shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-[0.2em] text-brand-90 uppercase whitespace-nowrap">
            QueryOps AI
          </span>

          <div className="relative group flex items-center cursor-help">
            <svg
              className="w-3.5 h-3.5 text-brand-90 opacity-70 group-hover:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>

            <div className="absolute top-full left-0 mt-2 w-[600px] p-4 bg-surface-900 border border-surface-border text-text-primary text-sm font-normal tracking-normal normal-case rounded-md shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none flex flex-col gap-3">

              <div>
                <strong className="text-base block mb-1 text-text-primary">About this Application</strong>
                <p className="text-xs leading-relaxed text-text-secondary">
                  This app allows you to retrieve, filter, and understand monitoring data using plain English. You don't need specialist knowledge of complex database query languages to investigate alerts. The system translates your questions into structured queries and returns the results as easy-to-read explanations designed to accelerate incident troubleshooting.
                </p>
              </div>

              <hr className="border-surface-border opacity-50" />

              <div>
                <strong className="text-sm block mb-2 text-text-primary">Example Queries</strong>
                <p className="text-xs mb-3 text-text-secondary">Ask about host metrics, app performance, team assignments, or health statuses:</p>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <ul className="list-none space-y-3">
                    <li className="text-text-secondary">
                      <span className="text-text-muted block mb-0.5 font-semibold">Check Infrastructure</span>
                      "What is the CPU load for InfraSrv1Host over the last hour?"
                    </li>
                    <li className="text-text-secondary">
                      <span className="text-text-muted block mb-0.5 font-semibold">Monitor Applications</span>
                      "Show the 5 most recent response times for WebSrvA."
                    </li>
                    <li className="text-text-secondary">
                      <span className="text-text-muted block mb-0.5 font-semibold">Check User Experience</span>
                      "What is the current user count and apdex for InternalC?"
                    </li>
                    <li className="text-text-secondary">
                      <span className="text-text-muted block mb-0.5 font-semibold">Investigate Health</span>
                      "Show me all unhealthy metrics in the last 30 minutes."
                    </li>
                  </ul>

                  <ul className="list-none space-y-3">
                    <li className="text-text-secondary">
                      <span className="text-text-muted block mb-0.5 font-semibold">Filter by Team</span>
                      "Are there any unhealthy HTTP pings for the AetherisDevelopers group?"
                    </li>
                    <li className="text-text-secondary">
                      <span className="text-text-muted block mb-0.5 font-semibold">Network & Disk</span>
                      "Check the network latency and disk space used on InfraSrv10Host."
                    </li>
                    <li className="text-text-secondary">
                      <span className="text-text-muted block mb-0.5 font-semibold">Map Dependencies</span>
                      "What app name is InfraSrv4Host tied to?"
                    </li>
                    <li className="text-text-secondary">
                      <span className="text-text-muted block mb-0.5 font-semibold">Follow-up Questions</span>
                      "What about the memory usage on that same server?"
                    </li>
                  </ul>
                </div>
              </div>

              <hr className="border-surface-border opacity-50" />

              <div>
                <strong className="text-sm block mb-1 text-text-primary">Features</strong>
                <ul className="list-disc list-outside ml-4 text-xs space-y-1.5 text-text-secondary">
                  <li><strong className="text-text-primary">Alerting:</strong> If the assistant finds unhealthy metrics, it can send an automated email alert upon request.</li>
                  <li><strong className="text-text-primary">Conversational Context:</strong> The assistant remembers your session for 60 minutes. If you just asked about <em>"WinAppB"</em>, you can simply ask <em>"What's the error rate?"</em> in your next message.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        <div className="h-px w-full bg-surface-border opacity-40"></div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-[10px] text-text-muted uppercase font-semibold tracking-widest">User ID</p>
          <p className="text-xs text-text-secondary font-mono truncate max-w-[200px]" title={userId}>
            {userId}
          </p>
        </div>

        <button
          onClick={onOpenExplorer}
          className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 border border-surface-border hover:border-brand-80/50 hover:bg-surface-800 text-text-muted hover:text-brand-90 text-xs rounded-lg transition-all duration-200"
          aria-label="Open data explorer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
          <span className="tracking-wide font-medium uppercase text-[10px]">Explorer</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 cursor-pointer rounded-lg border border-surface-border hover:bg-surface-800 text-text-muted hover:text-text-primary transition-all duration-200"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
            </svg>
          )}
        </button>

        <button
          onClick={onLogout}
          className="px-3 py-1.5 cursor-pointer bg-brand-10/10 hover:bg-brand-10/20 border border-brand-10/30 hover:border-brand-10/50 text-brand-10 text-xs rounded-lg transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;