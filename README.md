# AG-UI Chat Demo — .NET 10 + React

A full-stack demo showcasing the **AG-UI (Agent-User Interaction) Protocol** with:

- **Backend**: .NET 10 ASP.NET Core implementing AG-UI SSE streaming with OpenAI
- **Frontend**: React + Vite with a custom AG-UI client
- **MCP Tools**: Weather, web search, calculator, time, and translation tools

## Architecture

```
┌─────────────────┐     AG-UI Protocol (SSE)     ┌──────────────────┐
│   React Frontend │ ◄──────────────────────────► │  .NET 10 Backend │
│   (Vite + TS)    │     POST + EventStream       │  (ASP.NET Core)  │
└─────────────────┘                               └────────┬─────────┘
                                                           │
                                                    ┌──────┴──────┐
                                                    │   OpenAI    │
                                                    │   GPT-4o    │
                                                    └─────────────┘
```

## Prerequisites

- .NET 10 SDK
- Node.js 18+
- OpenAI API Key

## Quick Start

### 1. Set your OpenAI API key

```bash
# Windows PowerShell
$env:OPENAI_API_KEY = "sk-your-key-here"

# Linux/Mac
export OPENAI_API_KEY="sk-your-key-here"
```

### 2. Start the backend

```bash
cd Backend
dotnet run
```

The backend starts at `http://localhost:5000`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:3000` and proxies `/agui` to the backend.

### 4. Open the app

Navigate to [http://localhost:3000](http://localhost:3000) and start chatting!

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `get_weather` | Get simulated weather for any city |
| `search_web` | Simulated web search results |
| `get_current_time` | Current date/time information |
| `calculate` | Mathematical expression evaluation |
| `translate_text` | Simulated text translation |

## AG-UI Protocol Events

The backend implements these AG-UI events:

- `RUN_STARTED` / `RUN_FINISHED` — Lifecycle events
- `TEXT_MESSAGE_START` / `TEXT_MESSAGE_CONTENT` / `TEXT_MESSAGE_END` — Streaming text
- `TOOL_CALL_START` / `TOOL_CALL_ARGS` / `TOOL_CALL_END` — Tool invocations
- `RUN_ERROR` — Error handling

## Configuration

Edit `Backend/appsettings.json`:

```json
{
  "OPENAI_MODEL": "gpt-4o-mini",
  "PORT": "5000"
}
```

Or use environment variables:

```bash
$env:OPENAI_API_KEY = "your-key"
$env:OPENAI_MODEL = "gpt-4o"
```
