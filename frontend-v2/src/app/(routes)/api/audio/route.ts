import { getElevenLabs } from "@/services/services";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get("audio") as File | null;

    if (!audioBlob) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const transcription = await getElevenLabs().speechToText.convert({
      file: audioBlob,
      modelId: "scribe_v2", // Model to use
      tagAudioEvents: true, // Tag audio events like laughter, applause, etc.
      languageCode: "eng", // Language of the audio file. If set to null, the model will detect the language automatically.
      diarize: true, // Whether to annotate who is speaking
    });

    return NextResponse.json({
      success: true,
      message: "Audio received successfully",
      transcription: transcription.text,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process audio";
    console.error("Error processing audio:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
