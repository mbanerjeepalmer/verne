#!/usr/bin/env python3
"""
Test script to demonstrate communication with vibe-acp subprocess
This shows the actual Q2 answer: JSON-RPC stdin/stdout communication
"""

import asyncio
import json
import sys
import subprocess
from pathlib import Path

# Add the venv's site-packages to Python path for uv compatibility
venv_site_packages = Path(".venv/lib/python3.12/site-packages")
if venv_site_packages.exists():
    sys.path.insert(0, str(venv_site_packages))


class VibeAcpSubprocessClient:
    def __init__(self):
        self.process = None
        self.session_id = None
        self.request_id = 1

    async def start_vibe_acp(self):
        """Start the vibe-acp subprocess"""
        print("🔹 Starting vibe-acp subprocess...")
        
        # Look for vibe-acp in the project root's .venv
        project_root = Path(__file__).parent.parent.parent
        vibe_acp_path = project_root / ".venv/bin/vibe-acp"
        if not vibe_acp_path.exists():
            raise FileNotFoundError(f"vibe-acp not found at {vibe_acp_path}")
        
        self.process = await asyncio.create_subprocess_exec(
            str(vibe_acp_path),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd="."
        )
        
        print("✅ vibe-acp subprocess started")
        
        # Give it a moment to start
        await asyncio.sleep(1)
        
        return self.process

    async def send_request(self, method, params=None):
        """Send a JSON-RPC request to vibe-acp"""
        if not self.process or self.process.stdin is None:
            raise RuntimeError("Process not started or stdin not available")
        
        request = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {},
            "id": self.request_id
        }
        
        print(f"📤 JSON-RPC Request ({self.request_id}): {method}")
        
        # Write the request to stdin
        request_json = json.dumps(request) + "\n"
        self.process.stdin.write(request_json.encode('utf-8'))
        await self.process.stdin.drain()
        
        self.request_id += 1
        return request

    async def read_response(self):
        """Read a JSON-RPC response from stdout"""
        if not self.process or self.process.stdout is None:
            raise RuntimeError("Process not started or stdout not available")
        
        # Read line by line
        line = await self.process.stdout.readline()
        if not line:
            return None
        
        try:
            response = json.loads(line.decode('utf-8').strip())
            response_id = response.get('id', response.get('method', 'notification'))
            print(f"📥 JSON-RPC Response: {response_id}")
            return response
        except json.JSONDecodeError as e:
            print(f"⚠️  JSON decode error: {e}")
            return None

    async def initialize(self):
        """Initialize the ACP connection"""
        print("🔹 Initializing ACP connection...")
        
        params = {
            "protocol_version": 1,
            "client_capabilities": {
                "terminal": True,
                "fs": {"read_text_file": True, "write_text_file": True},
                "field_meta": {"terminal-auth": True}
            },
            "client_info": {
                "name": "test_client",
                "title": "Test Client",
                "version": "1.0.0"
            }
        }
        
        await self.send_request("initialize", params)
        
        # Read and handle the response
        response = await self.read_response()
        if not response or response.get('error'):
            error_msg = response.get('error', {}).get('message', 'Unknown error')
            raise RuntimeError(f"Initialization failed: {error_msg}")
        
        result = response.get('result', {})
        print(f"✅ Initialization successful")
        print(f"   Agent: {result.get('agent_info', {}).get('name', 'Unknown')}")
        print(f"   Protocol: v{result.get('protocol_version', 1)}")
        
        return result

    async def create_session(self):
        """Create a new session"""
        print("🔹 Creating new session...")
        
        params = {
            "cwd": str(Path.cwd()),
            "mcpServers": []
        }
        await self.send_request("session/new", params)
        
        # Read and handle the response
        response = await self.read_response()
        if not response or response.get('error'):
            error_msg = response.get('error', {}).get('message', 'Unknown error')
            raise RuntimeError(f"Session creation failed: {error_msg}")
        
        result = response.get('result', {})
        self.session_id = result.get('sessionId')
        
        if not self.session_id:
            raise RuntimeError(f"No sessionId in response: {result}")
        
        print(f"✅ Session created: {self.session_id}")
        return result

    async def send_prompt(self, prompt_text):
        """Send a prompt to the agent"""
        if not self.session_id:
            raise ValueError("No active session. Create a session first.")
        
        print(f"🔹 Sending prompt: '{prompt_text}'")
        
        params = {
            "prompt": [{"type": "text", "text": prompt_text}],
            "session_id": self.session_id
        }
        
        await self.send_request("session/prompt", params)
        
        # Read responses until we get the prompt completion
        update_count = 0
        max_updates_to_show = 20
        debug_shown = False
        
        while True:
            response = await self.read_response()
            if not response:
                break
            
            # Debug: show first response structure
            if not debug_shown:
                print(f"   🔍 First response structure: {json.dumps(response, indent=2)}")
                debug_shown = True
            
            if response.get('error'):
                raise RuntimeError(f"Prompt error: {response.get('error')}")
            elif response.get('method') == 'session/update':
                # Handle streaming session updates
                params = response.get('params', {})
                if update_count < max_updates_to_show:
                    await self.handle_session_update(params)
                update_count += 1
            elif response.get('id'):
                # This is the prompt completion response
                result = response.get('result', {})
                print(f"✅ Prompt completed. Stop reason: {result.get('stop_reason', 'unknown')}")
                if update_count > max_updates_to_show:
                    print(f"   📊 {update_count - max_updates_to_show} additional updates not shown")
                return result

    async def handle_session_update(self, params):
        """Handle a session update notification"""
        # Extract the update information from the correct path
        update_info = params.get('update', {})
        update_type = update_info.get('sessionUpdate')
        
        # Handle different types of updates
        if update_type == 'agent_message_chunk':
            content = update_info.get('content', {})
            text = content.get('text', '')
            if text:
                print(f"   💬 Agent: {text}")
        elif update_type == 'agent_thought_chunk':
            content = update_info.get('content', {})
            text = content.get('text', '')
            if text:
                print(f"   🤔 Thought: {text}")
        elif update_type == 'tool_call_update':
            content = update_info.get('content', {})
            print(f"   🛠️  Tool call update: {content}")
        elif update_type == 'compact_start':
            print(f"   🟢 Session started")
        elif update_type == 'compact_end':
            print(f"   🔴 Session ended")
        elif update_type == 'available_commands_update':
            print(f"   📋 Available commands updated")
        else:
            print(f"   📦 Update: {update_type}")

    async def cleanup(self):
        """Clean up the subprocess"""
        if self.process:
            print("🔹 Terminating vibe-acp subprocess...")
            self.process.terminate()
            try:
                await asyncio.wait_for(self.process.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                self.process.kill()
            print("✅ Process terminated")


async def main():
    print("🚀 Testing vibe-acp Subprocess Communication")
    print("=" * 50)
    print("\nThis demonstrates Q2 answer for Option A:")
    print("Communication method: JSON-RPC over stdin/stdout")
    print("=" * 50)
    
    client = VibeAcpSubprocessClient()
    
    try:
        # Step 1: Start vibe-acp subprocess
        await client.start_vibe_acp()
        
        # Step 2: Initialize ACP connection
        await client.initialize()
        
        # Step 3: Create session
        await client.create_session()
        
        # Step 4: Send a prompt and receive streaming responses
        await client.send_prompt("Hello, what can you do?")
        
        print("\n✅ ACP communication test completed!")
        print("\nKey findings for Q2:")
        print("• Protocol: JSON-RPC 2.0 over stdin/stdout")
        print("• Methods: initialize, new_session, prompt, etc.")
        print("• Streaming: session_update notifications")
        print("• Transport: Line-buffered JSON messages")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Clean up
        await client.cleanup()


if __name__ == "__main__":
    # Check if vibe-acp exists
    project_root = Path(__file__).parent.parent.parent
    vibe_acp_path = project_root / ".venv/bin/vibe-acp"
    if not vibe_acp_path.exists():
        print(f"❌ vibe-acp not found at {vibe_acp_path}")
        print("   Make sure mistral-vibe is installed in the virtual environment")
        sys.exit(1)
    
    # Run the async main function
    asyncio.run(main())