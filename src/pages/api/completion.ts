import { getOpenAICompletion, OpenAIRequest } from "@/utils/OpenAI";

export const config = {
  runtime: "edge",
};

export default async function handler(
  req: Request,
) {
  if (req.method === 'POST') {
    try {
      const { model, max_completion_tokens, messages } = await req.json();

      if (!messages) {
        return new Response("Missing messages", { status: 400 });
      }

      const payload: OpenAIRequest = {
        model,
        max_completion_tokens,
        messages,
      };

      const answer = await getOpenAICompletion(payload);
      return new Response(answer, { status: 200 });
    } catch (e: any) {
      return new Response(e.message || "Error fetching response.", { status: 500 });
    }
  } else {
    return new Response("Method not allowed", { status: 405 });
  }
}
