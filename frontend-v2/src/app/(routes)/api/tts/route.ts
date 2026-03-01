import { getElevenLabs } from "@/services/services";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId = DEFAULT_VOICE_ID } = body;

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const audio = await getElevenLabs().textToSpeech.convert(voiceId, {
      text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    });

    const chunks: Uint8Array[] = [];
    const reader = audio.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate speech";
    console.error("Error generating speech:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
