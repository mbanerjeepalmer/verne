"use client";

import { useState } from "react";
import QueryBlock from "../query-block/query-block";
import { SendPromptToBedrock } from "@/services/aws";
import { TOPIC_CLARIFICATION_PROMPT } from "@/prompts/TOPIC_CLARIFICATION";

const ConversationSection = () => {
  const [response, setResponse] = useState("");

  const handleSubmit = async (text: string) => {
    const llmResponse = await SendPromptToBedrock(
      TOPIC_CLARIFICATION_PROMPT,
      text,
    );
    setResponse(llmResponse);
  };
  return (
    <div className="w-full">
      <QueryBlock onSubmit={handleSubmit} />
      {response && <div>{response}</div>}
    </div>
  );
};

export default ConversationSection;
