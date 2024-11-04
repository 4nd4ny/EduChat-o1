import { v4 as uuidv4 } from "uuid";
import {
  Conversation,
  getHistory,
  clearHistory,
  storeConversation,
  History,
  deleteConversationFromHistory,
  updateConversation,
} from "./History";
import {
  OpenAIChatMessage,
  OpenAIChatModels,
  ApiKey,
  OpenAIRequest
} from "@/utils/OpenAI";
import React, { 
  PropsWithChildren, 
  useCallback, 
  useEffect,
} from "react";
import { useRouter } from "next/router";

const CHAT_ROUTE = "/";

const defaultContext = {
  loading: false,
  
  messages: [] as OpenAIChatMessage[],
  submit: () => {},
  addMessage: () => {},
  updateMessageContent: (id: number, content: string) => {},
  removeMessage: (id: number) => {},
  regenerateMessage: () => {},
  toggleMessageRole: (id: number) => {},

  conversationId: "",
  conversationName: "",
  updateConversationName: () => {},
  generateTitle: () => {},
  loadConversation: (id: string, conversation: Conversation) => {},
  importConversation: (jsonData: any) => {},
  resetConversation: () => {}, 
  deleteConversation: () => {},  
  clearConversation: () => {},

  conversations: {} as History,
  clearConversations: () => {},

  error: "",
};

const OpenAIContext = React.createContext<{
  loading: boolean;

  messages: OpenAIChatMessage[];
  submit: () => void;
  addMessage: (
    content?: string,
    submit?: boolean,
    role?: "user" | "assistant"
  ) => void;
  updateMessageContent: (id: number, content: string) => void;
  removeMessage: (id: number) => void;
  regenerateMessage: () => void;
  toggleMessageRole: (id: number) => void;

  conversationId: string;
  conversationName: string;
  updateConversationName: (id: string, name: string) => void;
  generateTitle: () => void;

  loadConversation: (id: string, conversation: Conversation) => void;
  importConversation: (jsonData: any) => void;
  resetConversation: () => void; 
  deleteConversation: (id: string) => void;
  clearConversation: () => void;
  conversations: History;
  clearConversations: () => void;

  error: string;
}>(defaultContext);

export default function OpenAIProvider({ children }: PropsWithChildren) {
  
  // General
  const router = useRouter(); 
  const [loading, setLoading] = React.useState(false);

  // Model
  const modelList = Object.keys(OpenAIChatModels);

  // Messages
  const [messages, setMessages] = React.useState<OpenAIChatMessage[]>([]);
  
  // Fonction updateTokenCount pour mettre à jour le total de tokens :
  const updateTotalTokens = (newTotal: number) => {
    localStorage.setItem('totalTokens', newTotal.toString());
    // Créez un événement personnalisé
    const event = new Event('totalTokensUpdated');
    window.dispatchEvent(event);
  };
  function updateTokenCount(tokenUsage: number) {
    const storedTokens = localStorage.getItem('totalTokens');
    const previousTokenTotal = storedTokens ? parseInt(storedTokens, 10) : 0;
    const totalTokens = previousTokenTotal + tokenUsage;
    updateTotalTokens(totalTokens);
  }
  function estimateFrenchTokens(text: string) {
    // 1 token = 3,5 caractères (à la louche pour le français...) mais c'est plus compliqué que ça 
    const wordCount = text.split(/\s+/).length;  // Nombre de mots (séparés par espace)
    const charCount = text.length;  // Nombre total de caractères, y compris non-lettres
    const estimatedTokens = (0.75 * wordCount) + (charCount / 4);  // Formule approximative
    return Math.ceil(estimatedTokens);
  }
  function updateInputTokens(text: string) {
    /*
      // Use tiktoken to better count tokens
      const { encoding_for_model } = require("tiktoken");
      async function countTokens(text, model = "gpt-3.5-turbo") {
        const encoder = await encoding_for_model(model); // Chargement de l'encodeur basé sur le modèle
        const tokens = encoder.encode(text); // Tokenisation du texte
        return tokens.length;
      }
    */
    updateTokenCount(estimateFrenchTokens(text)); 
  }
  
  const submit = useCallback(
    async (messages_: OpenAIChatMessage[] = [], modelIndex: number = 0) => {
      
      if (loading) return; // Si déjà en cours, on ne fait rien
      setLoading(true); // Verrouille le bouton submit

      const messagesToSend = messages_.length ? messages_ : messages;

      // Incrémentation de l'index du modèle, s'il vaut 0, on passe à chatgpt-4o 
      const currentModel = modelList[modelIndex+1];
        
      try {
        // Sélection du modèle actuel en fonction de l'index
        const maximum = OpenAIChatModels[currentModel].maxLimit;
        
        let requestBody = {
          max_completion_tokens: maximum,
          model: currentModel,
          messages: messagesToSend.map(({ role, content }) => ({ role, content })),
        };
        updateInputTokens(JSON.stringify(requestBody.messages));

        const response = await fetch("/api/completion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ApiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to fetch response, check your API key and try again.");
        }
  
        const { reply, tokenUsage } = await response.json(); // Lecture du contenu JSON
        updateTokenCount(tokenUsage);

        const message: OpenAIChatMessage = {
          id: messagesToSend.length,
          role: 'assistant',
          content: reply, // Utilisez 'reply' au lieu de 'answer.reply'
          model: currentModel,
        };

        setMessages((prev) => [...prev, message]);
        
      } catch (error: any) {
        setMessages((prev) => [
          ...prev,
          { id: prev.length, role: 'assistant', content: error.message, model: currentModel },
        ]);
      }

      setLoading(false); // Déverrouille le bouton submit
    },
    [messages, loading]
  );

  const addMessage = useCallback(
    (
      content: string = "",
      newPrompt: boolean = true,
      role: "user" | "assistant" = "user"
    ) => {
      setMessages((prev) => {
        const messages = [
          ...prev,
          {
            id: prev.length,
            role,
            content: content || "",
          } as OpenAIChatMessage,
        ];
        submit(messages);
        return messages;
      });
    },
    [submit]
  );

  const updateMessageContent = (id: number, content: string) => {
    setMessages((prev) => {
      const index = prev.findIndex((message) => message.id === id);
      if (index === -1) return prev;
      const message = prev[index];
      const texte = content;
      return [
        ...prev.slice(0, index),
        {
          ...message,
          texte,
        },
        ...prev.slice(index + 1),
      ];
    });
  };

  const removeMessage = (id: number) => {
    setMessages((prev) => {
      return [...prev.filter((message) => message.id !== id)];
    });
  };

  const regenerateMessage = () => {

    if (messages.length === 0) return;
    // On récupère le dernier message
    const lastMessage = messages[messages.length - 1];
    
    // On récupère le numéro du modèle du dernier message avant de le supprimer
    let modelIndex : number = 0 ; // chatgpt-4o-latest
    if (lastMessage.model) { // Compatibilité avec les anciennes versions
      const modelList = Object.keys(OpenAIChatModels);
      modelIndex = modelList.indexOf(lastMessage.model as string);
    }
    removeMessage(lastMessage.id as number);
    
    // Forcer une régénération
    submit([], modelIndex);
  
  };

  // Roles
  const toggleMessageRole = (id: number) => {
    setMessages((prev) => {
      const index = prev.findIndex((message) => message.id === id);
      if (index === -1) return prev;
      const message = prev[index];
      return [
        ...prev.slice(0, index),
        {
          ...message,
          role: message.role === "user" ? "assistant" : "user",
        },
        ...prev.slice(index + 1),
      ];
    });
  };

  // Conversation 
  const [conversationId, setConversationId] = React.useState<string>("");
  const [conversationName, setConversationName] = React.useState("");
  const updateConversationName = (id: string, name: string) => {
    setConversations((prev) => {
      const conversation = prev[id];
      if (!conversation) return prev;
      return {
        ...prev,
        [id]: {
          ...conversation,
          name,
        },
      };
    });
    if (id === conversationId) setConversationName(name);
    updateConversation(id, { name });
  };

  const handleStoreConversation = useCallback(() => {
    if (messages.length === 0) return;

    const conversation = {
      name: conversationName,
      createdAt: Date.now(),
      lastMessage: Date.now(),
      messages,
    } as Conversation;

    let id = storeConversation(conversationId, conversation);
    setConversationId(id);
    setConversations((prev) => ({ ...prev, [id]: conversation }));

    if (router.pathname === CHAT_ROUTE) router.push(`/chat/${id}`);
  }, [conversationId, messages]);

  useEffect(() => {
    handleStoreConversation();
  }, [messages]);

  const generateTitle = useCallback(async () => {
    if (messages.length === 0) {
      setConversationName("...");
      return;
    }
    let name = messages[0].content;
    if (typeof name !== 'string') {
      name = name.reply;
    }

    const titlePrompt = `Summarize the following text in exactly three words, maintaining the language of the statement (usually french):
      <TEXT>
      ${name}
      </TEXT>`;
    const payload: OpenAIRequest = {
      messages: [{ role: "user", content: titlePrompt, model: "gpt-4-mini" }],
      model: "gpt-4o-mini" , max_completion_tokens: 100,
    };
    updateInputTokens(titlePrompt);
    try {
      const response = await fetch('/api/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { reply, tokenUsage } = await response.json(); // Lecture du contenu JSON  
      setConversationName(reply);
      updateConversationName(conversationId, reply);
      updateTokenCount(tokenUsage);

    } catch (error) {
      console.error("Error generating title:", error);
    }
  
  }, [conversationId, messages, setConversationName, updateConversationName]);

  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'user') {
      generateTitle();
    }
  }, [messages]);

  const loadConversation = (id: string, conversation: Conversation) => {
    setConversationId(id);
    const { messages, name } = conversation;
    setMessages(messages);
    setConversationName(name);
  };

  const importConversation = useCallback((jsonData: any) => {
    try {
      // 1. Validation stricte de la structure
      if (!isValidConversationStructure(jsonData)) {
        throw new Error("Invalid conversation structure");
      }

      // 2. Limiter la taille du JSON
      const jsonString = JSON.stringify(jsonData);
      if (jsonString.length > 1000000) { // Par exemple, limite à 1 Mo
        throw new Error("Imported conversation is too large");
      }

      // 3. Sanitisation des données
      const sanitizedConversation: Conversation = {
        name: sanitizeString(jsonData.name, 100), // Limiter à 100 caractères
        createdAt: Number(jsonData.createdAt) || Date.now(),
        lastMessage: Number(jsonData.lastMessage) || Date.now(),
        messages: jsonData.messages.map((msg: any, index: number) => ({
          id: index,
          role: msg.role === "assistant" || msg.role === "user" ? msg.role : "user",
          content: sanitizeString(typeof msg.content === 'string' ? msg.content : msg.content.reply, 10000), // Limiter à 10000 caractères
          model: isValidModel(msg.model) ? msg.model : undefined
        }))
      };

      const newId = uuidv4();

      // Mettre à jour l'état local
      setConversations((prev: History) => ({
        ...prev,
        [newId]: sanitizedConversation
      }));

      // Stocker la nouvelle conversation
      storeConversation(newId, sanitizedConversation);

      // Charger la conversation importée
      loadConversation(newId, sanitizedConversation);

      // Rediriger vers la nouvelle conversation
      router.push(`/chat/${newId}`);

      console.log("Conversation imported successfully");
    } catch (error) {
      console.error("Error importing conversation:", error);
      // Notification à l'utilisateur
    }
  }, [router, loadConversation]);

  // Fonctions auxiliaires

  function isValidConversationStructure(data: any): boolean {
    return (
      typeof data === 'object' &&
      typeof data.name === 'string' &&
      Array.isArray(data.messages) &&
      data.messages.every((msg: any) =>
        typeof msg === 'object' &&
        (msg.role === 'assistant' || msg.role === 'user') &&
        (typeof msg.content === 'string' || (typeof msg.content === 'object' && typeof msg.content.reply === 'string'))
      )
    );
  }

  function sanitizeString(str: string, maxLength: number): string {
    // Échapper les caractères HTML et limiter la longueur
    return str
      .replace(/[&<>"']/g, (char) => {
        const entities: { [key: string]: string } = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return entities[char];
      })
      .slice(0, maxLength);
  }

  function isValidModel(model: any): model is keyof typeof OpenAIChatModels {
    return typeof model === 'string' && model in OpenAIChatModels;
  }
      
  const resetConversation = useCallback(() => {
    const newId = Date.now().toString();

    setConversationId(newId);
    setConversationName("...");
    setMessages([]);

    // Créer une nouvelle conversation
    const newConversation: Conversation = {
      name: "...",
      createdAt: Date.now(),
      lastMessage: Date.now(),
      messages: [],
    };

    // Mettre à jour l'historique des conversations
    setConversations(prev => ({
      ...prev,
      [newId]: newConversation
    }));

    // Stocker la nouvelle conversation
    storeConversation(newId, newConversation);

    // Rediriger vers la nouvelle conversation
    router.push(`/chat/${newId}`);
  }, [router]);

  const deleteConversation = (id: string) => {
    deleteConversationFromHistory(id);
    setConversations((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });

    if (id === conversationId) clearConversation();
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId("");
  };


  // Conversations
  const [conversations, setConversations] = React.useState<History>({} as History);

  // Load conversation from local storage
  useEffect(() => {
    setConversations(getHistory());
  }, []);

  const clearConversations = useCallback(() => {
    clearHistory();

    setMessages([]);
    setConversationId("");
    setConversations({});

    router.push("/");
  }, []);

  const [error] = React.useState("");

  const value = React.useMemo(
    () => ({
      loading,
      
      messages,
      submit,
      addMessage,
      updateMessageContent,
      removeMessage,
      regenerateMessage,
      
      toggleMessageRole,

      conversationId,
      conversationName,
      updateConversationName,
      generateTitle,
      loadConversation,
      importConversation,
      deleteConversation,
      resetConversation,
      clearConversation,
      clearConversations,
      conversations,
      
      error,
    }),
    [
      loading,

      messages,
      submit,
      addMessage,

      conversationId,
      importConversation,
      resetConversation,
      clearConversations,
      conversations,

      error,
    ]
  );

  return (
    <OpenAIContext.Provider value={value}>{children}</OpenAIContext.Provider>
  );
}

export const useOpenAI = () => React.useContext(OpenAIContext);