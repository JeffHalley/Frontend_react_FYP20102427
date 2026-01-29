function SidePanel({ isOpen, toggleSidebar }) {
  return (
    <div className="flex">
      {/* Collapsible sidebar */}
      <aside className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out overflow-hidden shadow-lg ${isOpen ? "w-64 p-6" : "w-0 p-0"}`}>
        <div className={`${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"} transition-all duration-300 ease-in-out delay-75 whitespace-nowrap`}>
          <h2 className="text-lg font-semibold mb-6 text-blue-400 border-b border-gray-700 pb-2">Your chats</h2>
          <ul className="space-y-3 text-sm">
            <li className="hover:text-blue-400 hover:bg-blue-400/10 cursor-pointer flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group">
              <span className="w-2 h-2 bg-green-400 rounded-full group-hover:bg-blue-400 transition-colors duration-200"></span>
              <span className="truncate">Sample chat1</span>
            </li>
            <li className="hover:text-blue-400 hover:bg-blue-400/10 cursor-pointer flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group">
              <span className="w-2 h-2 bg-green-400 rounded-full group-hover:bg-blue-400 transition-colors duration-200"></span>
              <span className="truncate">Sample chat2</span>
            </li>
            <li className="hover:text-blue-400 hover:bg-blue-400/10 cursor-pointer flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group">
              <span className="w-2 h-2 bg-green-400 rounded-full group-hover:bg-blue-400 transition-colors duration-200"></span>
              <span className="truncate">Sample chat3</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Toggle button */}
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="bg-gray-800 border border-l-0 border-gray-700 p-3 rounded-r-lg hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition-all duration-200 flex items-center justify-center min-w-[40px] h-14 shadow-md hover:shadow-lg active:scale-95"
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