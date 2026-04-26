// components/DataExplorer.jsx
import { useState } from "react";

const TEAMS = {
  Aetheris: {
    color: "#4895ef",
    apps: [
      { name: "WebSrvA",   id: 11001 },
      { name: "WinAppA",   id: 11002 },
      { name: "InternalA", id: 11003 },
    ],
    infra: [
      { name: "InfraSrv1",  id: 11101 },
      { name: "InfraSrv2",  id: 11102 },
      { name: "InfraSrv3",  id: 11103 },
    ],
  },
  Nexum: {
    color: "#4361ee",
    apps: [
      { name: "WebSrvB",   id: 22001 },
      { name: "WinAppB",   id: 22002 },
      { name: "InternalB", id: 22003 },
    ],
    infra: [
      { name: "InfraSrv4",  id: 22101 },
      { name: "InfraSrv5",  id: 22102 },
      { name: "InfraSrv6",  id: 22103 },
    ],
  },
  Elyssium: {
    color: "#4cc9f0",
    apps: [
      { name: "WebSrvC",   id: 33001 },
      { name: "WinAppC",   id: 33002 },
      { name: "InternalC", id: 33003 },
    ],
    infra: [
      { name: "InfraSrv7",  id: 33101 },
      { name: "InfraSrv8",  id: 33102 },
      { name: "InfraSrv9",  id: 33103 },
    ],
  },
  Dynamis: {
    color: "#b5179e",
    apps: [
      { name: "WebSrvD",   id: 44001 },
      { name: "WinAppD",   id: 44002 },
      { name: "InternalD", id: 44003 },
    ],
    infra: [
      { name: "InfraSrv10", id: 44101 },
      { name: "InfraSrv11", id: 44102 },
      { name: "InfraSrv12", id: 44103 },
    ],
  },
};

const APP_CHECKS = [
  { name: "http_ping",          tool: "Nagios"    },
  { name: "response_time",      tool: "Dynatrace" },
  { name: "error_rate",         tool: "Splunk"    },
  { name: "dynatrace_synth",    tool: "Dynatrace" },
  { name: "current_user_count", tool: "Nagios"    },
  { name: "apdex",              tool: "Splunk"    },
];

const HOST_CHECKS = [
  { name: "cpu_load",        tool: "Nagios" },
  { name: "memory_usage",    tool: "Nagios" },
  { name: "disk_space_used", tool: "Nagios" },
  { name: "disk_capacity",   tool: "Nagios" },
  { name: "uptime",          tool: "Nagios" },
  { name: "net_throughput",  tool: "Nagios" },
  { name: "net_latency",     tool: "Nagios" },
];

function buildPrompt(server, check, type, team) {
  const group = `${team}Developers`;
  if (type === "app") {
    if (check === "http_ping")          return `What is the current http_ping status for ${server}?`;
    if (check === "response_time")      return `Show me the latest response_time for ${server} in the ${group} assignment group.`;
    if (check === "error_rate")         return `What is the error_rate for ${server} over the last hour?`;
    if (check === "dynatrace_synth")    return `Has the dynatrace_synth check passed or failed recently for ${server}?`;
    if (check === "current_user_count") return `How many current users are on ${server} right now?`;
    if (check === "apdex")              return `What is the apdex score for ${server}?`;
  } else {
    if (check === "cpu_load")        return `What is the current cpu_load on ${server}?`;
    if (check === "memory_usage")    return `Show me the memory_usage for ${server} in the ${group} group.`;
    if (check === "disk_space_used") return `How much disk_space_used is on ${server}?`;
    if (check === "disk_capacity")   return `What is the total disk_capacity of ${server}?`;
    if (check === "uptime")          return `What is the uptime of ${server}?`;
    if (check === "net_throughput")  return `Show the net_throughput for ${server} over the last snapshot.`;
    if (check === "net_latency")     return `What is the net_latency on ${server}?`;
  }
  return `Show me ${check} for ${server}.`;
}

function DataExplorer({ isOpen, onClose, onSendQuery }) {
  const [activeTeam, setActiveTeam] = useState(null);
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedCheck, setSelectedCheck] = useState(null);

  const handleSelectTeam = (team) => {
    setActiveTeam(team);
    setSelectedServer(null);
    setSelectedCheck(null);
  };

  const handleSelectServer = (server) => {
    setSelectedServer(server);
    setSelectedCheck(null);
  };

  const handleSelectCheck = (check) => {
    setSelectedCheck(check);
  };

  const handleSend = () => {
    if (!selectedServer || !selectedCheck || !activeTeam) return;
    const prompt = buildPrompt(
      selectedServer.name,
      selectedCheck.name,
      selectedServer.type,
      activeTeam
    );
    onSendQuery(prompt);
    onClose();
  };

  const checks = selectedServer
    ? selectedServer.type === "app" ? APP_CHECKS : HOST_CHECKS
    : [];

  const previewPrompt = selectedServer && selectedCheck
    ? buildPrompt(selectedServer.name, selectedCheck.name, selectedServer.type, activeTeam)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[560px] bg-surface-900 border-l border-surface-border z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-brand-90 uppercase">
              Data Explorer
            </span>
            <span className="text-[10px] text-text-muted border border-surface-border rounded px-2 py-0.5 font-mono">
              4 teams · 24 servers
            </span>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-lg hover:bg-surface-800 text-text-muted hover:text-text-primary transition-all duration-200"
            aria-label="Close data explorer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Team list */}
          <div className="w-40 shrink-0 border-r border-surface-border overflow-y-auto">
            {Object.keys(TEAMS).map((team) => (
              <button
                key={team}
                onClick={() => handleSelectTeam(team)}
                className={`cursor-pointer w-full text-left px-4 py-3 text-xs flex items-center justify-between border-b border-surface-border transition-all duration-150 ${
                  activeTeam === team
                    ? "bg-surface-800 text-text-primary font-medium"
                    : "text-text-muted hover:bg-surface-800 hover:text-text-secondary"
                }`}
              >
                <span>{team}</span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: TEAMS[team].color }}
                />
              </button>
            ))}
          </div>

          {/* Right panel */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

            {!activeTeam && (
              <div className="flex items-center justify-center h-full">
                <p className="text-text-muted text-xs">Select a team to browse its servers</p>
              </div>
            )}

            {activeTeam && (
              <>
                {/* Assignment group tag */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Assignment group</span>
                  <span className="text-[10px] font-mono text-brand-90 border border-surface-border rounded px-2 py-0.5">
                    {activeTeam}Developers
                  </span>
                </div>

                {/* App servers */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">App servers</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TEAMS[activeTeam].apps.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => handleSelectServer({ ...s, type: "app" })}
                        className={`cursor-pointer text-left px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                          selectedServer?.name === s.name
                            ? "border-brand-80/60 bg-brand-80/10 text-text-primary"
                            : "border-surface-border hover:border-surface-600 hover:bg-surface-800 text-text-muted hover:text-text-secondary"
                        }`}
                      >
                        <p className="text-xs font-medium truncate">{s.name}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">ID {s.id}</p>
                        <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 inline-block px-1.5 py-0.5 rounded ${
                          selectedServer?.name === s.name ? "bg-brand-80/20 text-brand-90" : "bg-surface-700 text-text-muted"
                        }`}>app</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Infra servers */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">Infra servers</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TEAMS[activeTeam].infra.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => handleSelectServer({ ...s, type: "host" })}
                        className={`cursor-pointer text-left px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                          selectedServer?.name === s.name
                            ? "border-brand-90/60 bg-brand-90/10 text-text-primary"
                            : "border-surface-border hover:border-surface-600 hover:bg-surface-800 text-text-muted hover:text-text-secondary"
                        }`}
                      >
                        <p className="text-xs font-medium truncate">{s.name}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">ID {s.id}</p>
                        <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 inline-block px-1.5 py-0.5 rounded ${
                          selectedServer?.name === s.name ? "bg-brand-90/20 text-brand-100" : "bg-surface-700 text-text-muted"
                        }`}>infra</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checks */}
                {selectedServer && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">
                      Available checks - <span className="text-brand-90 normal-case">{selectedServer.name}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {checks.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => handleSelectCheck(c)}
                          className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all duration-150 ${
                            selectedCheck?.name === c.name
                              ? "border-brand-80/60 bg-brand-80/10 text-text-primary"
                              : "border-surface-border hover:border-surface-600 hover:bg-surface-800 text-text-muted hover:text-text-secondary"
                          }`}
                        >
                          <span>{c.name}</span>
                          <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                            selectedCheck?.name === c.name ? "bg-brand-80/20 text-brand-90" : "bg-surface-700 text-text-muted"
                          }`}>{c.tool}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Query preview */}
                {previewPrompt && (
                  <div className="mt-auto">
                    <div className="border border-surface-border rounded-xl p-4 bg-surface-800 flex flex-col gap-3">
                      <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Query preview</p>
                      <p className="text-xs text-text-secondary font-mono leading-relaxed">{previewPrompt}</p>
                      <button
                        onClick={handleSend}
                        className="cursor-pointer w-full py-2.5 px-4 bg-brand-80 hover:bg-brand-90 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-md shadow-brand-80/20 hover:shadow-brand-90/30 active:scale-95"
                      >
                        Send this query →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default DataExplorer;
