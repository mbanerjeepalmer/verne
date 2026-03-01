/**
 * Real-time Audio Transcription using Mistral Voxtral
 *
 * Handles WebSocket connections for streaming audio transcription.
 * Receives PCM audio from browser (converted via Web Audio API) and
 * streams directly to Mistral SDK in real-time — no buffering.
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
 * chunks over WebSocket → backend streams them to Mistral Voxtral in real-time.
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

  const client = new RealtimeTranscription({
    apiKey: MISTRAL_API_KEY,
    serverURL: process.env.MISTRAL_BASE_URL || "wss://api.mistral.ai",
  });

  let isRecording = false;

  // Push-based async generator state for real-time streaming
  let chunkQueue: Uint8Array[] = [];
  let chunkResolve: (() => void) | null = null;
  let streamDone = false;

  async function* audioStream(): AsyncGenerator<Uint8Array> {
    while (!streamDone) {
      if (chunkQueue.length > 0) {
        yield chunkQueue.shift()!;
      } else {
        await new Promise<void>((resolve) => {
          chunkResolve = resolve;
        });
      }
    }
    // Yield any remaining chunks after stream ends
    while (chunkQueue.length > 0) {
      yield chunkQueue.shift()!;
    }
  }

  function pushChunk(chunk: Uint8Array) {
    chunkQueue.push(chunk);
    if (chunkResolve) {
      const resolve = chunkResolve;
      chunkResolve = null;
      resolve();
    }
  }

  function endStream() {
    streamDone = true;
    if (chunkResolve) {
      const resolve = chunkResolve;
      chunkResolve = null;
      resolve();
    }
  }

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
          isRecording = true;
          chunkQueue = [];
          streamDone = false;

          // Start streaming to Mistral immediately in the background
          (async () => {
            try {
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
            } catch (error) {
              console.error("[Transcription] Stream error:", error);
              ws.send(JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "Transcription stream error"
              }));
            } finally {
              // Clean up Mistral client to free the connection
              try {
                client.close?.();
              } catch {
                // ignore cleanup errors
              }
            }
          })();
          return;
        }

        if (data.type === "transcription.stop") {
          console.log("[Transcription] Stop signal received");
          isRecording = false;
          endStream();
          return;
        }
      }

      // Handle binary messages (PCM audio chunks from browser)
      if (Buffer.isBuffer(message)) {
        if (!isRecording) {
          return;
        }

        pushChunk(new Uint8Array(message));
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
