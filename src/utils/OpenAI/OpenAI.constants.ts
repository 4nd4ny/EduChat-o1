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

export const ApiKey: string = process.env.SECRET_API_KEY ?? '';
export const SecretPassword: string = process.env.SECRET_PASSWD ?? '';
export const AllowedHours: string = process.env.SECRET_ALLOWED_HOURS ?? '[]';
export const AllowedIps: string[] = process.env.SECRET_ALLOWED_IPS 
  ? process.env.SECRET_ALLOWED_IPS.split(',').map(ip => ip.trim()).filter(ip => isValidIP(ip))
  : [];

// Fonction de validation d'IP : est-ce vraiment utile ?
function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){2}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:))$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
