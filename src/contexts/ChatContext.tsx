'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getChatSocket, setAuthErrorCallback, resetChatSocket, type ChatMessage } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { usersAPI } from "@/lib/api";

export interface Chat {
  name: string;
  role: string;
  time: string;
  status: string;
  avatar: string;
  type?: string;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  avatar: string;
  isOwn: boolean;
  mediaUrl?: string;
  filename?: string;
  mimetype?: string;
  isMedia?: boolean;
}

interface ChatContextType {
  chitChatChats: Chat[];
  teamChats: Chat[];
  messages: { [chatName: string]: Message[] };
  addChitChat: (chat: Chat) => void;
  addTeamChat: (chat: Chat) => void;
  addMessage: (chatName: string, message: Message) => void;
  setMessagesForChat: (chatName: string, messages: Message[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chitChatChats, setChitChatChats] = useState<Chat[]>([]);
  const [teamChats, setTeamChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<{ [chatName: string]: Message[] }>({});
  const { toast } = useToast();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedChitChats = localStorage.getItem('chitChatChats');
    const savedTeamChats = localStorage.getItem('teamChats');
    const savedMessages = localStorage.getItem('chatMessages');

    if (savedChitChats) {
      setChitChatChats(JSON.parse(savedChitChats));
    }
    if (savedTeamChats) {
      setTeamChats(JSON.parse(savedTeamChats));
    }
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    usersAPI.getMe().then((user: any) => {
      setCurrentUserEmail(user.email);
    }).catch(err => {
      console.error("Failed to get current user", err);
    })
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('chitChatChats', JSON.stringify(chitChatChats));
  }, [chitChatChats]);

  useEffect(() => {
    localStorage.setItem('teamChats', JSON.stringify(teamChats));
  }, [teamChats]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!currentUserEmail) return;

    resetChatSocket();

    setAuthErrorCallback((error) => {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message + " Please login again.",
        variant: "destructive",
        duration: 5000,
      });

      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    });

    const socket = getChatSocket();

    const createMessage = (data: ChatMessage, isOwn: boolean = false): Message => ({
        id: `${Date.now()}-${Math.random()}`,
        sender: data.sender,
        content: data.text || data.filename || 'Media file',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: `https://i.pravatar.cc/150?u=${data.sender}`,
        isOwn,
        mediaUrl: data.mediaUrl,
        filename: data.filename,
        mimetype: data.mimetype,
        isMedia: data.isMedia || !!data.mediaUrl,
    });

    const handleIncomingMessage = (data: ChatMessage) => {
        const chatName = data.groupName || (data.sender === currentUserEmail ? data.receiver : data.sender);
        if (chatName) {
            addMessage(chatName, createMessage(data, data.sender === currentUserEmail));
        }
    };

    socket.on('message', handleIncomingMessage);
    socket.on('groupMessage', handleIncomingMessage);
    socket.on('mediaMessage', (data: ChatMessage) => {
        const chatName = data.groupName || (data.sender === currentUserEmail ? data.receiver : data.sender);
        if (chatName) {
            addMessage(chatName, createMessage({ ...data, isMedia: true }, data.sender === currentUserEmail));
        }
    });

    socket.on('error', (error: string | { message: string; code: string; requiresLogin?: boolean }) => {
      if (typeof error === 'string') {
        toast({ title: "Chat Error", description: error, variant: "destructive" });
      } else if (error.requiresLogin) {
        toast({
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Chat Error", description: error.message, variant: "destructive" });
      }
    });

    return () => {
      socket.off('message');
      socket.off('groupMessage');
      socket.off('mediaMessage');
      socket.off('error');
    };
  }, [currentUserEmail, toast]);

  const addChitChat = (chat: Chat) => {
    setChitChatChats(prev => {
      // Check if chat already exists
      if (prev.some(c => c.name === chat.name)) {
        return prev;
      }
      return [...prev, chat];
    });
  };

  const addTeamChat = (chat: Chat) => {
    setTeamChats(prev => {
      // Check if chat already exists
      if (prev.some(c => c.name === chat.name)) {
        return prev;
      }
      return [...prev, chat];
    });
  };

  const addMessage = (chatName: string, message: Message) => {
    setMessages(prev => ({
      ...prev,
      [chatName]: [...(prev[chatName] || []), message],
    }));
  };

  const setMessagesForChat = (chatName: string, msgs: Message[]) => {
    setMessages(prev => ({
      ...prev,
      [chatName]: msgs,
    }));
  };

  return (
    <ChatContext.Provider
      value={{
        chitChatChats,
        teamChats,
        messages,
        addChitChat,
        addTeamChat,
        addMessage,
        setMessagesForChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
