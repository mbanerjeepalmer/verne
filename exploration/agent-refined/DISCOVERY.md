# Mistral Vibe ACP Communication Discovery

This document answers Q2: "How do we talk to it?" for Option A (`vibe-acp` subprocess).

## Communication Method

**Protocol**: JSON-RPC 2.0 over stdin/stdout with ACP (Agent Communication Protocol)

## Key Components

### 1. Process Management
- `vibe-acp` runs as a subprocess
- Communicates via line-buffered stdin/stdout
- Uses JSON-RPC 2.0 message format

### 2. Message Structure

#### Request Format
```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": {},
  "id": 1
}
```

#### Response Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {}
}
```

#### Notification Format (Streaming)
```json
{
  "jsonrpc": "2.0",
  "method": "session/update",
  "params": {
    "sessionId": "...",
    "update": {
      "sessionUpdate": "update_type",
      "content": {...}
    }
  }
}
```

### 3. Core Methods

#### `initialize`
- Establishes ACP connection
- Parameters: `protocol_version`, `client_capabilities`, `client_info`
- Returns: Agent capabilities, protocol version, agent info

#### `session/new`
- Creates a new agent session
- Parameters: `cwd`, `mcpServers`
- Returns: `sessionId`, models, modes, config options

#### `session/prompt`
- Sends user input to the agent
- Parameters: `prompt`, `session_id`
- Returns: `stop_reason` when complete
- Triggers streaming `session/update` notifications

### 4. Streaming Updates

The agent sends real-time updates via `session/update` notifications:

- **`agent_message_chunk`**: Agent's text responses
- **`agent_thought_chunk`**: Agent's internal reasoning
- **`tool_call_update`**: Tool execution status
- **`compact_start`/`compact_end`**: Session lifecycle
- **`available_commands_update`**: Available commands

### 5. Session Update Structure

```json
{
  "sessionUpdate": "agent_message_chunk",
  "content": {
    "type": "text",
    "text": "Hello, I'm Mistral Vibe!"
  }
}
```

## Implementation Example

```python
# Start subprocess
process = await asyncio.create_subprocess_exec(
    "vibe-acp",
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE
)

# Send initialize request
request = {
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {"protocol_version": 1, "client_capabilities": {...}},
    "id": 1
}
process.stdin.write((json.dumps(request) + "\n").encode())

# Read responses
while True:
    line = await process.stdout.readline()
    response = json.loads(line)
    
    if response.get("method") == "session/update":
        # Handle streaming update
        update_type = response["params"]["update"]["sessionUpdate"]
        content = response["params"]["update"]["content"]
        
    elif response.get("id"):
        # Handle request response
        result = response["result"]
```

## Key Findings

1. **Protocol**: JSON-RPC 2.0 with ACP extensions
2. **Transport**: Line-buffered stdin/stdout
3. **Methods**: `initialize`, `session/new`, `session/prompt`, etc.
4. **Streaming**: Real-time updates via `session/update` notifications
5. **Session Management**: Each interaction requires a `sessionId`
6. **Error Handling**: JSON-RPC error responses for failed requests

## Working Test

The `test_vibe_acp_subprocess.py` script demonstrates:
- Starting `vibe-acp` as subprocess
- Initializing ACP connection
- Creating sessions
- Sending prompts and receiving streaming responses
- Proper JSON-RPC message handling

This confirms that Option A (vibe-acp subprocess) uses **JSON-RPC over stdin/stdout** for communication, with structured requests/responses and streaming notifications for real-time agent interactions.
