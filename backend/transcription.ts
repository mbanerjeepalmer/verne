/**
 * Real-time Audio Transcription using Mistral Voxtral
 *
 * Handles WebSocket connections for streaming audio transcription.
 * Converts WebM audio to PCM format and streams to Mistral SDK.
 */

import ffmpeg from "fluent-ffmpeg";
import { Readable, PassThrough } from "stream";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, unlink } from "fs/promises";
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
 * Convert WebM audio buffer to PCM 16-bit format using FFmpeg
 */
async function convertWebMToPCM(webmBuffer: Buffer): Promise<Buffer> {
  const tempInputPath = join(tmpdir(), `input-${Date.now()}.webm`);
  const tempOutputPath = join(tmpdir(), `output-${Date.now()}.pcm`);

  try {
    // Write WebM buffer to temp file
    await writeFile(tempInputPath, webmBuffer);

    return new Promise((resolve, reject) => {
      ffmpeg(tempInputPath)
        .audioCodec("pcm_s16le")
        .audioChannels(1)
        .audioFrequency(SAMPLE_RATE)
        .format("s16le")
        .on("end", async () => {
          try {
            const { readFile } = await import("fs/promises");
            const pcmBuffer = await readFile(tempOutputPath);

            // Cleanup temp files
            await unlink(tempInputPath).catch(() => {});
            await unlink(tempOutputPath).catch(() => {});

            resolve(pcmBuffer);
          } catch (error) {
            reject(error);
          }
        })
        .on("error", (error) => {
          reject(error);
        })
        .save(tempOutputPath);
    });
  } catch (error) {
    // Cleanup on error
    await unlink(tempInputPath).catch(() => {});
    await unlink(tempOutputPath).catch(() => {});
    throw error;
  }
}

/**
 * Create an async generator from PCM buffer for streaming to Mistral
 */
async function* createAudioStream(pcmBuffer: Buffer): AsyncGenerator<Uint8Array> {
  const chunkSize = 4096; // Stream in 4KB chunks

  for (let i = 0; i < pcmBuffer.length; i += chunkSize) {
    const chunk = pcmBuffer.slice(i, Math.min(i + chunkSize, pcmBuffer.length));
    yield new Uint8Array(chunk);
  }
}

/**
 * Handle WebSocket connection for real-time transcription
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

  let audioBuffer: Buffer | null = null;

  // Send ready signal
  ws.send(JSON.stringify({
    type: "ready",
    message: "Server ready to receive audio"
  }));

  // Note: WebSocket message handler will be set up by the caller
  // This function returns a message handler
  return async (message: string | Buffer) => {
    try {
      // Handle text messages (control signals)
      if (typeof message === "string") {
        const data = JSON.parse(message);

        if (data.type === "transcription.start") {
          console.log("[Transcription] Start signal received");
          audioBuffer = Buffer.alloc(0);
          return;
        }

        if (data.type === "transcription.stop") {
          console.log("[Transcription] Stop signal received, processing audio");

          if (!audioBuffer || audioBuffer.length === 0) {
            ws.send(JSON.stringify({
              type: "error",
              message: "No audio data received"
            }));
            return;
          }

          // Convert WebM to PCM
          console.log("[Transcription] Converting WebM to PCM...");
          const pcmBuffer = await convertWebMToPCM(audioBuffer);
          console.log(`[Transcription] Converted to PCM: ${pcmBuffer.length} bytes`);

          // Create audio stream
          const audioStream = createAudioStream(pcmBuffer);

          // Start transcription with Mistral SDK
          console.log("[Transcription] Starting Mistral transcription...");

          for await (const event of client.transcribeStream(
            audioStream,
            "voxtral-mini-transcribe-realtime-2602",
            {
              audioFormat: {
                encoding: AudioEncoding.PcmS16le,
                sampleRate: SAMPLE_RATE,
              },
            }
          )) {
            // Handle different event types from Mistral SDK
            if (event.type === "transcription.text.delta") {
              // Send real-time text delta to client
              ws.send(JSON.stringify({
                type: "transcription.delta",
                text: event.text
              }));
              console.log("[Transcription] Delta:", event.text);
            }

            if (event.type === "transcription.done") {
              // Send final transcription
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

          // Clear buffer after processing
          audioBuffer = null;
          return;
        }
      }

      // Handle binary messages (audio chunks)
      if (Buffer.isBuffer(message)) {
        if (!audioBuffer) {
          console.log("[Transcription] Received audio before start signal, ignoring");
          return;
        }

        // Append audio chunk to buffer
        audioBuffer = Buffer.concat([audioBuffer, message]);
        console.log(`[Transcription] Audio chunk received: ${message.length} bytes (total: ${audioBuffer.length})`);
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
