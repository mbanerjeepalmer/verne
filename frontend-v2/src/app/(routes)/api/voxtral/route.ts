import { NextRequest, NextResponse } from "next/server";

/**
 * Voxtral Audio Transcription API Route
 *
 * Uses Mistral's REST API for audio transcription.
 * Accepts audio files and returns transcription text.
 */

export async function POST(request: NextRequest) {
  try {
    // Get API key from environment
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error("MISTRAL_API_KEY not configured");
      return NextResponse.json(
        { error: "MISTRAL_API_KEY not configured" },
        { status: 500 },
      );
    }

    // Get audio file from form data
    const formData = await request.formData();
    const audioBlob = formData.get("audio") as File | null;

    if (!audioBlob) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    console.log(`[Voxtral] Received audio file: ${audioBlob.name}, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

    // Create form data for Mistral API
    const mistralFormData = new FormData();
    mistralFormData.append("file", audioBlob, audioBlob.name);
    mistralFormData.append("model", "voxtral-mini-transcribe-realtime-2602");

    console.log("[Voxtral] Sending to Mistral API...");

    // Call Mistral API
    const response = await fetch(
      "https://api.mistral.ai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: mistralFormData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Voxtral] API error: ${response.status} ${response.statusText}`);
      console.error(`[Voxtral] Error details: ${errorText}`);

      return NextResponse.json(
        {
          error: `Voxtral API error: ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      );
    }

    const result = await response.json();
    console.log(`[Voxtral] Transcription successful: "${result.text?.substring(0, 50)}..."`);

    return NextResponse.json({
      success: true,
      transcription: result.text || "",
      provider: "voxtral",
    });
  } catch (error) {
    console.error("[Voxtral] Error processing audio:", error);
    return NextResponse.json(
      {
        error: "Failed to process audio",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
