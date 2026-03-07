import { NextResponse } from "next/server";

export async function POST() {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const response = await fetch(`${backendUrl}/sandbox/warmup`, {
      method: "POST",
      signal: AbortSignal.timeout(5000), // Short timeout, fire-and-forget
    });

    if (!response.ok) {
      throw new Error("Failed to warmup sandbox");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error warming up sandbox:", error);
    // Silent failure - return 200 to avoid error logs
    return NextResponse.json(
      { error: "Failed to warmup sandbox", success: false },
      { status: 200 }
    );
  }
}
