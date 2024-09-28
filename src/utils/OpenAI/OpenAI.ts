import { ApiKey } from "./OpenAI.constants";
import { OpenAIChatMessage, OpenAIConfig } from "./OpenAI.types";

export type OpenAIRequest = {
  messages: OpenAIChatMessage[];
} & OpenAIConfig;

export const getOpenAICompletion = async (
  payload: OpenAIRequest
) => {
  let reply = "Something went wrong.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        headers: {
          Authorization: `Bearer ${ApiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(payload),
      });

    // Check for errors
    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    if (data && data.choices && data.choices.length > 0) {
      const assistantMessage = data.choices[0].message.content.trim();
      reply = assistantMessage; // retourne : "Hello! How can I assist you today?"
    } else {
      reply = "Invalid response structure";
    }
   
  } catch (error) {
    console.error('Error fetching response:', error);
    // throw error;
  } 

  return reply;
};
