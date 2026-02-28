#!/usr/bin/env python3
"""
Test script to demonstrate ACP communication using the ACP Client
"""

import asyncio
import sys
from pathlib import Path

# Add the venv's site-packages to Python path
venv_site_packages = Path(".venv/lib/python3.12/site-packages")
if venv_site_packages.exists():
    sys.path.insert(0, str(venv_site_packages))

from acp import Client, run_agent
from acp.schema import (
    ClientCapabilities,
    Implementation,
)
from vibe.acp.acp_agent_loop import VibeAcpAgentLoop


class TestAcpClient:
    def __init__(self):
        self.client = None
        self.agent = VibeAcpAgentLoop()
        self.session_id = None

    async def connect_and_initialize(self):
        """Connect to the ACP agent and initialize"""
        print("🔹 Connecting to ACP agent...")
        
        # Create a client connection
        self.client = Client()
        
        # Initialize the agent
        client_caps = ClientCapabilities(
            terminal=True,
            fs={
                "read_text_file": True,
                "write_text_file": True,
            },
            field_meta={"terminal-auth": True}
        )
        
        client_info = Implementation(
            name="test_client",
            title="Test Client",
            version="1.0.0"
        )
        
        init_response = await self.agent.initialize(
            protocol_version=1,
            client_capabilities=client_caps,
            client_info=client_info
        )
        
        print("✅ Initialization successful")
        print(f"   Agent: {init_response.agent_info.name}")
        print(f"   Protocol: v{init_response.protocol_version}")
        
        # Set the client reference in the agent
        self.agent.on_connect(self.client)
        
        return init_response

    async def create_session(self):
        """Create a new session"""
        print("🔹 Creating new session...")
        
        session_response = await self.agent.new_session(cwd=".")
        
        if not session_response:
            raise RuntimeError("Failed to create session")
        
        self.session_id = session_response.session_id
        print(f"✅ Session created: {self.session_id}")
        
        return session_response

    async def send_prompt(self, prompt_text):
        """Send a prompt to the agent"""
        if not self.session_id:
            raise ValueError("No active session. Create a session first.")
        
        print(f"🔹 Sending prompt: '{prompt_text}'")
        
        # Send the prompt
        prompt_response = await self.agent.prompt(
            prompt=[{"type": "text", "text": prompt_text}],
            session_id=self.session_id
        )
        
        print(f"✅ Prompt processed. Stop reason: {prompt_response.stop_reason}")
        
        return prompt_response


async def main():
    print("🚀 Testing ACP Client Communication with Mistral Vibe")
    print("=" * 55)
    
    client = TestAcpClient()
    
    try:
        # Step 1: Initialize connection
        init_response = await client.connect_and_initialize()
        
        # Step 2: Create session
        session_response = await client.create_session()
        
        # Step 3: Send a prompt
        await client.send_prompt("Hello, what can you do?")
        
        print("\n✅ Test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())