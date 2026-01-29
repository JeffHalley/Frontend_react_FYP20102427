# Design Document: Bedrock AI Chat

## Overview

Bedrock AI Chat is a React-based single-page application that provides users with an interactive chat interface to communicate with an AI assistant. The application features a modern, responsive design with real-time messaging capabilities, collapsible sidebar navigation, and seamless API integration with AWS services.

The system follows a component-based architecture using React functional components with hooks for state management. The design emphasizes user experience with smooth animations, intuitive controls, and clear visual hierarchy.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React App)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Header    │  │  SidePanel  │  │ Conversation│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 App Component                           │ │
│  │           (State Management & API Logic)               │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS POST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS API Gateway                                │
│    https://9kdou5cfm0.execute-api.eu-west-1.amazonaws.com  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Service                                │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

The application follows a hierarchical component structure:

- **App.jsx**: Root component managing global state and API communication
- **Header.jsx**: Static branding component
- **Footer.jsx**: Static copyright component  
- **Conversation.jsx**: Chat interface with message display and input handling
- **SidePanel.jsx**: Collapsible sidebar with chat navigation

## Components and Interfaces

### App Component

**Responsibilities:**
- Global state management for messages, input, loading states, and sidebar visibility
- API communication with AWS API Gateway
- Error handling and user feedback
- Layout orchestration

**State Management:**
```javascript
const [input, setInput] = useState("");           // Current user input
const [messages, setMessages] = useState([]);     // Chat message history
const [loading, setLoading] = useState(false);    // API request status
const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar visibility
```

**API Interface:**
- **Endpoint**: `https://9kdou5cfm0.execute-api.eu-west-1.amazonaws.com/ask`
- **Method**: POST
- **Request Format**: `{ "prompt": string }`
- **Response Format**: `{ "response": string }`
- **Error Handling**: Network failures display fallback error message

### Conversation Component

**Props Interface:**
```javascript
{
  input: string,
  setInput: (value: string) => void,
  messages: Array<{role: "user" | "assistant", content: string}>,
  loading: boolean,
  handleSend: () => Promise<void>
}
```

**Responsibilities:**
- Message history display with role-based styling
- User input handling (text input and send button)
- Loading state visualization
- Keyboard event handling (Enter key submission)

### SidePanel Component

**Props Interface:**
```javascript
{
  isOpen: boolean,
  toggleSidebar: () => void
}
```

**Responsibilities:**
- Collapsible sidebar with smooth animations
- Sample chat list display
- Toggle button with directional indicators

### Header Component

**Responsibilities:**
- Application branding display
- Consistent header styling across the application

### Footer Component

**Responsibilities:**
- Copyright information display
- Consistent footer styling

## Data Models

### Message Model

```javascript
{
  role: "user" | "assistant",
  content: string
}
```

**Properties:**
- `role`: Identifies the message sender (user or AI assistant)
- `content`: The actual message text content

**Usage:**
- User messages: `{ role: "user", content: userInput }`
- AI responses: `{ role: "assistant", content: apiResponse.response }`
- Error messages: `{ role: "assistant", content: "Error: Could not reach the AI agent." }`

### API Request Model

```javascript
{
  prompt: string
}
```

**Properties:**
- `prompt`: User's input message to be processed by the AI

### API Response Model

```javascript
{
  response: string
}
```

**Properties:**
- `response`: AI-generated response to the user's prompt

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining the correctness properties, I need to analyze the acceptance criteria from the requirements document to determine which ones are testable as properties.

### Property 1: Message submission creates user message
*For any* valid non-empty message input, submitting the message (via Enter key or Send button) should add a user message to the message history and clear the input field
**Validates: Requirements 1.1, 1.2, 6.2, 6.3, 6.4**

### Property 2: Loading state controls UI behavior
*For any* loading state, when loading is true, the system should display "Agent thinking..." indicator and disable input controls
**Validates: Requirements 1.3, 1.5, 6.5**

### Property 3: API request format and behavior
*For any* message submission, the system should send a POST request to the correct endpoint with the message as "prompt" in the request body
**Validates: Requirements 3.1, 3.4**

### Property 4: Successful API response handling
*For any* successful API response, the system should extract the response field and add it as an assistant message to the message history
**Validates: Requirements 1.4, 3.2, 3.5**

### Property 5: API error handling
*For any* failed API request, the system should add the specific error message "Error: Could not reach the AI agent." as an assistant message
**Validates: Requirements 3.3**

### Property 6: Message role-based styling
*For any* message in the message history, user messages should have blue styling aligned right, and assistant messages should have gray styling aligned left
**Validates: Requirements 2.2, 2.3**

### Property 7: Sidebar toggle behavior
*For any* sidebar state, clicking the toggle button should change the sidebar visibility state
**Validates: Requirements 4.2**

### Property 8: Sidebar content visibility
*For any* sidebar state, when open the sidebar should display chat content, and when closed the sidebar should hide content
**Validates: Requirements 4.3, 4.4**

## Error Handling

### API Communication Errors

**Network Failures:**
- Catch all fetch API errors and network timeouts
- Display user-friendly error message: "Error: Could not reach the AI agent."
- Maintain application stability by not crashing on API failures
- Allow users to retry by sending another message

**HTTP Error Responses:**
- Handle non-200 HTTP status codes from API Gateway
- Throw descriptive errors with status codes for debugging
- Convert all API errors to the standard error message for users

**Response Parsing Errors:**
- Handle malformed JSON responses gracefully
- Extract response field safely with error handling
- Fallback to error message if response structure is unexpected

### Input Validation

**Empty Message Prevention:**
- Trim whitespace from user input before validation
- Prevent submission of empty or whitespace-only messages
- Maintain input field state without clearing on invalid submissions

**Concurrent Request Prevention:**
- Disable input controls during API requests
- Prevent multiple simultaneous API calls
- Use loading state to control user interaction

### State Management Errors

**Component State Consistency:**
- Ensure message history updates are atomic
- Maintain loading state consistency across UI components
- Handle sidebar state changes without affecting chat functionality
