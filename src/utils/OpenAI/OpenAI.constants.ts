import { OpenAIModel } from "./OpenAI.types";

export const OpenAIChatModels: Record<string, OpenAIModel> = {

  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "gpt-4o-mini",
    maxLimit: 16384,
  },

  "chatgpt-4o-latest": {
    id: "chatgpt-4o-latest",
    name: "chatgpt-4o-latest",
    maxLimit: 16384,
  },

  "o1-mini-2024-09-12": {
    id: "o1-mini-2024-09-12",
    name: "o1-mini-2024-09-12",
    maxLimit: 65536,
  },

  "o1-preview-2024-09-12": {
    id: "o1-preview-2024-09-12",
    name: "o1-preview-2024-09-12",
    maxLimit: 32768,
  },
};

export const defaultConfig = {
  model: "chatgpt-4o-latest",
  max_completion_tokens: 16384,
};

export const ApiKey: string = process.env.REACT_APP_API_KEY ?? '';
export const UserId: string = process.env.REACT_APP_USER_ID ?? '';
export const OrganisationKey: string = process.env.REACT_APP_ORG_KEY ?? '';
