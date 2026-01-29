function SidePanel({ isOpen, toggleSidebar }) {
  return (
    <div className="flex">
      <aside className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 overflow-hidden ${isOpen ? "w-64 p-6" : "w-0 p-0"}`}>
        <div className={`${isOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300 whitespace-nowrap`}>
          <h2 className="text-lg font-semibold mb-4 text-blue-400">Your chats</h2>
          <ul className="space-y-4 text-sm">
            <li className="hover:text-blue-400 cursor-pointer flex items-center gap-2">Sample chat1</li>
            <li className="hover:text-blue-400 cursor-pointer flex items-center gap-2">Sample chat2</li>
            <li className="hover:text-blue-400 cursor-pointer flex items-center gap-2">Sample chat3</li>
          </ul>
        </div>
      </aside>

      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="bg-gray-800 border border-l-0 border-gray-700 p-1 rounded-r-md hover:bg-gray-700 text-gray-400"
        >
          {isOpen ? "❮" : "❯"}
        </button>
      </div>
    </div>
  );
}

export default SidePanel;