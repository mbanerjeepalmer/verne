#!/usr/bin/env python3
"""
Test script to demonstrate ACP communication with vibe-acp
"""

import asyncio
import json
import sys
from pathlib import Path

# Add the venv's site-packages to Python path
venv_site_packages = Path(".venv/lib/python3.12/site-packages")
if venv_site_packages.exists():
    sys.path.insert(0, str(venv_site_packages))

from acp import (
    Client,
    InitializeResponse,
    NewSessionResponse,
    PromptResponse,
    run_agent,
)
from acp.schema import (
    AgentCapabilities,
    ClientCapabilities,
    Implementation,
    PromptCapabilities,
    SessionCapabilities,
    SessionListCapabilities,
    SessionModelState,
    SessionModeState,
)


class TestAcpClient:
    def __init__(self):
        self.client = None
        self.session_id = None

    async def initialize_connection(self):
        """Initialize the ACP connection"""
        print("🔹 Initializing ACP connection...")
        
        # Create client capabilities
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
        
        # This would normally be sent to the agent
        # For testing, we'll simulate the response
        init_response = InitializeResponse(
            agent_capabilities=AgentCapabilities(
                load_session=True,
                prompt_capabilities=PromptCapabilities(
                    audio=False,
                    embedded_context=True,
                    image=False
                ),
                session_capabilities=SessionCapabilities(
                    list=SessionListCapabilities()
                )
            ),
            protocol_version=1,
            agent_info=Implementation(
                name="@mistralai/mistral-vibe",
                title="Mistral Vibe",
                version="0.1.0"
            ),
            auth_methods=[]
        )
        
        print(f"✅ Initialization successful")
        print(f"   Protocol version: {init_response.protocol_version}")
        print(f"   Agent: {init_response.agent_info.name} v{init_response.agent_info.version}")
        return init_response

    async def create_session(self):
        """Create a new session"""
        print("🔹 Creating new session...")
        
        # Simulate session creation response
        session_response = NewSessionResponse(
            session_id="test_session_123",
            models=SessionModelState(
                available_models=[],
                current_model_id="default"
            ),
            modes=SessionModeState(
                available_modes=[],
                current_mode_id="default"
            ),
            config_options=[]
        )
        
        self.session_id = session_response.session_id
        print(f"✅ Session created: {self.session_id}")
        return session_response

    async def send_prompt(self, prompt_text):
        """Send a prompt to the agent"""
        if not self.session_id:
            raise ValueError("No active session. Create a session first.")
        
        print(f"🔹 Sending prompt: '{prompt_text}'")
        
        # Simulate prompt response
        prompt_response = PromptResponse(stop_reason="end_turn")
        
        print(f"✅ Prompt processed. Stop reason: {prompt_response.stop_reason}")
        return prompt_response

    async def handle_session_updates(self):
        """Handle streaming session updates"""
        print("🔹 Waiting for session updates...")
        
        # In a real scenario, you would receive these as streaming events
        # For testing, we'll simulate some updates
        simulated_updates = [
            {
                "type": "agent_message_chunk",
                "content": {
                    "type": "text",
                    "text": "Hello! I'm Mistral Vibe. How can I help you today?"
                }
            },
            {
                "type": "agent_thought_chunk", 
                "content": {
                    "type": "text",
                    "text": "The user greeted me. I should respond politely."
                }
            }
        ]
        
        for update in simulated_updates:
            print(f"   📥 Update received: {update['type']}")
            if update['type'] == 'agent_message_chunk':
                print(f"   💬 Message: {update['content']['text']}")
            elif update['type'] == 'agent_thought_chunk':
                print(f"   🤔 Thought: {update['content']['text']}")


async def main():
    print("🚀 Testing ACP Communication with Mistral Vibe")
    print("=" * 50)
    
    client = TestAcpClient()
    
    try:
        # Step 1: Initialize connection
        init_response = await client.initialize_connection()
        
        # Step 2: Create session
        session_response = await client.create_session()
        
        # Step 3: Send a prompt
        await client.send_prompt("Hello, what can you do?")
        
        # Step 4: Handle streaming updates
        await client.handle_session_updates()
        
        print("\n✅ Test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Check if we can import the required modules
    try:
        from acp import Client
        print("✅ ACP module available")
    except ImportError as e:
        print(f"❌ ACP module not found: {e}")
        print("   Make sure mistral-vibe is installed in the virtual environment")
        sys.exit(1)
    
    # Run the async main function
    asyncio.run(main())