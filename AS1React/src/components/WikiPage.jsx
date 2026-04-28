import { useState } from "react";

const PAGES = [
  {
    id: "overview",
    title: "Overview",
    content: `
# Natural Language to SQL Query System

In modern enterprise environments operating at scale, the monitoring of applications and infrastructure is often delegated to a specialised monitoring team rather than handled by individual development teams. As a result, the collected data frequently becomes siloed within that team. When incidents occur, application developers often lack direct access to monitoring logs and metrics, increasing the average time required to remediate an incident and directly impacting operational stability and customer trust. This project is architected from the ground up to address this problem.

This project delivers an end-to-end Agentic AI solution that enables natural language querying of monitoring data. By removing technical barriers to data access for developers and engineers, the system enables teams to use monitoring data as contextual input for real-time incident triage without requiring expertise in the underlying monitoring tools or query languages.

## What does it do?

Instead of requiring users to write SQL or understand the database schema, the system accepts natural language questions and automatically orchestrates a reasoning chain: it translates intent into valid PostgreSQL, executes the query securely, and returns a conversational plain-language summary of the monitoring data. If the results contain unhealthy metrics, the agent offers to dispatch an email alert via Amazon SES - but only after explicit user confirmation, keeping the user in full control of notification behaviour.

Conversation history is persisted in DynamoDB for post-incident review and audit.

## Key Features

- Natural language to SQL translation via Amazon Bedrock Agent (Claude Sonnet 4.5)
- 7-step chain-of-thought reasoning pipeline enforced via structured system prompt
- Two action groups: \`postgress_query\` for data retrieval and \`send_alert\` for email alerting
- Secure, read-only query execution against a long-format PostgreSQL metrics table
- Conditional email alerting via Amazon SES, triggered only on user confirmation
- Conversational plain-language response summaries returned to the user
- Full conversation history persisted in DynamoDB, accessible across devices
- React SPA frontend with Cognito JWT authentication and dark/light theme support
- Continuous metrics simulation via a cron-driven Python script (156 rows every 5 minutes)
- All infrastructure defined and deployed as code via Terraform

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 + Vite 7 + Tailwind CSS v4 | Single-page application frontend |
| AWS Amplify | Client-side Cognito authentication integration |
| Amazon API Gateway (HTTP API v2) | Exposes REST endpoints secured with Cognito JWT auth |
| AWS Lambda (Python 3.12) | Serverless orchestration and database connectivity |
| Amazon Bedrock Agent | Agentic reasoning and SQL generation (Claude Sonnet 4.5) |
| Amazon SES | Conditional email alerting for unhealthy metrics |
| DynamoDB | Conversation history storage and retrieval |
| Amazon Cognito | Identity management and JWT auth |
| AWS EC2 (t4g.small Spot) | PostgreSQL 16 hosting and metrics simulation |
| PostgreSQL 16 | Long-format time-series metrics data store |
| S3 + CloudFront | Frontend hosting and distribution |
| Terraform | Infrastructure as Code (AWS provider ~> 6.0) |
    `,
  },
  {
    id: "architecture",
    title: "Architecture",
    content: `
# Architecture

The system follows a serverless pattern with clear separation of concerns, deployed in \`eu-west-1\`. All traffic between Lambda, Bedrock, and DynamoDB traverses VPC Interface Endpoints to ensure network isolation. The React frontend is hosted on S3 and distributed via CloudFront.

## Core Components

| Component | Type | Code Reference | Responsibility |
|-----------|------|----------------|----------------|
| API Gateway | AWS HTTP API v2 | \`bedrock-gateway\` | Exposes \`/ask\` and \`/conversations\` endpoints; enforces Cognito JWT auth |
| API Handler Lambda | AWS Lambda | \`bedrock-sql-api-handler\` | Orchestrates requests to the Bedrock Agent; persists history in DynamoDB |
| DB Connection Lambda | AWS Lambda | \`bedrock-sql-db-conn\` | Executes SQL via psycopg2; formats results for the Agent action group |
| Alert Lambda | AWS Lambda | \`bedrock-sql-send-alert\` | Constructs and dispatches email alerts via Amazon SES |
| Bedrock Agent | AI Agent | \`sql-data-agent\` | Performs reasoning, SQL generation via Claude Sonnet 4.5, and tool orchestration |
| PostgreSQL Database | EC2 Instance | \`postgres-spot\` | Stores \`public.metrics\` in a long-format Entity-Attribute-Value design |
| DynamoDB Table | AWS DynamoDB | \`conversations\` | Stores user chat sessions, messages, and metadata |
| Metrics Simulation | EC2 cron job | \`metrics_collector.py\` | Writes 156 metric rows every 5 minutes to simulate real monitoring data |
| Metrics Trimmer | EC2 cron job | \`metrics_trimmer.py\` | Enforces a 10 GB table ceiling by pruning oldest rows every 15 minutes |

## Agentic Reasoning - Chain of Thought

The agent follows a strict 7-step reasoning pipeline before executing any action. This is enforced via the \`<chain_of_thought>\` XML block in the system prompt, which constrains the model's behaviour and prevents it from acting outside its defined scope.

\`\`\`xml
<chain_of_thought>
  0. ALWAYS use the postgress_query tool for data. Never write tool syntax as text.
  1. Analyze the user's intent and identify filters (host_name, app_name, time).
  2. Map the request to the correct metric name using the <metric_dictionary>.
  3. Construct the SQL query following <query_rules>.
  4. Call the 'postgress_query' tool.
  5. Provide a concise, plain-language summary of the returned data.
  6. If any rows in the result have status = 'unhealthy', follow the <alert_rules>.
</chain_of_thought>
\`\`\`

Step 6 and the associated \`<alert_rules>\` block integrate the email alerting workflow directly into the agent's reasoning chain. The agent is instructed to offer an alert only after summarising findings, and to never call \`send_metric_alert\` without explicit user confirmation.

## Long-Format Metric Strategy

The database stores metrics as rows, not columns. Every \`SELECT\` statement generated by the agent must include the mandatory column set: \`time, host_name, app_name, assignment_group, metric_name, value, status\`. This ensures the agent always has the full context needed to compose an alert without issuing additional queries. Strict prompt rules prevent column-style queries.

\`\`\`sql
-- CORRECT
SELECT time, host_name, app_name, assignment_group, metric_name, value, status
FROM public.metrics WHERE metric_name = 'cpu_load';

-- INCORRECT
SELECT cpu_load FROM public.metrics WHERE host_name ILIKE 'x';
\`\`\`

## API Gateway and Cognito

The API Gateway is the single entry point for all client traffic, protected by a Cognito User Pool JWT authoriser. Requests with missing or invalid tokens are rejected before reaching application code.

### Resource Configuration

- **API Type:** HTTP API v2 (\`aws_apigatewayv2_api\`) named \`bedrock-gateway\`
- **Authorization:** Cognito User Pool Authoriser (Bearer token in \`Authorization\` header)
- **CORS:** Configured to allow \`*\` origins and \`POST\`/\`GET\` methods

### Routes

| Route | Handler | Purpose |
|-------|---------|---------|
| \`POST /ask\` | \`api_handler\` Lambda | Submits a natural language query to the Bedrock Agent |
| \`GET /conversations\` | \`api_handler\` Lambda | Retrieves conversation history for a user from DynamoDB |
| \`POST /conversations\` | \`api_handler\` Lambda | Creates or updates a conversation record in DynamoDB (upsert) |

## Lambda Functions

### API Handler Lambda (\`api_handler\`)

The primary orchestrator between the client, the Bedrock Agent, and conversation state.

**Responsibilities:**
- **Agent Invocation:** Calls \`bedrock_agent_runtime.invoke_agent\` with \`AGENT_ID\`, \`AGENT_ALIAS_ID\`, \`sessionId\`, and \`inputText\`
- **Response Streaming:** Iterates through completion chunks from the Bedrock stream and concatenates them into a full answer
- **State Persistence:** Reads and writes conversation records to the DynamoDB \`conversations\` table

**Configuration:** Runtime \`python3.12\`; boto3 agent runtime client configured with a 120-second read timeout to accommodate multi-step agentic reasoning cycles.

### Database Connection Lambda (\`db_conn\`)

The executor for the \`postgress_query\` action group. Receives a generated SQL string from the agent and runs it against the PostgreSQL instance.

**Responsibilities:**
- **SQL Execution:** Uses \`psycopg2\` to execute queries against \`public.metrics\`
- **Query Preprocessing:** Automatically casts date literals to \`timestamp\` for PostgreSQL compatibility
- **Formatting:** Returns results as a JSON array in the format required by Bedrock action groups
- **Error Handling:** Catches exceptions and returns a structured error response so the agent can surface a message to the user rather than failing silently

### Alert Lambda (\`send_alert\`)

The executor for the \`send_alert\` action group. Constructs and dispatches email alerts via Amazon SES.

**Responsibilities:**
- **Email Dispatch:** Calls \`ses_client.send_email\` using recipient, subject, and body fields passed by the agent
- **Confirmation:** Returns a dispatch confirmation to the agent, which relays it to the user

## Data and Storage

### PostgreSQL 16 on EC2

A \`t4g.small\` Spot Instance running PostgreSQL 16 in \`eu-west-1\`. The database stores monitoring metrics in a single long-format table following an Entity-Attribute-Value design.

| Column | Description |
|--------|-------------|
| \`host_name\` | Server producing the measurement |
| \`env\` | Environment (production, dev, staging) |
| \`app_name\` | Application associated with the host |
| \`app_id\` | Deterministic application identifier |
| \`assignment_group\` | Team responsible for the monitored system |
| \`tool_name\` | Monitoring tool generating the check (Nagios, Dynatrace, etc.) |
| \`metric_group\` | Category (CPU, memory, network) |
| \`metric_name\` | Specific metric (e.g. \`cpu_load\`, \`memory_usage\`) |
| \`status\` | Health flag: healthy, warning, critical, unhealthy |
| \`value\` | Numerical measurement |

- **Database:** \`postgres\`
- **User:** \`lambda_reader\` - read-only permissions enforced at the database level
- **Data simulation:** \`metrics_collector.py\` runs via cron every 5 minutes, writing 156 rows per execution
- **Data trimming:** \`metrics_trimmer.py\` runs every 15 minutes, enforcing a 10 GB ceiling by pruning the oldest rows and running \`VACUUM\`

### DynamoDB Conversations Table

Stores session history to maintain conversational context across turns and to provide a fully auditable, timestamped record for post-incident retrospectives.

- **Table Name:** \`conversations\`
- **Partition Key:** \`userId\` (String) - the Cognito \`sub\` claim
- **Sort Key:** \`sessionId\` (String) - a combination of the JWT and a UUID generated at conversation start
- **Attributes:** \`title\` (first 50 characters of the opening message), \`messages\` (full message array), \`lastUpdated\` (ISO 8601 timestamp)
- Conversations are sorted by \`lastUpdated\` descending so the most recent session appears first in the sidebar
    `,
  },
  {
    id: "ai-agent",
    title: "AI Agent and Bedrock Integration",
    content: `
# AI Agent and Bedrock Integration

The intelligence layer of the system is an Amazon Bedrock Agent configured with Anthropic Claude Sonnet 4.5. The agent accepts natural language queries, follows a structured chain-of-thought reasoning pipeline, generates and executes PostgreSQL, interprets the results, and returns a plain-language summary. If the result set contains unhealthy metrics, the agent conditionally triggers an email alert via a second action group - but only after the user explicitly confirms.

## Key Components

| Component | Identifier / Value | Role |
|-----------|-------------------|------|
| Agent Name | \`sql-data-agent\` | The logical Bedrock Agent resource |
| Model ID | \`eu.anthropic.claude-sonnet-4-5-20250929-v1:0\` | Claude Sonnet 4.5 used for reasoning |
| Agent ID | \`IZMAAETI1S\` | Unique identifier for the agent resource |
| Alias ID | \`2U0EGTAGKO\` | Identifier for the specific agent version/alias |
| Action Group 1 | \`postgress_query_group\` | Allows the agent to execute SQL via the DB Lambda |
| Action Group 2 | \`send_alert\` | Allows the agent to dispatch email alerts via the SES Lambda |

## System Prompt: prompt.txt

The agent's behaviour is entirely governed by its system prompt (\`prompt.txt\`). This file is the most critical component of the system and is structured using XML-tagged sections to give the model clearly delimited, unambiguous instructions. Claude's official documentation notes that XML tags help parse complex prompts that mix instructions, context, examples, and variable inputs.

The prompt is composed of the following sections:

### \`<table_schema>\`
Defines the exact structure of the \`public.metrics\` table, including all valid column names and the long-format (key-value) storage pattern. A critical instruction here explicitly prohibits the agent from selecting metrics as columns and enforces the mandatory column set on every query.

### \`<chain_of_thought>\`
A 7-step ordered reasoning process the agent must follow before taking any action. The explicit step-by-step instruction set constrains the model's degrees of freedom, improving accuracy and predictability. Steps 6 and 7 integrate the alerting workflow directly into the reasoning chain.

### \`<query_rules>\`
Enforces strict SQL generation patterns:
- Always use the fully qualified table name \`public.metrics\`
- Always include the mandatory column set: \`time, host_name, app_name, assignment_group, metric_name, value, status\`
- Use \`ILIKE\` for case-insensitive matching on \`host_name\`, \`app_name\`, and \`tool_name\`
- Use \`NOW()\` for all relative time calculations (prevents the model from hallucinating dates from its training data)
- Always include \`ORDER BY time DESC\`
- Only \`SELECT\` is permitted - \`INSERT\`, \`UPDATE\`, \`DELETE\`, \`DROP\`, and \`TRUNCATE\` are explicitly prohibited

### \`<alert_rules>\`
Defines the conditional alerting workflow. After summarising results, if any rows have \`status = 'unhealthy'\`, the agent offers to send an email alert and phrases the offer naturally. It must not invoke the \`send_metric_alert\` action without explicit user confirmation. If the user declines, the conversation continues normally without any alert being sent.

### \`<metric_dictionary>\`
Maps natural language metric names to their exact database strings:

\`\`\`
[infra/Host Metrics]
- CPU: cpu_load
- Memory: memory_usage
- Disk: disk_space_used, disk_capacity
- Uptime: uptime
- Network: net_throughput, net_latency

[app Metrics]
- Response Time: response_time
- Error Rate: error_rate
- Status: http_ping, dynatrace_synth
- Users: current_user_count
- Apdex: apdex
\`\`\`

### \`<context_rules>\`
Instructs the agent to resolve follow-up queries using context from prior turns. If the user refers to "the same host" or omits a filter that was present in the previous exchange, the agent infers it and proceeds without requesting clarification. If a follow-up question requires data not yet retrieved, the agent re-issues the query rather than relying on previously returned values.

### \`<examples>\`
Provides concrete input-to-SQL mappings and a defined refusal pattern for off-topic requests, grounding the agent's behaviour in demonstrated patterns.

## Action Group Implementation

Two action groups are registered against the agent, each defined by an OpenAPI 3.0 schema and backed by a dedicated Lambda function.

### \`postgress_query_group\`
Exposes a single \`POST\` operation that accepts a SQL query string and returns the result set as a JSON array. The \`db_conn\` Lambda executes the query against the PostgreSQL instance over the private VPC network using \`psycopg2\`.

### \`send_alert\`
Exposes a single \`POST\` operation accepting a recipient email address, subject line, and message body. The alert Lambda dispatches the email via Amazon SES and returns a dispatch confirmation to the agent. The sender identity is a verified SES address. The system currently operates in SES sandbox mode, which restricts outbound email to verified recipient addresses. In a production deployment, sandbox restrictions would be lifted.

## Tool Orchestration Flow

When the agent determines a database query is required:

1. **Reasoning:** Claude Sonnet 4.5 analyses intent and constructs SQL based on the \`<table_schema>\` and \`<metric_dictionary>\` in its instructions
2. **Action Trigger:** The agent identifies the \`postgress_query\` function in the \`postgress_query_group\` action group
3. **Lambda Invocation:** Bedrock invokes the \`bedrock-sql-db-conn\` Lambda function
4. **Execution:** The Lambda executes the SQL and returns the raw result set
5. **Observation:** The agent receives the data, checks for \`status = 'unhealthy'\` rows, summarises in plain language, and conditionally offers to send an alert

If the agent receives an empty or insufficient result set, it is permitted to re-invoke the query tool with a broader query before surfacing a response to the user, mitigating the risk of hallucinated values.

## API Handler Orchestration

The \`api_handler\` Lambda initialises the Bedrock Agent Runtime client with specific timeout configurations to accommodate multi-step reasoning cycles:

\`\`\`python
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

The \`session_id\` passed on every \`/ask\` request is generated client-side as a combination of the Cognito \`userId\` and a UUID, ensuring it is globally unique and stable for the lifetime of a conversation. Sending a new \`session_id\` starts a fresh conversation with no memory of prior exchanges. The Bedrock Agent Runtime uses this identifier to maintain multi-turn context natively.

After every successful agent response, the full conversation (including both user and assistant messages) is persisted to DynamoDB via a \`POST /conversations\` call, making the complete history available for post-incident review and accessible across devices.
    `,
  },
  {
    id: "frontend",
    title: "Frontend",
    content: `
# Frontend

The frontend is a modern Single Page Application (SPA) built with React 19, Vite 7, and Tailwind CSS v4. It is hosted on Amazon S3 and distributed via CloudFront. AWS Amplify handles client-side authentication against the Cognito User Pool.

## Application Structure

The application is structured around a central \`App.jsx\` orchestrator that manages global state and coordinates data flow between the AWS-backed API and all child layout components. The UI is partitioned into four primary functional components - Header, SidePanel, Conversation, and Footer - each in a separate layout file to keep the codebase maintainable.

## State Management

\`App.jsx\` uses React's \`useState\` and \`useRef\` hooks to manage the conversation lifecycle. State variables track the active chat, current session ID, historical conversations, loading state, user identity, and sidebar visibility.

The application manages conversations through three phases:

**Initialization:** On mount, the component fetches the user identity from the AWS Amplify session, generates a new session ID (a combination of \`userId\` and a UUID), and calls \`GET /conversations\` to populate the sidebar with existing history.

**Interaction (handleSend):** The user's message is immediately added to the \`messages\` state as an optimistic update. A \`POST /ask\` request is sent containing the prompt and the \`currentSessionId\`. On a successful response, the assistant's reply is appended to the message history.

**Persistence (saveConversation):** After every successful agent response, the conversation is persisted to DynamoDB via \`POST /conversations\`. If it is the first message in a session, the first 50 characters of the user's input are used as the conversation title.

## Layout Components

**Header:** Displays the authenticated \`userId\` (derived from the Cognito JWT \`sub\` claim), provides a light/dark theme toggle, and exposes a logout button that returns the user to the splash screen.

**SidePanel:** A collapsible sidebar that renders the user's full conversation history. Conversations are not stored locally - the list is fetched from DynamoDB on each load and held in React component state, making history consistent across devices and browser sessions. Includes a \`+ New\` button that resets chat state and generates a fresh session ID.

**Conversation:** The main interaction surface. Renders the \`messages\` array with role-based styling distinguishing user and assistant messages. Uses a \`useRef\` hook (\`bottomRef\`) to keep the view anchored to the latest message as the conversation grows. Supports both button-click and Enter-key submission.

**Footer:** A stateless presentational component displaying contact information and a last-updated timestamp. In a production deployment this would be extended to include relevant compliance information.

## Authentication

Authentication is implemented with Amazon Cognito and AWS Amplify. On sign-in, Cognito issues an ID token, access token, and refresh token. The ID token is the primary token used by the system; it contains the \`sub\` claim used as the stable \`userId\` across all requests. Amplify's \`Auth.currentSession()\` method retrieves the active session on mount. The JWT is included as a \`Bearer\` token in the \`Authorization\` header of every API request. API Gateway validates the token against the Cognito User Pool before the Lambda handler is invoked.
    `,
  },
  {
    id: "alerting",
    title: "Email Alerting",
    content: `
# Email Alerting

Email alerting is a conditional workflow triggered when the Bedrock Agent detects unhealthy metrics in a query result. The implementation spans three components: the agent's \`<alert_rules>\` prompt instructions, the \`send_alert\` action group, and the underlying SES Lambda.

## Alert Flow

1. The agent executes a database query via the \`postgress_query\` action group
2. The agent inspects the result set for rows where \`status = 'unhealthy'\`
3. If unhealthy rows are found, the agent summarises the findings in plain language and offers to send an email alert, phrasing the offer naturally (e.g. *"I can see that http_ping on WebSrvAHost was unhealthy at 19:10. Would you like me to send an email alert for this?"*)
4. The user is in full control - they can confirm a full alert, a partial alert (for specific hosts only), or decline entirely
5. If confirmed, the agent invokes the \`send_metric_alert\` function, passing the relevant unhealthy rows directly from its context - no additional database query is required
6. The alert Lambda constructs and dispatches the email via Amazon SES and returns a confirmation
7. The agent relays the confirmation to the user
8. If the user declines, the conversation continues normally and no alert is sent

This design ensures that alerting is always a deliberate, user-directed action. The agent will never dispatch an email autonomously.

## Required Alert Fields

Each alert object passed to the \`send_alert\` action group must include:

| Field | Source |
|-------|--------|
| \`host_name\` | Present in every query result (mandatory column set) |
| \`app_name\` | Present in every query result |
| \`assignment_group\` | Present in every query result |
| \`metric_name\` | Present in every query result |
| \`status\` | Present in every query result |
| \`value\` | Present in every query result |
| \`time\` | Present in every query result |

All fields are guaranteed to be available in the agent's context because the mandatory \`SELECT\` column set enforced by \`<query_rules>\` always includes them.

## SES Configuration

Amazon SES was provisioned with a verified sender identity via Terraform. The system currently operates in SES sandbox mode, which restricts outbound email to verified recipient addresses. In a production deployment, SES would be moved out of sandbox mode to allow alerts to be dispatched to any relevant operational email address.
    `,
  },
  {
    id: "data-pipeline",
    title: "Data Pipeline",
    content: `
# Data Pipeline

Monitoring data is continuously simulated by a Python script running on the EC2 instance, providing a realistic time-series dataset for the agent to query.

## Metrics Collector (\`metrics_collector.py\`)

The script runs via cron every 5 minutes and writes 156 rows per execution to \`public.metrics\`. Each row represents a single metric reading from a simulated monitoring tool at a point in time. The script generates values across infrastructure and application metrics, including \`cpu_load\`, \`memory_usage\`, \`disk_space_used\`, \`net_latency\`, \`response_time\`, \`error_rate\`, \`http_ping\`, and others defined in the agent's metric dictionary.

## Metrics Trimmer (\`metrics_trimmer.py\`)

A companion trimmer script runs every 15 minutes and enforces a 10 GB ceiling on the \`public.metrics\` table. It deletes the oldest rows in batches and runs \`VACUUM\` to reclaim storage, preventing unbounded growth on the EC2 instance's allocated EBS volume.

## Simulated Infrastructure

The simulation covers a representative set of hosts and applications across multiple assignment groups, mimicking the kind of multi-team monitoring environment the system is designed to serve. Hosts are named consistently (e.g. \`InfraSrv1Host\`, \`WebSrvAHost\`, \`WinAppCHost\`) and tied to \`app_name\` and \`assignment_group\` values that reflect distinct team ownership boundaries.

## Metric Dictionary

The agent's \`<metric_dictionary>\` maps natural language terms to the exact \`metric_name\` strings stored in the database:

| Category | metric_name values |
|----------|-------------------|
| CPU | \`cpu_load\` |
| Memory | \`memory_usage\` |
| Disk | \`disk_space_used\`, \`disk_capacity\` |
| Uptime | \`uptime\` |
| Network | \`net_throughput\`, \`net_latency\` |
| Response Time | \`response_time\` |
| Error Rate | \`error_rate\` |
| Status Checks | \`http_ping\`, \`dynatrace_synth\` |
| Active Users | \`current_user_count\` |
| Satisfaction | \`apdex\` |
    `,
  },
  {
    id: "deployment",
    title: "Deployment",
    content: `
# Deployment

## Infrastructure as Code

All infrastructure is defined in Terraform using the AWS provider \`~> 6.0\` and deployed to \`eu-west-1\`. The Terraform configuration covers API Gateway, Lambda functions, Bedrock Agent and action groups, DynamoDB, Cognito, SES, EC2, VPC and all Interface Endpoints, IAM roles and policies, S3, and CloudFront.

\`\`\`bash
terraform init
terraform plan
terraform apply
\`\`\`

The Bedrock Agent itself (including its action group OpenAPI schemas and the \`prompt.txt\` system prompt) is provisioned and versioned via Terraform, ensuring the agent configuration remains reproducible and consistent with the surrounding infrastructure.

## Performance Observations

End-to-end response time (user submission to agent response appearing in the frontend) was observed at approximately 6–12 seconds under normal conditions. The two primary contributors are Lambda cold starts (approximately 100ms to 1 second on the first request in a session) and the Bedrock Agent's multi-step reasoning phase, which accounts for the largest share of response time. Because the system uses Claude Sonnet 4.5 via Amazon Bedrock, availability and response latency are directly tied to Anthropic's infrastructure.

## Repositories

- **Backend (Lambda + Terraform):** [github.com/JeffHalley/backend_infra_FYP_20102427](https://github.com/JeffHalley/backend_infra_FYP_20102427)
- **API definition:** [FYP_openAPI_Final.yaml](https://github.com/JeffHalley/backend_infra_FYP_20102427/blob/main/FYP_openAPI_Final.yaml)
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