"use server";

export const sendPromptToMistral = async (
  systemPrompt: string,
  prompt: string,
): Promise<string> => {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not set");
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "ministral-3b-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(
      `Mistral API error: ${JSON.stringify(data)}`,
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
};
