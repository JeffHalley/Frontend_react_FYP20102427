function Header({ user, onLogout, theme, toggleTheme }) {
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
            
            <div className="absolute top-full left-0 mt-2 w-48 p-2.5 bg-surface-900 border border-surface-border text-text-primary text-xs font-normal tracking-normal normal-case rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
              How to use this app:
              <ul className="list-disc list-inside mt-1">
                <li>Click on the info icon for more details</li>
                <li>Hover over fields for additional guidance</li>
              </ul>
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