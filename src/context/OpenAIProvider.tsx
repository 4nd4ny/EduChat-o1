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

  const submit = useCallback(
    async (messages_: OpenAIChatMessage[] = [], modelIndex: number = 0) => {
      
      if (loading) return; // Si déjà en cours, on ne fait rien
      setLoading(true); // Verrouille le bouton submit

      const messagesToSend = messages_.length ? messages_ : messages;

      // Incrémentation de l'index du modèle, s'il vaut 0, on passe à chatgpt-4o 
      const currentModel = modelList[modelIndex+1];
        
      try {
        const decoder = new TextDecoder();

        // Sélection du modèle actuel en fonction de l'index
        const maximum = OpenAIChatModels[currentModel].maxLimit;
        
        let requestBody;

        requestBody = {
            max_completion_tokens: maximum,
            model: currentModel,
            messages: messagesToSend.map(({ role, content }) => ({
              role,
              content,
            })),
        };

        const response = await fetch("/api/completion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ApiKey}`,
          },
          body: JSON.stringify(requestBody),
        });
        
        const { body, ok } = response;
        if (!body) return;

        const reader = body.getReader();

        if (!ok) {
          // Get the error message from the response body
          const { value } = await reader.read();
          const chunkValue = decoder.decode(value);
          const { error } = JSON.parse(chunkValue);

          throw new Error(
            error?.message || "Failed to fetch response, check your API key and try again."
          );
        }

        let done = false;

        const message: OpenAIChatMessage = {
          id: messagesToSend.length,
          role: 'assistant',
          content: '',
          model: currentModel, // Ajout du modèle utilisé
        };

        setMessages((prev) => {
          message.id = prev.length;
          return [...prev, message];
        });

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunkValue = decoder.decode(value);
          message.content += chunkValue;

          updateMessageContent(message.id as number, message.content);
        }
        
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
      messages,
      lastMessage: Date.now(),
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
    
    setConversationName("...");
    let name = messages[0].content;
    const titlePrompt = `Summarize the following text in exactly three words, maintaining the language of the statement (usually french):
      <TEXT>
      ${name}
      </TEXT>`;
    const payload: OpenAIRequest = {
      messages: [{ role: "user", content: titlePrompt, model: "gpt-4-mini" }],
      model: "gpt-4o-mini" , max_completion_tokens: 100,
    };
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

      const name = await response.text();
      setConversationName(name);

    } catch (error) {
      console.error("Error generating title:", error);
      name = "New Conversation"; // Fallback title in case of error
    }
  
  }, [conversationId, messages]);

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

  const resetConversation = useCallback(() => {
    const newId = Date.now().toString();

    setConversationId(newId);
    setConversationName("...");
    setMessages([]);

    // Créer une nouvelle conversation
    const newConversation: Conversation = {
      name: "...",
      messages: [],
      lastMessage: Date.now(),
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
