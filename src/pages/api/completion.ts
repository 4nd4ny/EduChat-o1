import { getOpenAICompletion, OpenAIRequest } from "@/utils/OpenAI";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method === 'POST') {
    try {
      const { model, max_completion_tokens, messages } = await req.json();

      if (!messages) {
        return new Response("Missing messages", {
          status: 400,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }

      const payload: OpenAIRequest = {
        model,
        max_completion_tokens,
        messages,
      };

      const answer = await getOpenAICompletion(payload);

      // Retourner directement la réponse sous forme de texte
      return new Response(answer, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });

    } catch (e: any) {
      // Capture l'erreur et renvoie-la sous forme de texte simple
      return new Response(e.message || "Error fetching response.", {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
  } else {
    return new Response("Method not allowed. Only POST requests are supported.", {
      status: 405,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
