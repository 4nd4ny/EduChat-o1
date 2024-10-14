import { OpenAIChatMessage } from "@/utils/OpenAI";
import React, { useEffect, useState } from "react";
import { MdPerson, MdSmartToy, MdContentCopy, MdAutorenew } from "react-icons/md";
import AssistantMessageContent from "./AssistantMessageContent";
import UserMessageContent from "./UserMessageContent";
import { useOpenAI } from "../context/OpenAIProvider";

type Props = {
  message: OpenAIChatMessage;
  isInitialUserMessage: boolean;
  isLastAssistantMessage: boolean;
};

export default function ChatMessage({ message: { role, content, model }, isInitialUserMessage, isLastAssistantMessage }: Props) {
  const [hover, setHover] = React.useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false); // État pour afficher le message
  const [showRegenerateMessage, setShowRegenerateMessage] = useState(false); // État pour afficher le message
  const { generateTitle, regenerateMessage } = useOpenAI();
  
  // Fonction pour tronquer le nom du modèle
  const getTruncatedModelName = (modelName: string) => {
    return modelName.split('-').slice(0, 2).join('-');
  };

  // Génération du titre
  useEffect(() => {
    if (isInitialUserMessage && role === 'user') {
      generateTitle();
    }
  }, [isInitialUserMessage, role, generateTitle]);

  // Fonction pour copier le contenu dans le presse-papiers
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setShowCopiedMessage(true); // Afficher le message temporaire

    // Masquer le message après 2 secondes
    setTimeout(() => {
      setShowCopiedMessage(false);
    }, 2000);
  };

  // Fonction pour régénérer la réponse
  const handleRegenerate = () => {
    setShowRegenerateMessage(true); // Afficher le message temporaire
    // Masquer le message après 2 secondes
    setTimeout(() => {
      setShowRegenerateMessage(false);
      regenerateMessage();
    }, 1000);
  };

  return (
    <div
      className={`flex cursor-pointer flex-row items-center p-4 transition-all ${
        role === "user" ? "bg-tertiary hover:bg-secondary/50" : "bg-secondary"
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative max-w-screen mx-auto flex w-full max-w-6xl flex-row items-center">
        <div
          className={`flex sticky top-0 my-4 h-10 w-10 items-center justify-center text-4xl mr-2 self-start transition-colors ${
            hover ? "text-stone-300" : "text-primary/20"
          }`}
        >
          {role === "user" ? <MdPerson /> : <MdSmartToy />}
        </div>
        <div className="overflow-x-auto">
          {/* Affichage du nom du modèle pour les réponses de l'assistant */}
          {role === 'assistant' && model && (
            <div className="text-sm font-bold text-gray-500">
              Modèle : {getTruncatedModelName(model)}
            </div>
          )}
          <div className="text-md prose w-full max-w-6xl rounded p-4 text-primary dark:prose-invert prose-code:text-primary prose-pre:bg-transparent prose-pre:p-0">
            {role === "user" ? (
              <UserMessageContent content={content} />
            ) : (
              <AssistantMessageContent content={content} />
            )}
          </div>
          {/* Icône pour copier le contenu avec message temporaire */}
          {role === "assistant" && (
            <div className="ml-1 mr-3">
              <div className="relative mx-auto flex flex-row items-center mt-5 space-x-12">
                {/* Message éphémère au-dessous du bouton */}
                {(showCopiedMessage && (
                  <div className="absolute bottom-full mb-2 text-xs text-white">
                    Réponse copiée !
                  </div>
                )) || (showRegenerateMessage && (
                  <div className="absolute bottom-full mb-2 text-xs text-white">
                    Réponse régénérée !
                  </div>
                ))}
              </div>
              <div className="relative mx-auto flex flex-row items-center mb-2 space-x-12">
                <div
                  className={`cursor-pointer text-gray-500 transition-colors transition-transform transform hover:scale-110 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center w-12 h-12`}
                  onClick={handleCopy}
                >
                  <MdContentCopy className="text-2xl" />
                </div>
                {/* Bouton pour régénérer, uniquement visible pour le dernier message de l'assistant */}
                {isLastAssistantMessage && (
                  <div
                    className={`cursor-pointer text-gray-500 transition-colors transition-transform transform hover:scale-110 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center w-12 h-12`}
                    onClick={handleRegenerate}
                  >
                    <MdAutorenew className="text-2xl" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
