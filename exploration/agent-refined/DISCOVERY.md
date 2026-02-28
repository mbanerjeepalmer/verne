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

### How to Run the Demonstration

```bash
# From the project root directory
cd exploration/agent-refined

# Run with uv (recommended)
uv run python test_vibe_acp_subprocess.py

# Or run with regular Python (ensure venv is activated)
source ../../.venv/bin/activate
python test_vibe_acp_subprocess.py
```

### Expected Output

The script will show:

1. **Process Management**: Starting the `vibe-acp` subprocess
2. **JSON-RPC Communication**: Request/response cycle with message IDs
3. **Session Lifecycle**: Initialize → Create Session → Send Prompt
4. **Streaming Updates**: Multiple `session/update` notifications
5. **Completion**: Final prompt response with stop reason

### Key Output Examples

```
🔹 Starting vibe-acp subprocess...
✅ vibe-acp subprocess started

📤 JSON-RPC Request (1): initialize
📥 JSON-RPC Response: 1
✅ Initialization successful

🔹 Creating new session...
📤 JSON-RPC Request (2): session/new
📥 JSON-RPC Response: 2
✅ Session created: 57a0ef04-98bb-41c9-973d-d9e7f052cdd6

🔹 Sending prompt: 'Hello, what can you do?'
📤 JSON-RPC Request (3): session/prompt
📥 JSON-RPC Response: session/update
📥 JSON-RPC Response: session/update
... (multiple streaming updates) ...
📥 JSON-RPC Response: 3
✅ Prompt completed. Stop reason: end_turn
```

### Troubleshooting

If you encounter issues:

1. **vibe-acp not found**: Ensure mistral-vibe is installed in the virtual environment
   ```bash
   cd ../..
   uv pip install mistral-vibe
   ```

2. **Permission errors**: Make sure the `.venv/bin/vibe-acp` is executable
   ```bash
   chmod +x .venv/bin/vibe-acp
   ```

3. **JSON decode errors**: Check that the subprocess stdout is properly line-buffered

## Next Steps

This discovery provides the foundation for Phase 2 implementation:

1. **Sandbox Server**: Use the JSON-RPC pattern in `packages/sandbox/server.py`
2. **WebSocket Bridge**: Convert JSON-RPC messages to WebSocket format
3. **Session Management**: Implement session lifecycle handling
4. **Streaming**: Forward `session/update` notifications to frontend

The proven communication pattern can be directly applied to build the FastAPI WebSocket server specified in the requirements.