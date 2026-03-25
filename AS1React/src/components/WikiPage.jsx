import { useState } from "react";

const PAGES = [
  {
    id: "overview",
    title: "Overview",
    content: `
# Natural Language to SQL Query System

In modern enterprise environments operating at scale, the monitoring of applications and infrastructure is often delegated to a specialized monitoring team rather than handled by individual development teams. As a result, the collected data frequently becomes siloed within that team. When incidents occur, application developers often lack direct access to monitoring logs and metrics. This increases the average time required to remediate an incident, which directly impacts the business by reducing operational stability and eroding customer trust. This project is architected from the ground up specifically to address this problem.

This project delivers an end-to-end Agentic AI solution that enables natural language querying of monitoring data, By removing technical barriers to data access for developers and engineers, the system enables teams to use monitoring data as contextual input for real-time incident triage without requiring expertise in the underlying monitoring tools.

## What does it do?

Instead of requiring users to write SQL or understand the database schema, the system accepts natural language questions and automatically orchestrates a reasoning chain, translates intent into valid PostgreSQL, executes the query securely, and returns a conversational summary of the monitoring data.

Conversation history is persisted in DynamoDB.

## Key Features

- Natural language to SQL translation via Amazon Bedrock Agent
- Secure query execution via Action Group and database connector Lambda
- Conversational response summaries returned to the user
- Full conversation history stored in DynamoDB

## Tech Stack

| Technology |  Purpose |
|------------| ---------|
| React | Polished Frontend UI |
| API Gateway | Exposes REST endpoints secured with Cognito JWT auth |
| AWS Lambda |  Serverless logic and DB connectivity |
| Amazon Bedrock | Agent for SQL generation |
| DynamoDB | Conversation history storage |
| AWS EC2 | PostgreSQL hosting |
| PostgreSQL | Metrics data storage |
| Terraform |  Infrastructure as Code |
| Cognito | Identity management and JWT auth |
    `,
  },
  {
    id: "architecture",
    title: "Architecture",
    content: `
# Architecture

The system follows a serverless pattern with clear separation of concerns, deployed in \`eu-west-1\`. All traffic between Lambda and Bedrock, and DynamoDB traverses VPC Endpoints to ensure network isolation.

## Core Components

| Component | Type | Code Reference | Responsibility |
|-----------|------|----------------|----------------|
| API Gateway | AWS HTTP API | \`bedrock-gateway\` | Exposes \`/ask\` and \`/conversations\` endpoints; handles Cognito JWT auth |
| API Handler Lambda | AWS Lambda | \`bedrock-sql-api-handler\` | Orchestrates requests to Bedrock Agent; persists history in DynamoDB |
| DB Connection Lambda | AWS Lambda | \`bedrock-sql-db-conn\` | Executes SQL queries via psycopg2 and formats results for the Agent |
| Bedrock Agent | AI Agent | \`sql-data-agent\` | Performs reasoning, SQL generation via Claude 4.5, and tool orchestration |
| PostgreSQL Database | EC2 Instance | \`postgres-spot\` | Stores \`public.metrics\` in a long-format key-value design |
| DynamoDB Table | AWS DynamoDB | \`conversations\` | Stores user chat sessions, messages, and metadata |

## Agentic Reasoning — Chain of Thought

The agent does not just generate text. It analyses user intent, maps it to a metric dictionary, constructs SQL, and calls the \`postgress_query\` tool via a defined reasoning pipeline.

\`\`\`
<chain_of_thought>
  0. ALWAYS use the postgress_query tool for data.
  1. Analyze filters (host_name, app_name, time).
  2. Map request to metric name using <metric_dictionary>.
  3. Construct SQL following <query_rules>.
  4. Call the 'postgress_query' tool.
</chain_of_thought>
\`\`\`

## Long-Format Metric Strategy

The database stores metrics as **rows**, not columns. Strict prompt instructions prevent the AI from generating incorrect column-style queries.

\`\`\`
-- CORRECT
SELECT value FROM public.metrics WHERE metric_name = 'cpu_load';

-- INCORRECT
SELECT cpu_load FROM public.metrics WHERE host_name ILIKE 'x';
\`\`\`

## API Gateway and Cognito

The API Gateway provides the entry point for the system, secured by Amazon Cognito.

### Resource Configuration

- **API Type:** HTTP API (aws_apigatewayv2_api) named bedrock-gateway  
- **Authorization:** Cognito User Pool Authorizer  
- **CORS:** Configured to allow * origins and POST/GET methods  

### Routes

- **POST /ask:** Triggers the handle_ask logic in the API Handler Lambda  
- **GET /conversations:** Retrieves user chat history from DynamoDB  
- **POST /conversations:** Persists or updates a conversation session  

## Lambda Functions

### API Handler Lambda (api_handler)

This function acts as the primary orchestrator between the user, the Bedrock Agent, and the conversation state.

#### Responsibilities

- **Agent Invocation:** Calls bedrock_agent_runtime.invoke_agent using AGENT_ID and AGENT_ALIAS_ID  
- **State Persistence:** Queries and updates the conversations DynamoDB table  
- **Response Streaming:** Aggregates chunks from the Bedrock completion stream into a full answer  

#### Configuration

- **Runtime:** python3.12  

### Database Connection Lambda (db_conn)

This function is the "executor" for the Bedrock Agent's Action Group. It receives generated SQL and runs it against the PostgreSQL instance.

#### Responsibilities

- **SQL Execution:** Uses psycopg2 to execute queries against the metrics table  
- **Query Preprocessing:** Automatically casts date literals to timestamp to ensure PostgreSQL compatibility  
- **Formatting:** Returns results in the specific JSON format required by Bedrock Action Groups  

## Data and Storage

### PostgreSQL EC2 Instance

A t4g.small Spot instance running PostgreSQL 16  

- **Database:** postgres  
- **User:** lambda_reader with read-only permissions  
- **Table:** public.metrics containing long-format time-series data  

### DynamoDB Conversations Table

Stores session history to maintain context across multiple turns and to ensure compliance.

- **Table Name:** conversations  
- **Schema:** Partition Key userId (String), Sort Key sessionId (String)  

    `,
  },
  {
    id: "AI Agent and Bedrock Integration",
    title: "AI Agent and Bedrock Integration",
    content: `
# AI Agent and Bedrock Integration

Powered by AWS Bedrock and built on Claude Sonnet 4.5, Simply ask questions in plain English, the agent understands your intent through natural language processing, then converts your query into precise SQL using its built-in schema awareness to navigate the database structure. 

It executes the query, interprets the results, and delivers a clear, concise summary, all through dynamic function calling that orchestrates each step automatically. No SQL knowledge required; just ask, and get answers.

## Key Components

| Component     | Identifier / Value                                   | Role                                                         |
|--------------|------------------------------------------------------|--------------------------------------------------------------|
| Agent Name   | sql-data-agent                                       | The logical Bedrock Agent resource                           |
| Model ID     | eu.anthropic.claude-sonnet-4-5-20250929-v1:0         | The Claude 4.5 Sonnet model used for reasoning               |
| Agent ID     | IZMAAETI1S                                           | Unique identifier for the agent resource                     |
| Alias ID     | 2U0EGTAGKO                                           | Identifier for the specific agent version/alias              |
| Action Group | postgress_query_group                                | Toolset allowing the agent to call the DB Lambda             |

## API Handler Orchestration

The api_handler Lambda (defined in lambdas/index.py) serves as the gateway between the client and the Bedrock Agent.

### Agent Runtime Initialization

The Lambda initializes the bedrock-agent-runtime client with specific timeout configurations to accommodate complex SQL generation and execution cycles.


\`\`\`
bedrock_agent_runtime = boto3.client(
    "bedrock-agent-runtime",
    region_name="eu-west-1",
    config=Config(
        connect_timeout=10,
        read_timeout=120,
        retries={"max_attempts": 2}
    )
)
\`\`\`

## Session and Context Management

The system uses sessionId to maintain conversation state. When a user sends a prompt to the /ask endpoint, the handle_ask function extracts the session_id from the request body and passes it to the agent.

- **Invoke Agent:** The invoke_agent method is called with the agentId, agentAliasId, sessionId, and the user's inputText  
- **Response Streaming:** The agent returns a response stream. The Lambda iterates through the completion chunks, decoding the bytes into a final string answer  
- **Persistence:** Conversation metadata (userId, sessionId, messages) is persisted in the conversations DynamoDB table  

## Action Group: postgress_query_group

The Agent does not query the database directly. Instead, it uses an Action Group named postgress_query_group. This creates a bridge between the "Natural Language Space" of the LLM and the "Code Entity Space" of the database connector.

### Tool Orchestration Flow

When the Agent determines a database query is required, it follows this flow:

1. **Reasoning:** Claude 4.5 Sonnet generates a SQL statement based on the table_schema provided in its instructions  
2. **Action Trigger:** The Agent identifies the postgress_query function within the postgress_query_group action group  
3. **Lambda Invocation:** Bedrock invokes the bedrock-sql-db-conn Lambda function  
4. **Execution:** The db_conn.py script executes the SQL and returns the raw data  
5. **Observation:** The Agent receives the data, interprets it, and formulates a natural language response for the user  

    `,
  },
  {
    id: "deployment",
    title: "Deployment",
    content: `
# Deployment

## Infrastructure

Deployed via Terraform using the AWS provider \`~> 6.0\`. All infrastructure is defined as code.

\`\`\`bash
terraform init
terraform plan
terraform apply
\`\`\`

    `,
  },
];


export default function WikiPage({ onBack }) {
  const [activeId, setActiveId] = useState(PAGES[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // New state for visibility
  const page = PAGES.find((p) => p.id === activeId);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div style={s.root}>
      {/* Toggle Button for when sidebar is closed */}
      {!isSidebarOpen && (
        <button onClick={toggleSidebar} style={s.floatingToggle}>
          ☰ Menu
        </button>
      )}

      <aside
        style={{
          ...s.sidebar,
          marginLeft: isSidebarOpen ? 0 : -240, // Slide out effect
          transition: "margin-left 0.3s ease"
        }}
      >
        <div style={s.sidebarTop}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <button onClick={onBack} style={s.backBtn}>← Back</button>
            <button onClick={toggleSidebar} style={s.closeBtn}>✕</button>
          </div>

          <div style={s.logoRow}>
            <div>
              <div style={s.logoTitle}>PROJECT WEBSITE</div>
              <div style={s.logoSub}>Jeff Halley</div>
            </div>
          </div>
        </div>

        <nav style={s.nav}>
          {PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              style={{
                ...s.navBtn,
                ...(activeId === p.id ? s.navBtnActive : {}),
                color: activeId === p.id ? "#93c5fd" : "#5a6a88",
              }}
            >
              {p.title}
            </button>
          ))}
        </nav>

        <div style={s.sidebarFooter}>PROJECT DOCUMENTATION</div>
      </aside>

      <main style={{
        ...s.main,
        transition: "all 0.3s ease"
      }}>
        <Markdown content={page.content} />
        <div style={{ height: 60 }} />
      </main>
    </div>
  );
}


function Markdown({ content }) {
  const lines = content.trim().split("\n");
  const nodes = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H1
    if (line.startsWith("# ")) {
      nodes.push(<h1 key={k++} style={s.h1}>{line.slice(2)}</h1>);
      i++; continue;
    }
    // H2
    if (line.startsWith("## ")) {
      nodes.push(<h2 key={k++} style={s.h2}>{line.slice(3)}</h2>);
      i++; continue;
    }
    // H3
    if (line.startsWith("### ")) {
      nodes.push(<h3 key={k++} style={s.h3}>{line.slice(4)}</h3>);
      i++; continue;
    }
    // H4
    if (line.startsWith("#### ")) {
      nodes.push(<h4 key={k++} style={s.h4}>{line.slice(5)}</h4>);
      i++; continue;
    }
    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={k++} style={s.pre}>
          {lang && <span style={s.codeLang}>{lang}</span>}
          <code style={s.code}>{codeLines.join("\n")}</code>
        </pre>
      );
      i++; continue;
    }
    // Table
    if (line.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      nodes.push(<MdTable key={k++} lines={tableLines} />);
      continue;
    }
    // Bullets
    if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={k++} style={s.ul}>
          {items.map((item, idx) => (
            <li key={idx} style={s.li}>
              <span style={s.bullet}>▸</span>
              <span>{inline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      nodes.push(
        <ol key={k++} style={s.ol}>
          {items.map((item, idx) => (
            <li key={idx} style={s.li}>{inline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }
    // Blank line
    if (line.trim() === "") { i++; continue; }
    // Paragraph
    nodes.push(<p key={k++} style={s.p}>{inline(line)}</p>);
    i++;
  }

  return <div style={s.pageBody}>{nodes}</div>;
}

// Inline: `code` and **bold**
function inline(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} style={s.inlineCode}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} style={{ color: "#d0ddef" }}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

function MdTable({ lines }) {
  const rows = lines
    .filter((l) => !/^\|[-| :]+\|$/.test(l.trim()))
    .map((l) => l.split("|").filter((_, i, a) => i > 0 && i < a.length - 1).map((c) => c.trim()));
  if (!rows.length) return null;
  const [head, ...body] = rows;
  return (
    <div style={{ overflowX: "auto", margin: "0 0 20px" }}>
      <table style={s.table}>
        <thead>
          <tr>{head.map((h, i) => <th key={i} style={s.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 ? "#111624" : "#0d1120" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ ...s.td, fontWeight: ci === 0 ? 600 : 400, color: ci === 0 ? "#c0d0e8" : "#7a8aaa" }}>
                  {inline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// Styles 
const s = {
  root: { display: "flex", height: "100vh", background: "var(--color-surface-950)", color: "var(--color-text-primary)", fontFamily: "'Montserrat', sans-serif", overflow: "hidden", position: 'relative' },
  sidebar: { width: 240, minWidth: 240, background: "var(--color-surface-900)", borderRight: "1px solid var(--color-surface-border)", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 10 },
  floatingToggle: { position: 'absolute', top: 20, left: 20, zIndex: 5, background: "var(--color-surface-800)", color: "white", border: "1px solid var(--color-surface-border)", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" },
  closeBtn: { background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "16px", padding: "4px" },
  sidebarTop: { padding: "20px 20px 16px", borderBottom: "1px solid var(--color-surface-border)" },
  backBtn: { background: "var(--color-brand-80)", border: "none", color: "#ffffff", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "600", letterSpacing: "0.05em", marginBottom: "14px", fontFamily: "inherit", transition: "all 0.2s ease", textTransform: "uppercase" },
  logoRow: { display: "flex", alignItems: "center", gap: 10 },
  logoTitle: { fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "0.06em" },
  logoSub: { fontSize: 10, color: "var(--color-text-muted)", letterSpacing: "0.04em" },
  nav: { overflowY: "auto", flex: 1, padding: "8px 0" },
  navBtn: { width: "100%", background: "none", border: "none", borderLeft: "2px solid transparent", padding: "10px 18px", textAlign: "left", cursor: "pointer", fontSize: 12, color: "var(--color-text-secondary)", letterSpacing: "0.04em", transition: "all 0.12s", fontFamily: "inherit" },
  navBtnActive: { background: "var(--color-surface-800)", borderLeft: "2px solid var(--color-brand-80)", color: "var(--color-text-primary)" },
  sidebarFooter: { padding: "12px 18px", borderTop: "1px solid var(--color-surface-border)", fontSize: 9, color: "var(--color-text-muted)", letterSpacing: "0.1em" },
  main: { flex: 1, overflowY: "auto", padding: "44px 52px", background: "var(--color-surface-950)" },
  pageBody: { width: "100%" },
  h1: { fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 24px", borderBottom: "1px solid var(--color-surface-border)", paddingBottom: 12 },
  h2: { fontSize: 13, fontWeight: 700, color: "var(--color-brand-90)", margin: "32px 0 12px", textTransform: "uppercase", letterSpacing: "0.08em" },
  h3: { fontSize: 13, fontWeight: 700, color: "var(--color-brand-100)", margin: "20px 0 8px" },
  h4: { fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", margin: "16px 0 6px" },
  p: { fontSize: 13, lineHeight: 1.8, color: "var(--color-text-primary)", opacity: 0.9, margin: "0 0 14px" },
  ul: { margin: "0 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 },
  ol: { margin: "0 0 16px", padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 7 },
  li: { display: "flex", gap: 10, fontSize: 12, color: "var(--color-text-primary)", opacity: 0.8, lineHeight: 1.6 },
  bullet: { color: "var(--color-brand-80)", flexShrink: 0, marginTop: 3 },
  pre: { background: "var(--color-surface-900)", border: "1px solid var(--color-surface-border)", borderRadius: 6, padding: "14px 18px", overflowX: "auto", margin: "0 0 18px", width: "fit-content", minWidth: "min(100%, 600px)", maxWidth: "100%" },
  codeLang: { display: "block", fontSize: 10, color: "var(--color-text-muted)", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" },
  code: { fontSize: 12, color: "var(--color-brand-100)", fontFamily: "monospace", lineHeight: 1.7 },
  inlineCode: { background: "var(--color-surface-700)", border: "1px solid var(--color-surface-border)", color: "var(--color-brand-90)", padding: "1px 6px", borderRadius: 3, fontSize: "0.9em" },
  table: { width: "100%", maxWidth: 900, borderCollapse: "collapse", fontSize: 12 },
  th: { textAlign: "left", padding: "8px 14px", background: "var(--color-surface-800)", color: "var(--color-brand-90)", fontWeight: 700, letterSpacing: "0.07em", fontSize: 11, borderBottom: "1px solid var(--color-surface-border)", whiteSpace: "nowrap" },
  td: { padding: "9px 14px", borderBottom: "1px solid var(--color-surface-border)", lineHeight: 1.5, color: "var(--color-text-primary)", opacity: 0.9 },
};