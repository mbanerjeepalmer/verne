import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

let _client: ElevenLabsClient | null = null;

export function getElevenLabs(): ElevenLabsClient {
  if (!_client) {
    if (!process.env.ELEVEN_LABS_API_KEY) {
      throw new Error("ELEVEN_LABS_API_KEY environment variable is not set");
    }
    _client = new ElevenLabsClient({
      apiKey: process.env.ELEVEN_LABS_API_KEY,
    });
  }
  return _client;
}
