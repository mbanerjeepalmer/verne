#!/usr/bin/env python3
"""
Test script to demonstrate real ACP communication with vibe-acp subprocess
"""

import asyncio
import json
import sys
import subprocess
from pathlib import Path

# Add the venv's site-packages to Python path
venv_site_packages = Path(".venv/lib/python3.12/site-packages")
if venv_site_packages.exists():
    sys.path.insert(0, str(venv_site_packages))


class RealAcpClient:
    def __init__(self):
        self.process = None
        self.session_id = None
        self.next_request_id = 1

    async def start_vibe_acp(self):
        """Start the vibe-acp subprocess"""
        print("🔹 Starting vibe-acp subprocess...")
        
        # Start the subprocess
        vibe_acp_path = Path(".venv/bin/vibe-acp")
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
        return self.process

    async def send_json_rpc_request(self, method, params=None, request_id=None):
        """Send a JSON-RPC request to the ACP agent"""
        if not self.process or self.process.stdin is None:
            raise RuntimeError("Process not started or stdin not available")
        
        if request_id is None:
            request_id = self.next_request_id
            self.next_request_id += 1
        
        request = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {},
            "id": request_id
        }
        
        print(f"📤 Sending request: {method}")
        if params:
            print(f"   Params: {json.dumps(params, indent=2)}")
        
        # Write the request to stdin
        request_json = json.dumps(request) + "\n"
        self.process.stdin.write(request_json.encode('utf-8'))
        await self.process.stdin.drain()
        
        return request_id

    async def read_response(self):
        """Read a JSON-RPC response from stdout"""
        if not self.process or self.process.stdout is None:
            raise RuntimeError("Process not started or stdout not available")
        
        # Read line by line until we get a complete JSON response
        line = await self.process.stdout.readline()
        if not line:
            return None
        
        try:
            response = json.loads(line.decode('utf-8').strip())
            print(f"📥 Received response: {response.get('method', response.get('id', 'notification'))}")
            return response
        except json.JSONDecodeError as e:
            print(f"⚠️  JSON decode error: {e}")
            print(f"   Raw line: {line.decode('utf-8')}")
            return None

    async def initialize_connection(self):
        """Initialize the ACP connection"""
        print("🔹 Initializing ACP connection...")
        
        params = {
            "protocol_version": 1,
            "client_capabilities": {
                "terminal": True,
                "fs": {
                    "read_text_file": True,
                    "write_text_file": True
                },
                "field_meta": {"terminal-auth": True}
            },
            "client_info": {
                "name": "test_client",
                "title": "Test Client",
                "version": "1.0.0"
            }
        }
        
        request_id = await self.send_json_rpc_request("initialize", params)
        
        # Read the response
        response = await self.read_response()
        if not response or response.get('id') != request_id:
            raise RuntimeError("Did not receive expected initialize response")
        
        print("✅ Initialization successful")
        return response.get('result', {})

    async def create_session(self):
        """Create a new session"""
        print("🔹 Creating new session...")
        
        params = {
            "cwd": "."
        }
        
        request_id = await self.send_json_rpc_request("new_session", params)
        
        # Read the response
        response = await self.read_response()
        if not response:
            raise RuntimeError("No response received")
        
        print(f"   Full response: {json.dumps(response, indent=2)}")
        
        if response.get('id') != request_id:
            raise RuntimeError(f"Response ID {response.get('id')} doesn't match request ID {request_id}")
        
        result = response.get('result', {})
        self.session_id = result.get('session_id')
        
        if not self.session_id:
            raise RuntimeError(f"No session_id in response. Result: {result}")
        
        print(f"✅ Session created: {self.session_id}")
        return result

    async def send_prompt(self, prompt_text):
        """Send a prompt to the agent"""
        if not self.session_id:
            raise ValueError("No active session. Create a session first.")
        
        print(f"🔹 Sending prompt: '{prompt_text}'")
        
        params = {
            "prompt": [
                {
                    "type": "text",
                    "text": prompt_text
                }
            ],
            "session_id": self.session_id
        }
        
        request_id = await self.send_json_rpc_request("prompt", params)
        
        # Read responses until we get the prompt response
        while True:
            response = await self.read_response()
            if not response:
                break
            
            if response.get('id') == request_id:
                print(f"✅ Prompt processed. Stop reason: {response.get('result', {}).get('stop_reason', 'unknown')}")
                return response.get('result', {})
            elif response.get('method') == 'session_update':
                # Handle streaming session updates
                await self.handle_session_update(response.get('params', {}))

    async def handle_session_update(self, update_params):
        """Handle a session update notification"""
        update_type = update_params.get('session_update')
        content = update_params.get('content', {})
        
        print(f"   📥 Update received: {update_type}")
        
        if update_type == 'agent_message_chunk':
            text = content.get('text', '')
            print(f"   💬 Message: {text}")
        elif update_type == 'agent_thought_chunk':
            text = content.get('text', '')
            print(f"   🤔 Thought: {text}")
        elif update_type == 'tool_call_update':
            print(f"   🛠️  Tool call: {content}")
        else:
            print(f"   ⚠️  Unknown update type: {update_type}")

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
    print("🚀 Testing Real ACP Communication with Mistral Vibe")
    print("=" * 55)
    
    client = RealAcpClient()
    
    try:
        # Step 1: Start vibe-acp subprocess
        await client.start_vibe_acp()
        
        # Give it a moment to start
        await asyncio.sleep(1)
        
        # Step 2: Initialize connection
        init_result = await client.initialize_connection()
        
        # Step 3: Create session
        session_result = await client.create_session()
        
        # Step 4: Send a prompt
        await client.send_prompt("Hello, what can you do?")
        
        print("\n✅ Test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Clean up
        await client.cleanup()


if __name__ == "__main__":
    # Check if vibe-acp exists
    vibe_acp_path = Path(".venv/bin/vibe-acp")
    if not vibe_acp_path.exists():
        print(f"❌ vibe-acp not found at {vibe_acp_path}")
        print("   Make sure mistral-vibe is installed in the virtual environment")
        sys.exit(1)
    
    # Run the async main function
    asyncio.run(main())