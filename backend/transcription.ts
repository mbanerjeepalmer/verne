/**
 * Real-time Audio Transcription using Mistral Voxtral
 *
 * Handles WebSocket connections for streaming audio transcription.
 * Receives PCM audio from browser (converted via Web Audio API) and
 * streams directly to Mistral SDK — no ffmpeg required.
 */

import {
  AudioEncoding,
  RealtimeTranscription,
} from "@mistralai/mistralai/extra/realtime";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const SAMPLE_RATE = 16000;

interface TranscriptionWebSocket {
  send: (data: string) => void;
  close: () => void;
}

/**
 * Handle WebSocket connection for real-time transcription.
 *
 * Audio flow: Browser captures PCM 16-bit via Web Audio API → sends binary
 * chunks over WebSocket → backend streams them directly to Mistral Voxtral.
 */
export async function handleTranscriptionWebSocket(ws: TranscriptionWebSocket) {
  console.log("[Transcription] Client connected");

  if (!MISTRAL_API_KEY) {
    ws.send(JSON.stringify({
      type: "error",
      message: "MISTRAL_API_KEY not configured on server"
    }));
    ws.close();
    return;
  }

  // Initialize Mistral client
  const client = new RealtimeTranscription({
    apiKey: MISTRAL_API_KEY,
    serverURL: process.env.MISTRAL_BASE_URL || "wss://api.mistral.ai",
  });

  let pcmChunks: Uint8Array[] = [];
  let isRecording = false;

  // Send ready signal
  ws.send(JSON.stringify({
    type: "ready",
    message: "Server ready to receive audio"
  }));

  return async (message: string | Buffer) => {
    try {
      // Handle text messages (control signals)
      if (typeof message === "string") {
        const data = JSON.parse(message);

        if (data.type === "transcription.start") {
          console.log("[Transcription] Start signal received");
          pcmChunks = [];
          isRecording = true;
          return;
        }

        if (data.type === "transcription.stop") {
          console.log("[Transcription] Stop signal received, processing audio");
          isRecording = false;

          if (pcmChunks.length === 0) {
            ws.send(JSON.stringify({
              type: "error",
              message: "No audio data received"
            }));
            return;
          }

          // Create async generator from collected PCM chunks
          const chunks = pcmChunks;
          pcmChunks = [];

          async function* audioStream(): AsyncGenerator<Uint8Array> {
            for (const chunk of chunks) {
              yield chunk;
            }
          }

          // Stream to Mistral
          console.log(`[Transcription] Streaming ${chunks.length} PCM chunks to Mistral...`);

          for await (const event of client.transcribeStream(
            audioStream(),
            "voxtral-mini-transcribe-realtime-2602",
            {
              audioFormat: {
                encoding: AudioEncoding.PcmS16le,
                sampleRate: SAMPLE_RATE,
              },
            }
          )) {
            if (event.type === "transcription.text.delta") {
              ws.send(JSON.stringify({
                type: "transcription.delta",
                text: event.text
              }));
              console.log("[Transcription] Delta:", event.text);
            }

            if (event.type === "transcription.done") {
              ws.send(JSON.stringify({
                type: "transcription.done",
                text: event.text
              }));
              console.log("[Transcription] Done");
              break;
            }

            if (event.type === "error") {
              const errorMessage = typeof event.error.message === "string"
                ? event.error.message
                : JSON.stringify(event.error.message);

              ws.send(JSON.stringify({
                type: "error",
                message: errorMessage
              }));
              console.error("[Transcription] Error:", errorMessage);
              break;
            }
          }
          return;
        }
      }

      // Handle binary messages (PCM audio chunks from browser)
      if (Buffer.isBuffer(message)) {
        if (!isRecording) {
          console.log("[Transcription] Received audio before start signal, ignoring");
          return;
        }

        pcmChunks.push(new Uint8Array(message));
        console.log(`[Transcription] PCM chunk received: ${message.length} bytes (chunks: ${pcmChunks.length})`);
      }

    } catch (error) {
      console.error("[Transcription] Error processing message:", error);
      ws.send(JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      }));
    }
  };
}
