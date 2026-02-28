/**
 * Voxtral Real-Time Audio Transcription Service
 *
 * Provides transcription using Mistral's Voxtral model via WebSocket streaming.
 * Supports both real-time streaming and batch transcription.
 */

interface VoxtralConfig {
  apiKey: string;
  model?: string;
  targetStreamingDelayMs?: number;
  websocketUrl?: string;
}

interface TranscriptionResult {
  text: string;
  isPartial: boolean;
}

type VoxtralEventHandler = (result: TranscriptionResult) => void;

/**
 * Voxtral Client for audio transcription
 */
export class VoxtralClient {
  private apiKey: string;
  private model: string;
  private targetStreamingDelayMs: number;
  private websocketUrl: string;
  private ws: WebSocket | null = null;
  private eventHandlers: VoxtralEventHandler[] = [];

  constructor(config: VoxtralConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "voxtral-mini-transcribe-realtime-2602";
    this.targetStreamingDelayMs = config.targetStreamingDelayMs || 1200;
    this.websocketUrl = config.websocketUrl || "wss://api.mistral.ai/v1/audio/transcriptions";
  }

  /**
   * Connect to Voxtral WebSocket endpoint
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.websocketUrl);

        this.ws.onopen = () => {
          console.log("Voxtral WebSocket connected");

          // Send initial configuration
          this.ws?.send(JSON.stringify({
            type: "config",
            model: this.model,
            target_streaming_delay_ms: this.targetStreamingDelayMs,
            audio: {
              encoding: "pcm_s16le",
              sample_rate: 16000,
              channels: 1,
            }
          }));

          resolve();
        };

        this.ws.onerror = (error) => {
          console.error("Voxtral WebSocket error:", error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log("Voxtral WebSocket closed");
          this.ws = null;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case "RealtimeTranscriptionSessionCreated":
          console.log("Transcription session created");
          break;

        case "TranscriptionStreamTextDelta":
          this.eventHandlers.forEach(handler => {
            handler({
              text: message.delta || "",
              isPartial: true,
            });
          });
          break;

        case "TranscriptionStreamDone":
          this.eventHandlers.forEach(handler => {
            handler({
              text: message.text || "",
              isPartial: false,
            });
          });
          break;

        case "RealtimeTranscriptionError":
          console.error("Voxtral error:", message.error);
          break;

        default:
          console.log("Unknown event type:", message.type);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  /**
   * Subscribe to transcription events
   */
  public onTranscription(handler: VoxtralEventHandler): () => void {
    this.eventHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Send audio data for transcription
   */
  public async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    // Send audio in chunks if needed
    const chunkSize = 4096;
    const view = new Uint8Array(audioData);

    for (let i = 0; i < view.length; i += chunkSize) {
      const chunk = view.slice(i, Math.min(i + chunkSize, view.length));
      this.ws?.send(JSON.stringify({
        type: "audio",
        data: Array.from(chunk),
      }));
    }
  }

  /**
   * Complete the transcription session
   */
  public async complete(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "complete" }));
    }
  }

  /**
   * Close the WebSocket connection
   */
  public close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Transcribe audio file (batch mode)
   */
  public async transcribeFile(audioBuffer: ArrayBuffer): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let fullTranscription = "";

      // Subscribe to transcription events
      const unsubscribe = this.onTranscription((result) => {
        if (!result.isPartial) {
          fullTranscription = result.text;
        }
      });

      try {
        await this.connect();
        await this.sendAudio(audioBuffer);
        await this.complete();

        // Wait for final transcription
        setTimeout(() => {
          unsubscribe();
          this.close();
          resolve(fullTranscription);
        }, 2000);
      } catch (error) {
        unsubscribe();
        this.close();
        reject(error);
      }
    });
  }
}

/**
 * Convert WebM audio to PCM 16-bit format for Voxtral
 */
export async function convertWebMToPCM(webmBlob: Blob): Promise<ArrayBuffer> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 16000,
  });

  try {
    // Read the WebM blob as array buffer
    const arrayBuffer = await webmBlob.arrayBuffer();

    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get the audio data (mono channel)
    const channelData = audioBuffer.getChannelData(0);

    // Convert float32 to int16 PCM
    const pcmData = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    return pcmData.buffer;
  } finally {
    await audioContext.close();
  }
}

/**
 * Simple server-side transcription (for API route)
 */
export async function transcribeAudioServer(
  audioBuffer: Buffer,
  apiKey: string,
): Promise<string> {
  const response = await fetch("https://api.mistral.ai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "voxtral-mini-transcribe-realtime-2602",
      audio: {
        data: Array.from(new Uint8Array(audioBuffer)),
        encoding: "pcm_s16le",
        sample_rate: 16000,
        channels: 1,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Voxtral API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.text || "";
}
