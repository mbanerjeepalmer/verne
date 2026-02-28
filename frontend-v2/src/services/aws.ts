"use server";

export const SendPromptToBedrock = async (prompt: string): Promise<string> => {
  const region = "us-east-2";
  const model = "mistral.ministral-3-14b-instruct";
  const endpoint = `https://bedrock-runtime.${region}.amazonaws.com/model/${model}/converse`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AWS_BEDROCK_API_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send prompt to Bedrock");
  }

  const data = await response.json();

  return data.output?.message?.content?.[0]?.text ?? "";
};
