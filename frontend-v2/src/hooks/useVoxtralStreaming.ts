/**
 * useVoxtralStreaming Hook
 *
 * Provides real-time audio streaming transcription using Voxtral WebSocket API.
 * Text appears in real-time as the user speaks.
 */

import { useRef, useCallback, useState } from 'react';

interface VoxtralStreamingOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  apiKey?: string;
}

interface VoxtralMessage {
  type: string;
  delta?: string;
  text?: string;
  error?: string;
}

export function useVoxtralStreaming({
  onTranscript,
  onError,
  apiKey,
}: VoxtralStreamingOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  /**
   * Convert Float32 audio to Int16 PCM
   */
  const floatTo16BitPCM = useCallback((float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }, []);

  /**
   * Start streaming transcription
   */
  const startStreaming = useCallback(async () => {
    try {
      setIsStreaming(true);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      // Create WebSocket connection
      const ws = new WebSocket('wss://api.mistral.ai/v1/audio/transcriptions');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Voxtral] WebSocket connected');

        // Send configuration
        ws.send(JSON.stringify({
          type: 'config',
          model: 'voxtral-mini-transcribe-realtime-2602',
          target_streaming_delay_ms: 800, // Lower for more real-time feel
          audio: {
            encoding: 'pcm_s16le',
            sample_rate: 16000,
            channels: 1,
          },
        }));

        // Set up audio processing
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = floatTo16BitPCM(inputData);

            // Send audio chunk
            ws.send(JSON.stringify({
              type: 'audio',
              data: Array.from(pcmData),
            }));
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      ws.onmessage = (event) => {
        try {
          const message: VoxtralMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'RealtimeTranscriptionSessionCreated':
              console.log('[Voxtral] Session created');
              break;

            case 'TranscriptionStreamTextDelta':
              // Real-time text delta (partial result)
              if (message.delta) {
                onTranscript(message.delta, false);
              }
              break;

            case 'TranscriptionStreamDone':
              // Final transcription
              if (message.text) {
                onTranscript(message.text, true);
              }
              break;

            case 'RealtimeTranscriptionError':
              console.error('[Voxtral] Error:', message.error);
              onError?.(new Error(message.error || 'Voxtral error'));
              break;

            default:
              console.log('[Voxtral] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[Voxtral] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[Voxtral] WebSocket error:', error);
        onError?.(new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        console.log('[Voxtral] WebSocket closed');
        setIsStreaming(false);
      };

    } catch (error) {
      console.error('[Voxtral] Error starting stream:', error);
      setIsStreaming(false);
      onError?.(error instanceof Error ? error : new Error('Failed to start streaming'));
    }
  }, [floatTo16BitPCM, onTranscript, onError]);

  /**
   * Stop streaming transcription
   */
  const stopStreaming = useCallback(() => {
    console.log('[Voxtral] Stopping stream...');

    // Send completion signal
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'complete' }));
    }

    // Clean up audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsStreaming(false);
  }, []);

  return {
    startStreaming,
    stopStreaming,
    isStreaming,
  };
}
