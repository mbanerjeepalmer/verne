import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

let _client: ElevenLabsClient | null = null;

export function getElevenLabs(): ElevenLabsClient {
  if (!_client) {
    _client = new ElevenLabsClient();
  }
  return _client;
}
