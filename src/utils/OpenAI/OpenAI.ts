import { ApiKey } from "./OpenAI.constants";
import { OpenAIChatMessage, OpenAIConfig } from "./OpenAI.types";

export type OpenAIRequest = {
  messages: OpenAIChatMessage[];
} & OpenAIConfig;

export const getOpenAICompletion = async (
  payload: OpenAIRequest
): Promise<string> => {
  let reply = "Something went wrong."; // Valeur par défaut en cas d'erreur

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        Authorization: `Bearer ${ApiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Vérifier si la réponse est correcte
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        reply = errorData.error?.message || "An error occurred.";
      } else {
        reply = `Unexpected response format from server. Status: ${response.status}`;
      }
    } else {
      // Extraire la réponse au format JSON
      const data = await response.json();
      if (data && data.choices && data.choices.length > 0) {
        reply = data.choices[0].message.content.trim();
      } else {
        reply = "Invalid response structure from OpenAI API.";
      }
    }

  } catch (error: any) {
    console.error("Error fetching response:", error);
    reply = error.message || "An unexpected error occurred.";
  }

  return reply;
};
