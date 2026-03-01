import { NextResponse } from "next/server";

export async function POST() {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const response = await fetch(`${backendUrl}/sandbox/restart`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to restart sandbox");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error restarting sandbox:", error);
    return NextResponse.json(
      { error: "Failed to restart sandbox" },
      { status: 500 },
    );
  }
}
