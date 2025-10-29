'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getChatSocket, setAuthErrorCallback, resetChatSocket, type ChatMessage } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { usersAPI, chatAPI } from "@/lib/api";

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
  unreadCounts: { [chatName: string]: number };
  markChatAsRead: (chatName: string) => void;
  getTotalUnreadCount: () => number;
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
  const [unreadCounts, setUnreadCounts] = useState<{ [chatName: string]: number }>({});
  const { toast } = useToast();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedChitChats = localStorage.getItem('chitChatChats');
    const savedTeamChats = localStorage.getItem('teamChats');
    const savedMessages = localStorage.getItem('chatMessages');
    const savedUnreadCounts = localStorage.getItem('unreadCounts');

    if (savedChitChats) {
      setChitChatChats(JSON.parse(savedChitChats));
    }
    if (savedTeamChats) {
      setTeamChats(JSON.parse(savedTeamChats));
    }
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    if (savedUnreadCounts) {
      setUnreadCounts(JSON.parse(savedUnreadCounts));
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
    localStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  const addChitChat = useCallback((chat: Chat) => {
    setChitChatChats(prev => {
      // Check if chat already exists
      if (prev.some(c => c.name === chat.name)) {
        return prev;
      }
      return [...prev, chat];
    });
  }, []);

  const addMessage = useCallback((chatName: string, message: Message) => {
    setMessages(prev => ({
      ...prev,
      [chatName]: [...(prev[chatName] || []), message],
    }));
  }, []);

  useEffect(() => {
    if (!currentUserEmail) return;

    const fetchConversations = async () => {
      try {
        const response = await chatAPI.getConversations();
        if (response.success) {
          const conversations = response.conversations.map((conv: any) => ({
            name: conv.partner,
            role: 'User',
            time: new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'offline', // You might want to manage online status separately
            avatar: `https://i.pravatar.cc/150?u=${conv.partner}`,
          }));
          setChitChatChats(conversations);

          // Also, populate the messages with the last message
          const newMessages: { [chatName: string]: Message[] } = {};
          response.conversations.forEach((conv: any) => {
            newMessages[conv.partner] = [{
              id: conv.lastMessage._id,
              sender: conv.lastMessage.sender,
              content: conv.lastMessage.text,
              time: new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              avatar: `https://i.pravatar.cc/150?u=${conv.lastMessage.sender}`,
              isOwn: conv.lastMessage.sender === currentUserEmail,
            }];
          });
          setMessages(newMessages);
        }
      } catch (error) {
        console.error("Failed to fetch conversations", error);
        toast({
          title: "Error",
          description: "Failed to load your conversations.",
          variant: "destructive",
        });
      }
    };

    fetchConversations();

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

    // Helper function to ensure chat exists in the list
    const ensureChatExists = (chatName: string, data: ChatMessage) => {
      console.log(`ensureChatExists called - chatName: ${chatName}, sender: ${data.sender}, currentUser: ${currentUserEmail}, mode: ${data.mode}`);
      
      // Only create chat for incoming messages (not from current user)
      if (data.mode === 'private' && data.sender !== currentUserEmail) {
        setChitChatChats(prev => {
          const chatExists = prev.some(chat => chat.name === chatName);
          console.log(`Chat exists check: ${chatExists} for ${chatName}`);
          if (!chatExists) {
            console.log(`✅ Creating new chat card for: ${chatName}`);
            return [...prev, {
              name: chatName,
              role: 'New Chat',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'online',
              avatar: `https://i.pravatar.cc/150?u=${chatName}`,
            }];
          }
          return prev;
        });
      } else {
        console.log(`❌ Not creating chat - mode: ${data.mode}, isFromCurrentUser: ${data.sender === currentUserEmail}`);
      }
    };

    const handleIncomingMessage = (data: ChatMessage) => {
        const chatName = data.groupName || (data.sender === currentUserEmail ? data.receiver : data.sender);
        if (chatName) {
            const message = createMessage(data, data.sender === currentUserEmail);
            
            // Ensure chat exists before adding message
            ensureChatExists(chatName, data);
            
            // Add message to state
            setMessages(prev => ({
              ...prev,
              [chatName]: [...(prev[chatName] || []), message],
            }));

            // Increment unread count if message is not from current user
            if (data.sender !== currentUserEmail) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [chatName]: (prev[chatName] || 0) + 1,
                }));
            }
        }
    };

    socket.on('message', handleIncomingMessage);
    socket.on('groupMessage', handleIncomingMessage);
    socket.on('mediaMessage', (data: ChatMessage) => {
        const chatName = data.groupName || (data.sender === currentUserEmail ? data.receiver : data.sender);
        if (chatName) {
            const message = createMessage({ ...data, isMedia: true }, data.sender === currentUserEmail);
            
            // Ensure chat exists before adding message (important for new users sending media)
            ensureChatExists(chatName, data);
            
            // Add message to state
            setMessages(prev => ({
              ...prev,
              [chatName]: [...(prev[chatName] || []), message],
            }));
            
            // Increment unread count if message is not from current user
            if (data.sender !== currentUserEmail) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [chatName]: (prev[chatName] || 0) + 1,
                }));
            }
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

  const addTeamChat = (chat: Chat) => {
    setTeamChats(prev => {
      // Check if chat already exists
      if (prev.some(c => c.name === chat.name)) {
        return prev;
      }
      return [...prev, chat];
    });
  };

  const setMessagesForChat = (chatName: string, msgs: Message[]) => {
    setMessages(prev => ({
      ...prev,
      [chatName]: msgs,
    }));
  };

  const markChatAsRead = (chatName: string) => {
    setUnreadCounts(prev => ({
      ...prev,
      [chatName]: 0,
    }));
  };

  const getTotalUnreadCount = (): number => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
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
        unreadCounts,
        markChatAsRead,
        getTotalUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
