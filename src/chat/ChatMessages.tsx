import { useOpenAI } from "../context/OpenAIProvider";
import React, { useState, useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import ChatPlaceholder from "./ChatPlaceholder";

type Props = {};

export default function ChatMessages({}: Props) {
  const { messages, submit } = useOpenAI(); // clearMessages n'est pas nécessaire ici
  const messageContainer = React.useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = React.useState(false);
  const [prevMessageLength, setPrevMessageLength] = React.useState(0);
  const [visibleMessages, setVisibleMessages] = useState<typeof messages>([]); // Affichage progressif des messages
  const messageEndRef = useRef<HTMLDivElement>(null); // Référence à l'élément DOM
  
  let lastScrollTop = 0; // 

  // Détecte le scroll manuel et interrompt ou réactive l'auto-scroll
  const handleUserScroll = () => {
    if (messageContainer.current) {
      const currentScrollTop = messageContainer.current.scrollTop;
      const maxScrollTop = messageContainer.current.scrollHeight - messageContainer.current.offsetHeight;

      // Si l'utilisateur scrolle vers le haut, désactiver le scroll automatique
      if (currentScrollTop < lastScrollTop) {
        setScrolling(true);
      }

      // Si l'utilisateur scrolle jusqu'au bas, réactiver le scroll automatique
      if (currentScrollTop >= maxScrollTop) {
        setScrolling(false);
      }

      lastScrollTop = currentScrollTop;
    }
  };


  // Synchroniser visibleMessages avec messages
  useEffect(() => {
    setVisibleMessages(messages); // Met à jour les messages visibles à chaque changement dans l'état global messages
    setPrevMessageLength(messages.length); // Met à jour la longueur des messages précédents
  }, [messages]);

  // Scroll automatique vers le bas
  useEffect(() => {
    if (!scrolling) {
      const scrollInterval = setInterval(() => {
        if (messageContainer.current) {
          const currentScrollTop = messageContainer.current.scrollTop;
          const maxScrollTop = messageContainer.current.scrollHeight - messageContainer.current.offsetHeight;
          if (currentScrollTop < maxScrollTop) {
            messageContainer.current.scrollTop += 4; // Incrémenter pour un scroll plus fluide
          } else {
            clearInterval(scrollInterval);
          }
        }
      }, 40);

      return () => clearInterval(scrollInterval);
    }
  }, [messages, scrolling]);

  // Écoute l'événement de scroll de l'utilisateur
  useEffect(() => {
    if (messageContainer.current) {
      messageContainer.current.addEventListener('scroll', handleUserScroll);
    }

    return () => {
      if (messageContainer.current) {
        messageContainer.current.removeEventListener('scroll', handleUserScroll);
      }
    };
  }, []);

  // Command Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.metaKey) {
        submit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [submit]);

  return (
    <div className="flex h-full w-full flex-col items-stretch md:pl-[320px]">
      <div
        className="relative flex-1 flex-col items-stretch overflow-auto border-b bg-tertiary pb-[10rem] scrollbar scrollbar-w-3 scrollbar-thumb-[rgb(var(--bg-primary))] scrollbar-track-[rgb(var(--bg-secondary))] scrollbar-thumb-rounded-full"
        ref={messageContainer}
      >
        {visibleMessages.length === 0 ? (
          <ChatPlaceholder />
        ) : (
          <>
            {visibleMessages.map((message, index) => {
                return (
                  <ChatMessage
                    message={message}
                    isInitialUserMessage={visibleMessages.length === 0}
                    isLastAssistantMessage={
                      message.role === 'assistant' &&
                      index === messages.length - 1
                    }  
                  />
                )})}
            <hr className="border-b border-stone-400/20" />
          </>
        )}
        <div ref={messageEndRef} />
      </div>
      <ChatInput />
    </div>
  );
}
