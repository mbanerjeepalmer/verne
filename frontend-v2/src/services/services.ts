import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export const xelevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY!,
});
