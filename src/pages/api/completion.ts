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

      // Appel à la fonction qui récupère la réponse et les tokens
      const { reply, tokenUsage } = await getOpenAICompletion(payload);

      // Retourner la réponse structurée avec la réponse et le nombre de tokens utilisés
      const responseBody = JSON.stringify({ reply, tokenUsage });

      // Retourner la réponse structurée
      return new Response(responseBody, {
        status: 200,
        headers: {
          "Content-Type": "application/json", // Indiquer que le contenu est du JSON
        },
      });

    } catch (e: any) {
      // Capture l'erreur et renvoie-la sous forme de texte simple
      return new Response(await req.text() || "Error fetching response.", {
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
