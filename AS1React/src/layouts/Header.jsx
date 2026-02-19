function Header({ user, onLogout }) {
  const userId = user?.userId || "Guest";

  return (
    <header className="w-full bg-gray-800 border-b border-gray-700 py-4 px-6 shadow-lg z-10 flex justify-between items-center">
      {/* Left Side */}
      <h1 className="text-xl font-bold text-white tracking-tight">
        Bedrock <span className="text-blue-500 drop-shadow-sm">AI</span>
      </h1>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase font-semibold">User ID</p>
          <p 
            className="text-sm text-gray-200 font-mono" 
            title={userId} // Shows full ID
          >
            {userId}
          </p>
        </div>
        
        <button 
          onClick={onLogout}
          className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;