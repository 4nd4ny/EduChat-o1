import Link from "next/link";
import React, { useCallback }  from "react";
import { MdAdd, MdDeleteOutline, MdUploadFile } from "react-icons/md";
import { useOpenAI } from "@/context/OpenAIProvider";
import Conversations from "./Conversations";
import ButtonContainer from "./ButtonContainer";
import { useDropzone } from 'react-dropzone';
type Props = {};

export default function ChatSidebar({}: Props) {
  const { resetConversation, clearConversations, importConversation } = useOpenAI();

  const handleNewChat = (e: React.MouseEvent) => {
    e.preventDefault();
    resetConversation();
  }; 

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onabort = () => console.log('file reading was aborted');
      reader.onerror = () => console.log('file reading has failed');
      reader.onload = () => {
        const fileContent = reader.result as string;
        try {
          const jsonData = JSON.parse(fileContent);
          importConversation(jsonData);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          // Vous pourriez ajouter ici une notification pour l'utilisateur
        }
      };
      reader.readAsText(file);
    });
  }, [importConversation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/json': ['.json']
    }
  });

  return (
    <div className="flex flex-col bg-gray-900 left-0 top-0 h-full max-h-screen text-primary md:fixed md:w-[320px]">
      <div className="flex h-full flex-col items-stretch p-2">

        <div className="flex flex-col gap-y-2 border-y border-white/10 py-2">  
          <Link
            href="#"
            onClick={handleNewChat}
            className="flex items-center gap-3 rounded p-3 transition-colors hover:bg-gray-100/10"
          >
            <MdAdd />
            Nouvelle discussion
          </Link>
          <div {...getRootProps()} className={`flex items-center gap-3 rounded p-3 transition-colors hover:bg-gray-100/10 cursor-pointer ${isDragActive ? 'bg-gray-100/20' : ''}`}>
            <input {...getInputProps()} />
            <MdUploadFile />
            {isDragActive ? "Déposez le fichier" : "Importer une discussion"}
          </div>
        </div>

        <Conversations />

        <div className="flex flex-col gap-y-2 border-y border-white/10 py-2">
          <ButtonContainer onClick={clearConversations}>
            <MdDeleteOutline />
            Tout effacer
          </ButtonContainer>
        </div>
      </div>
    </div>
  );
}
