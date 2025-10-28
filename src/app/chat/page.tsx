'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Phone,
  Search,
  Plus,
  Loader2,
} from "lucide-react";
import { getChatSocket, setAuthErrorCallback, resetChatSocket, sendPrivateMessage, sendGroupMessage, sendMediaFile, initiateCall, answerCall, sendCallICECandidate, rejectCall, endCall, type ChatMessage } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { CallModal } from "@/components/CallModal";
import { useChatContext, type Chat, type Message } from "@/contexts/ChatContext";
import { usersAPI, chatAPI } from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Constants
const CHAT_BACKGROUND = 'url("/img.png")';
const DEFAULT_GROUP = "Roboto UX Project";

// Components
const ChatListItem = ({ chat, onClick }: { chat: Chat; onClick: () => void }) => (
  <div
    className="flex items-start space-x-3 p-2 hover:bg-muted cursor-pointer"
    style={{
      borderRadius: '8px',
      border: '1px solid rgba(204, 204, 204, 0.80)',
      background: '#FFF',
    }}
    onClick={onClick}
  >
    <div className="relative flex-shrink-0">
      <Avatar className="w-10 h-10">
        <AvatarImage src={chat.avatar} />
        <AvatarFallback>{chat.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
      </Avatar>
      {chat.type && (
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-muted rounded-md flex items-center justify-center text-xs font-bold text-foreground border-2 border-background">
          {chat.type}
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground truncate">{chat.name}</p>
        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{chat.time}</span>
      </div>
      <p className="text-xs text-muted-foreground">{chat.role}</p>
      <p className="text-xs text-muted-foreground truncate">{chat.status}</p>
    </div>
  </div>
);

const MessageBubble = ({ message }: { message: Message }) => (
  <div className={`flex items-end gap-3 ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
    {!message.isOwn && (
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={message.avatar} />
        <AvatarFallback>{message.sender.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
      </Avatar>
    )}
    <div className={`max-w-[70%] p-3 rounded-xl shadow-sm ${message.isOwn ? 'bg-white' : 'bg-white'}`}>
      <span className={`text-sm font-semibold mb-1 block ${message.isOwn ? 'text-primary' : 'text-foreground'}`}>
        {message.sender}
      </span>
      {message.isMedia && message.mediaUrl ? (
        <div className="space-y-2">
          {message.mimetype?.startsWith('image/') ? (
            <img src={message.mediaUrl} alt={message.filename} className="rounded max-w-full" />
          ) : message.mimetype?.startsWith('video/') ? (
            <video src={message.mediaUrl} controls className="rounded max-w-full" />
          ) : message.mimetype?.startsWith('audio/') ? (
            <audio src={message.mediaUrl} controls className="w-full" />
          ) : (
            <a href={message.mediaUrl} download={message.filename} className="text-primary hover:underline">
              📎 {message.filename}
            </a>
          )}
          {message.content && <p className="text-sm text-muted-foreground">{message.content}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground whitespace-pre-line">{message.content}</p>
      )}
      <div className="flex justify-end items-center mt-1">
        <span className="text-xs text-muted-foreground/80">{message.time}</span>
        {message.isOwn && <span className="text-xs text-green-500 ml-2">✓✓</span>}
      </div>
    </div>
    {message.isOwn && (
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={message.avatar} />
        <AvatarFallback>{message.sender.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
      </Avatar>
    )}
  </div>
);

const ChatSidebar = ({
  chats,
  onSelectChat,
  showAddChatForm,
  setShowAddChatForm,
  showAddTeamForm,
  setShowAddTeamForm,
  newChatEmail,
  setNewChatEmail,
  newTeamName,
  setNewTeamName,
  handleAddDirectChat,
  handleAddTeamChat,
  userSearchResults,
  isSearchingUsers,
  handleUserSearch,
  handleSelectUserFromSearch,
}: {
  chats: { team: Chat[]; chitchat: Chat[] };
  onSelectChat: (chat: Chat) => void;
  showAddChatForm: boolean;
  setShowAddChatForm: (show: boolean) => void;
  showAddTeamForm: boolean;
  setShowAddTeamForm: (show: boolean) => void;
  newChatEmail: string;
  setNewChatEmail: (email: string) => void;
  newTeamName: string;
  setNewTeamName: (name: string) => void;
  handleAddDirectChat: () => void;
  handleAddTeamChat: () => void;
  userSearchResults: User[];
  isSearchingUsers: boolean;
  handleUserSearch: (query: string) => void;
  handleSelectUserFromSearch: (user: User) => void;
}) => {
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
  <div
    className="border-l bg-white hidden lg:flex lg:flex-shrink-0 h-full overflow-y-auto w-full lg:w-96 xl:w-[400px] flex-col gap-6 p-4 sm:p-6"
  >
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', alignSelf: 'stretch', flex: 1, minHeight: 0 }}>
      <h3 className="text-lg font-semibold text-foreground flex-shrink-0">Messages</h3>
      <Tabs defaultValue="chitchat" className="w-full flex flex-col flex-1" style={{ minHeight: 0 }}>
        <style jsx>{`
          :global(button[data-state="active"]) {
            background-color: #846BD2 !important;
            color: white !important;
          }
        `}</style>
        <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="chitchat">ChitChat</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', flexShrink: 0, alignSelf: 'stretch', flex: 1, minHeight: 0 }}>
          <div className="relative w-full flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Search inbox" className="pl-9" />
          </div>

          <div className="w-full flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-sm font-medium text-foreground">Teams</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-primary/10"
                onClick={() => setShowAddTeamForm(!showAddTeamForm)}
              >
                <Plus size={16} className={showAddTeamForm ? "text-primary" : "text-muted-foreground"} />
              </Button>
            </div>

            {showAddTeamForm && (
              <div className="mx-2 mb-3 p-3 bg-white border border-gray-300 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter team name..."
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTeamChat();
                      }
                    }}
                    className="flex-1 h-9 text-sm bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddTeamChat}
                    className="h-9 px-4 text-sm bg-primary text-white hover:bg-primary/90"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {chats.team.length > 0 ? (
                chats.team.map((chat, index) => (
                  <ChatListItem key={index} chat={chat} onClick={() => onSelectChat(chat)} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No team chats yet. Click + to add one.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chitchat" className="mt-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '20px', flexShrink: 0, alignSelf: 'stretch', flex: 1, minHeight: 0 }}>
          <div className="relative w-full flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Search inbox" className="pl-9" />
          </div>

          <div className="w-full flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-sm font-medium text-foreground">Chit Chat</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-primary/10"
                onClick={() => setShowAddChatForm(!showAddChatForm)}
              >
                <Plus size={16} className={showAddChatForm ? "text-primary" : "text-muted-foreground"} />
              </Button>
            </div>

            {showAddChatForm && (
              <div className="mx-2 mb-3 p-3 bg-white border border-gray-300 rounded-lg shadow-sm">
                <div className="mb-2">
                  <Input
                    placeholder="Search users by name or email..."
                    value={newChatEmail}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="flex-1 h-9 text-sm bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                {/* Search Results */}
                {isSearchingUsers ? (
                  <div className="text-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-500" />
                  </div>
                ) : userSearchResults.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {userSearchResults.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => handleSelectUserFromSearch(user)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm flex-1 min-w-0">
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : newChatEmail ? (
                  <div className="text-center py-3 text-xs text-gray-500">No users found</div>
                ) : (
                  <div className="text-center py-3 text-xs text-gray-500">
                    Start typing to search users
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              {chats.chitchat.length > 0 ? (
                chats.chitchat.map((chat, index) => (
                  <ChatListItem key={index} chat={chat} onClick={() => onSelectChat(chat)} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No chats yet. Click + to add one.</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
  );
};

// Main Component
export default function Chat() {
  const router = useRouter();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use ChatContext
  const { chitChatChats, teamChats, addChitChat, addTeamChat, messages: contextMessages, addMessage: addMessageToContext, setMessagesForChat, markChatAsRead } = useChatContext();

  const [currentView, setCurrentView] = useState("chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [showAddChatForm, setShowAddChatForm] = useState(false);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Call state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callState, setCallState] = useState<'incoming' | 'outgoing' | 'connected'>('outgoing');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [caller, setCaller] = useState<string>('');
  const [callee, setCallee] = useState<string>('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Helpers
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

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);

    // Save to context if we have a selected chat
    if (selectedChat) {
      addMessageToContext(selectedChat.name, msg);
    }

    scrollToBottom();
  };

  // Socket Effects
  useEffect(() => {
    // With cookie-based auth, no need to check for token manually
    // Cookies are sent automatically with WebSocket connection

    // Reset any existing socket connection to ensure fresh connection
    resetChatSocket();

    // Set up auth error callback before connecting
    setAuthErrorCallback((error) => {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message + " Please login again.",
        variant: "destructive",
        duration: 5000,
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        // Cookies are cleared on backend during logout
        window.location.href = '/';
      }, 2000);
    });

    // Fetch the actual user email
    import('@/lib/api').then(({ usersAPI }) => {
      usersAPI.getMe().then((user: any) => {
        setCurrentUser(user.email);

        const socket = getChatSocket();

        const handleIncomingMessage = (data: ChatMessage) => {
          addMessage(createMessage(data, data.sender === user.email));
        };

        socket.on('message', handleIncomingMessage);
        socket.on('groupMessage', handleIncomingMessage);
        socket.on('mediaMessage', (data: ChatMessage) => {
          addMessage(createMessage({ ...data, isMedia: true }, data.sender === user.email));
        });
        socket.on('error', (error: string | { message: string; code: string; requiresLogin?: boolean }) => {
          if (typeof error === 'string') {
            toast({ title: "Chat Error", description: error, variant: "destructive" });
          } else if (error.requiresLogin) {
            // Auth errors are handled by the authErrorCallback
            // This is just in case the callback wasn't set
            toast({
              title: "Authentication Failed",
              description: error.message,
              variant: "destructive",
            });
          } else {
            toast({ title: "Chat Error", description: error.message, variant: "destructive" });
          }
        });

        // Call event listeners
        socket.on('call:incoming', async (data: { caller: string; offer: any; callType: 'audio' | 'video' }) => {
          setCaller(data.caller);
          setCallee(user.email);
          setCallType(data.callType);
          setCallState('incoming');
          setIsCallModalOpen(true);

          // Create peer connection for incoming call
          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          });

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              sendCallICECandidate(user.email, data.caller, event.candidate);
            }
          };

          pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
          };

          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          setPeerConnection(pc);
        });

        socket.on('call:answered', async (data: { callee: string; answer: any }) => {
          if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            setCallState('connected');
          }
        });

        socket.on('call:iceCandidate', async (data: { sender: string; candidate: any }) => {
          if (peerConnection && data.candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        });

        socket.on('call:rejected', (data: { callee: string; reason: string }) => {
          toast({
            title: "Call Rejected",
            description: data.reason,
            variant: "destructive",
          });
          cleanupCall();
        });

        socket.on('call:ended', () => {
          toast({
            title: "Call Ended",
            description: "The call has been ended.",
          });
          cleanupCall();
        });

        socket.on('call:error', (data: { message: string }) => {
          toast({
            title: "Call Error",
            description: data.message,
            variant: "destructive",
          });
          cleanupCall();
        });

        // Cleanup listeners on unmount
        return () => {
          socket.off('message');
          socket.off('groupMessage');
          socket.off('mediaMessage');
          socket.off('error');
          socket.off('call:incoming');
          socket.off('call:answered');
          socket.off('call:iceCandidate');
          socket.off('call:rejected');
          socket.off('call:ended');
          socket.off('call:error');
        };
      });
    });
  }, [toast, peerConnection]);

  // Handlers
  const handleSendMessage = () => {
    if (!message.trim()) return;

    const sendFn = selectedChat ? sendPrivateMessage : sendGroupMessage;
    const recipient = selectedChat ? selectedChat.name : DEFAULT_GROUP;

    sendFn(currentUser, recipient, message);
    addMessage(createMessage({ sender: currentUser, text: message } as ChatMessage, true));
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const params: [string, string | undefined, string | undefined, string, string, string, 'private' | 'group'] = selectedChat
        ? [currentUser, selectedChat.name, undefined, file.name, file.type, base64Data, 'private']
        : [currentUser, undefined, DEFAULT_GROUP, file.name, file.type, base64Data, 'group'];

      sendMediaFile(...params);
      toast({ title: "File Sent", description: `${file.name} has been sent.` });
    };

    reader.onerror = () => {
      toast({ title: "Upload Error", description: "Failed to read file.", variant: "destructive" });
    };

    reader.readAsDataURL(file);
  };

  const handleVideoCall = () => {
    if (!selectedChat) return;
    const roomName = `room-${currentUser}-${selectedChat.name}`.replace(/[^a-zA-Z0-9-]/g, '');
    router.push(`/video/${roomName}`);
  };

  const handleAudioCall = async () => {
    if (!selectedChat) return;
    await startCall('audio');
  };

  const startCall = async (type: 'audio' | 'video') => {
    try {
      setCallType(type);
      setCallState('outgoing');
      setCaller(currentUser);
      setCallee(selectedChat!.name);
      setIsCallModalOpen(true);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false, // Only audio for modal calls
      });
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendCallICECandidate(currentUser, selectedChat!.name, event.candidate);
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      setPeerConnection(pc);

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      initiateCall(currentUser, selectedChat!.name, offer, type);
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Call Failed",
        description: "Could not start the call. Please check your permissions.",
        variant: "destructive",
      });
      cleanupCall();
    }
  };

  const handleAcceptCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      setLocalStream(stream);

      // Peer connection should already exist from incoming call setup
      if (peerConnection) {
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        answerCall(caller, currentUser, answer);
        setCallState('connected');
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: "Call Failed",
        description: "Could not accept the call.",
        variant: "destructive",
      });
      cleanupCall();
    }
  };

  const handleRejectCall = () => {
    rejectCall(caller, currentUser, 'User declined the call');
    cleanupCall();
  };

  const handleEndCall = () => {
    endCall(currentUser, callState === 'incoming' ? caller : callee);
    cleanupCall();
  };

  const handleToggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    setIsCallModalOpen(false);
    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    
    // Mark chat as read
    markChatAsRead(chat.name);
    
    // Load messages from context first (for immediate display)
    setMessages(contextMessages[chat.name] || []);
    
    // Then fetch message history from backend
    try {
      const isGroup = chat.type === 'group' || teamChats.some(t => t.name === chat.name);
      
      let response;
      if (isGroup) {
        response = await chatAPI.getGroupConversation(chat.name, 100);
      } else {
        response = await chatAPI.getPrivateConversation(chat.name, 100);
      }
      
      if (response.success && response.messages) {
        // Convert backend messages to frontend format
        const loadedMessages: Message[] = response.messages.map((msg: any) => ({
          id: msg._id || `${Date.now()}-${Math.random()}`,
          sender: msg.sender,
          content: msg.text || msg.filename || 'Media file',
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: `https://i.pravatar.cc/150?u=${msg.sender}`,
          isOwn: msg.sender === currentUser,
          mediaUrl: msg.mediaUrl,
          filename: msg.filename,
          mimetype: msg.mimetype,
          isMedia: msg.isMedia || !!msg.mediaUrl,
        }));
        
        // Update context with loaded messages
        setMessagesForChat(chat.name, loadedMessages);
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Failed to load message history:', error);
      // Don't show error toast, just continue with local messages
    }
  };

  // Search users
  const handleUserSearch = async (query: string) => {
    setNewChatEmail(query);
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const users = await usersAPI.search(query);
      setUserSearchResults(users);
    } catch (error) {
      console.error('Failed to search users:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Select user from search results
  const handleSelectUserFromSearch = (user: User) => {
    const newChat: Chat = {
      name: user.email,
      role: user.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Start a conversation...",
      avatar: user.avatar || `https://i.pravatar.cc/150?u=${user.email}`,
    };

    addChitChat(newChat);
    setSelectedChat(newChat);
    setMessages([]);
    setNewChatEmail("");
    setUserSearchResults([]);
    setShowAddChatForm(false);
    toast({
      title: "Chat Added",
      description: `You can now chat with ${user.name}`,
    });
  };

  const handleAddDirectChat = () => {
    if (!newChatEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    const newChat: Chat = {
      name: newChatEmail,
      role: "Direct Message",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Start a conversation...",
      avatar: `https://i.pravatar.cc/150?u=${newChatEmail}`,
    };

    addChitChat(newChat);
    setSelectedChat(newChat);
    setMessages([]);
    setNewChatEmail("");
    setShowAddChatForm(false);
    toast({
      title: "Chat Added",
      description: `You can now chat with ${newChatEmail}`,
    });
  };

  const handleAddTeamChat = () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Team Name Required",
        description: "Please enter a team name.",
        variant: "destructive",
      });
      return;
    }

    const newTeam: Chat = {
      name: newTeamName,
      role: "Team Chat",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Team chat created...",
      avatar: `https://i.pravatar.cc/150?u=${newTeamName}`,
      type: "TEAM",
    };

    addTeamChat(newTeam);
    setSelectedChat(newTeam);
    setMessages([]);
    setNewTeamName("");
    setShowAddTeamForm(false);
    toast({
      title: "Team Chat Created",
      description: `Team "${newTeamName}" has been created.`,
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#F9F9F9] overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex-1 flex border-l h-full">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white z-10 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              {selectedChat ? (
                <>
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarImage src={selectedChat.avatar} />
                    <AvatarFallback>{selectedChat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{selectedChat.name}</h3>
                    {selectedChat.role && <p className="text-xs text-muted-foreground truncate">{selectedChat.role}</p>}
                  </div>
                </>
              ) : (
                <>
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-muted-foreground text-sm sm:text-base truncate">Select a chat to start messaging</h3>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground rounded-lg bg-white shadow-sm h-8 w-8 sm:h-10 sm:w-10"
                disabled={!selectedChat}
                onClick={handleAudioCall}
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground rounded-lg bg-white shadow-sm h-8 w-8 sm:h-10 sm:w-10"
                onClick={handleVideoCall}
                disabled={!selectedChat}
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6"
            style={{
              backgroundImage: CHAT_BACKGROUND,
              backgroundRepeat: 'repeat',
              backgroundPosition: 'center',
            }}
          >
            {selectedChat ? (
              messages.length > 0 ? (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-4">
                      <AvatarImage src={selectedChat.avatar} />
                      <AvatarFallback>{selectedChat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{selectedChat.name}</h3>
                    <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Plus size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No chat selected</h3>
                  <p className="text-sm text-muted-foreground">Select a chat from the sidebar or create a new one</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t bg-white flex-shrink-0 flex justify-center">
            <div className="flex flex-col justify-center items-center gap-2 rounded-2xl border border-gray-300 bg-white p-3 sm:p-4 w-full max-w-2xl">
              <div className="flex items-center w-full gap-1 sm:gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" disabled={!selectedChat}>
                  {/* Custom Smile SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
                    <path d="M8 14.5C8 14.5 9.5 16.5 12 16.5C14.5 16.5 16 14.5 16 14.5M9 9.5H9.01M15 9.5H15.01M22 12.5C22 18.0228 17.5228 22.5 12 22.5C6.47715 22.5 2 18.0228 2 12.5C2 6.97715 6.47715 2.5 12 2.5C17.5228 2.5 22 6.97715 22 12.5Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedChat}
                >
                  {/* Custom Paperclip SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" style={{ width: '25px', height: '25px', aspectRatio: '1/1' }}>
                    <path d="M7.81266 17.1868H14.1147C13.896 17.6764 13.7293 18.1973 13.6356 18.7493H7.81266C4.646 18.7493 2.0835 16.1868 2.0835 13.0202C2.0835 9.85352 4.646 7.29102 7.81266 7.29102H18.7502C21.0522 7.29102 22.9168 9.1556 22.9168 11.4577C22.9168 12.4056 22.5939 13.2702 22.0522 13.9681C21.4897 13.7493 20.8856 13.6139 20.2606 13.5723C20.7108 13.2529 21.0476 12.7986 21.2223 12.275C21.397 11.7514 21.4004 11.1858 21.2322 10.6602C21.0639 10.1345 20.7326 9.67605 20.2864 9.35123C19.8402 9.0264 19.3021 8.85208 18.7502 8.85352H7.81266C5.51058 8.85352 3.646 10.7181 3.646 13.0202C3.646 15.3223 5.51058 17.1868 7.81266 17.1868ZM9.896 14.0618C9.32308 14.0618 8.85433 13.5931 8.85433 13.0202C8.85433 12.4473 9.32308 11.9785 9.896 11.9785H17.7085V10.416H9.896C9.20533 10.416 8.54295 10.6904 8.05457 11.1788C7.5662 11.6671 7.29183 12.3295 7.29183 13.0202C7.29183 13.7108 7.5662 14.3732 8.05457 14.8616C8.54295 15.35 9.20533 15.6243 9.896 15.6243H15.146C15.7442 14.9547 16.4796 14.4217 17.3022 14.0618H9.896ZM20.8335 18.7493V15.6243H18.7502V18.7493H15.6252V20.8327H18.7502V23.9577H20.8335V20.8327H23.9585V18.7493H20.8335Z" fill="black"/>
                  </svg>
                </Button>
                <Input
                  placeholder={selectedChat ? "Type Message.." : "Select a chat to start messaging"}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!selectedChat}
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                  onClick={handleSendMessage}
                  disabled={!selectedChat}
                >
                  {/* Custom Send SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" style={{ width: '25px', height: '25px', aspectRatio: '1/1' }}>
                    <g clipPath="url(#clip0_2570_9833)">
                      <path fillRule="evenodd" clipRule="evenodd" d="M18.7087 8.68281C18.8017 9.36861 19.3832 9.89167 20.0577 9.89167C20.7438 9.89167 21.3136 9.36861 21.4066 8.67119C21.5578 7.42747 22.5463 6.43946 23.7906 6.28836C24.4767 6.19537 25 5.62581 25 4.94002C25 4.25423 24.4767 3.68468 23.779 3.59169C23.173 3.5162 22.6096 3.24088 22.1778 2.80929C21.746 2.37771 21.4705 1.81452 21.395 1.20885C21.302 0.523061 20.7322 0 20.0461 0C19.3599 0 18.7901 0.523061 18.6971 1.22048C18.6196 1.82539 18.3436 2.38751 17.9121 2.81873C17.4807 3.24996 16.9183 3.5259 16.3131 3.60331C15.627 3.6963 15.1037 4.26585 15.1037 4.95165C15.1037 5.63744 15.627 6.20699 16.3248 6.29998C17.5691 6.45109 18.5575 7.43909 18.7087 8.68281ZM20.0577 7.11363C19.6155 6.15975 18.849 5.39364 17.8947 4.95165C18.8483 4.50995 19.6158 3.74279 20.0577 2.78966C20.4996 3.74279 21.2671 4.50995 22.2207 4.95165C21.2671 5.39334 20.4996 6.1605 20.0577 7.11363ZM11.9197 25C17.0365 25 19.6181 25 21.4904 23.3959C21.7578 23.1635 22.002 22.9194 22.2346 22.652C23.8394 20.7806 23.8394 18.2118 23.8394 13.0858C23.8394 12.6093 23.444 12.2141 22.9673 12.2141C22.4905 12.2141 22.0951 12.6093 22.0951 13.0858C22.0951 17.7818 22.0951 20.1413 20.9089 21.5245C20.7461 21.7221 20.5601 21.9081 20.3624 22.0709C18.9785 23.2565 16.6178 23.2565 11.9197 23.2565C7.2216 23.2565 4.86092 23.2565 3.47707 22.0709C3.27937 21.9081 3.09331 21.7221 2.93051 21.5245C1.74435 20.1413 1.74435 17.7818 1.74435 13.0858C1.74435 8.3899 1.74435 6.03031 2.93051 4.64711C3.09331 4.44951 3.27937 4.26353 3.47707 4.1008C4.86092 2.91519 7.2216 2.91519 11.9197 2.91519C12.3965 2.91519 12.7919 2.51999 12.7919 2.04343C12.7919 1.56686 12.3965 1.17166 11.9197 1.17166C6.80296 1.17166 4.22132 1.17166 2.34906 2.77571C2.08159 3.00818 1.83738 3.25228 1.6048 3.51962C1.38628e-07 5.39102 0 7.97145 0 13.0858C0 18.2002 1.38628e-07 20.7806 1.6048 22.652C1.83738 22.9194 2.08159 23.1751 2.34906 23.3959C4.22132 25 6.79133 25 11.9197 25ZM8.14146 14.8294C8.14146 15.3059 8.53684 15.7011 9.01363 15.7011C9.49042 15.7011 9.8858 15.3059 9.8858 14.8294V11.3423C9.8858 10.8657 9.49042 10.4705 9.01363 10.4705C8.53684 10.4705 8.14146 10.8657 8.14146 11.3423V14.8294ZM12.5023 19.1882C12.0255 19.1882 11.6302 18.793 11.6302 18.3164V7.85522C11.6302 7.37865 12.0255 6.98345 12.5023 6.98345C12.9791 6.98345 13.3745 7.37865 13.3745 7.85522V18.3164C13.3745 18.793 12.9791 19.1882 12.5023 19.1882ZM15.1188 15.9917C15.1188 16.4683 15.5142 16.8635 15.991 16.8635C16.4678 16.8635 16.8632 16.4683 16.8632 15.9917V10.1799C16.8632 9.70337 16.4678 9.30816 15.991 9.30816C15.5142 9.30816 15.1188 9.70337 15.1188 10.1799V15.9917ZM5.52377 14.5388C5.04698 14.5388 4.6516 14.1436 4.6516 13.667V12.5046C4.6516 12.0281 5.04698 11.6329 5.52377 11.6329C6.00056 11.6329 6.39594 12.0281 6.39594 12.5046V13.667C6.39594 14.1436 6.00056 14.5388 5.52377 14.5388Z" fill="black"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_2570_9833">
                        <rect width="25" height="25" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <ChatSidebar
          chats={{ team: teamChats, chitchat: chitChatChats }}
          onSelectChat={handleSelectChat}
          showAddChatForm={showAddChatForm}
          setShowAddChatForm={setShowAddChatForm}
          showAddTeamForm={showAddTeamForm}
          setShowAddTeamForm={setShowAddTeamForm}
          newChatEmail={newChatEmail}
          setNewChatEmail={setNewChatEmail}
          newTeamName={newTeamName}
          setNewTeamName={setNewTeamName}
          handleAddDirectChat={handleAddDirectChat}
          handleAddTeamChat={handleAddTeamChat}
          userSearchResults={userSearchResults}
          isSearchingUsers={isSearchingUsers}
          handleUserSearch={handleUserSearch}
          handleSelectUserFromSearch={handleSelectUserFromSearch}
        />
      </div>

      {/* Call Modal */}
      <CallModal
        isOpen={isCallModalOpen}
        callType={callType}
        callState={callState}
        caller={caller}
        callee={callee}
        callerAvatar={`https://i.pravatar.cc/150?u=${caller}`}
        calleeAvatar={`https://i.pravatar.cc/150?u=${callee}`}
        localStream={localStream}
        remoteStream={remoteStream}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onEnd={handleEndCall}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
