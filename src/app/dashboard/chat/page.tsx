'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Hash, Send, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { ChatMessage, ChatChannel, DirectMessageThread } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';

function ChatMessageItem({ message, isCurrentUser }: { message: ChatMessage, isCurrentUser: boolean }) {
    return (
        <div className={cn("flex items-start gap-3", isCurrentUser && "flex-row-reverse")}>
            <Avatar className="h-9 w-9">
                <AvatarImage src={message.userAvatar} />
                <AvatarFallback>{message.userName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className={cn("flex flex-col gap-1", isCurrentUser && "items-end")}>
                 <div className={cn(
                    "p-3 rounded-lg max-w-sm",
                    isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                    <p className="text-sm font-semibold mb-1">{message.userName}</p>
                    <p className="text-sm break-words">{message.message}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                    {format(new Date(message.timestamp), 'HH:mm')}
                </span>
            </div>
        </div>
    );
}

function ChatPageContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const initialChannelId = searchParams.get('channelId');

    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const publicChannels = useLiveQuery(db.getPublicChatChannels, []);
    const dmThreads = useLiveQuery(() => (user ? db.getDirectMessageThreadsForUserWithDetails(user.id) : []), [user?.id]);
    const messages = useLiveQuery(() =>
        selectedChannelId ? db.getChatMessages(selectedChannelId) : [],
        [selectedChannelId],
        []
    );

    // Set channel from URL param or default on load
    useEffect(() => {
        if (initialChannelId && initialChannelId !== selectedChannelId) {
          setSelectedChannelId(initialChannelId);
        } else if (!selectedChannelId && publicChannels && publicChannels.length > 0) {
            setSelectedChannelId(publicChannels.find(c => c.name === 'general')?.id || publicChannels[0].id);
        }
    }, [initialChannelId, selectedChannelId, publicChannels]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChannelId || !user) return;

        setIsSending(true);
        try {
            await db.addChatMessage({
                channelId: selectedChannelId,
                userId: user.id,
                userName: user.name,
                userAvatar: user.avatar,
                message: newMessage,
                timestamp: new Date().toISOString(),
            });
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsSending(false);
        }
    };
    
    if (!user || publicChannels === undefined || dmThreads === undefined) {
        return (
             <div className="flex h-full items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    const allChannels = [...(publicChannels || []), ...(dmThreads || [])];
    const selectedChannel = allChannels.find(c => c.id === selectedChannelId);
    const selectedDmThread = dmThreads?.find(t => t.id === selectedChannelId);


    return (
        <div className="h-[calc(100vh-8rem)]">
            <Card className="h-full grid grid-cols-[280px_1fr] shadow-lg">
                {/* Channels Sidebar */}
                <div className="border-r flex flex-col">
                    <CardHeader>
                        <CardTitle>Canales de Chat</CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                        <CardContent className="pt-0">
                            <p className="text-sm font-semibold text-muted-foreground px-2 py-1">Canales Públicos</p>
                            <nav className="flex flex-col gap-1 mt-2">
                                {publicChannels?.map(channel => (
                                    <Button
                                        key={channel.id}
                                        variant={selectedChannelId === channel.id ? 'secondary' : 'ghost'}
                                        className="justify-start gap-2"
                                        onClick={() => setSelectedChannelId(channel.id)}
                                    >
                                        <Hash className="h-4 w-4" />
                                        {channel.name}
                                    </Button>
                                ))}
                            </nav>
                        </CardContent>
                        <CardContent>
                            <p className="text-sm font-semibold text-muted-foreground px-2 py-1">Mensajes Directos</p>
                            <nav className="flex flex-col gap-1 mt-2">
                                {dmThreads?.map(thread => (
                                    <Button
                                        key={thread.id}
                                        variant={selectedChannelId === thread.id ? 'secondary' : 'ghost'}
                                        className="justify-start gap-2 h-12"
                                        onClick={() => setSelectedChannelId(thread.id)}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={thread.otherParticipant.avatar} />
                                            <AvatarFallback>{thread.otherParticipant.name.slice(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">{thread.otherParticipant.name}</span>
                                    </Button>
                                ))}
                                {dmThreads?.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">Inicia una conversación desde la página de Usuarios.</p>}
                            </nav>
                        </CardContent>
                    </ScrollArea>
                </div>

                {/* Main Chat Area */}
                <div className="flex flex-col h-full">
                    {!selectedChannel ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Users className="h-12 w-12 mb-4" />
                            <h2 className="text-xl font-semibold">Selecciona un canal</h2>
                            <p>Únete a la conversación para empezar a chatear.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center gap-3">
                               {selectedDmThread ? (
                                    <>
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={selectedDmThread.otherParticipant.avatar} />
                                            <AvatarFallback>{selectedDmThread.otherParticipant.name.slice(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h2 className="text-xl font-semibold">{selectedDmThread.otherParticipant.name}</h2>
                                            <p className="text-sm text-muted-foreground">Mensaje Directo</p>
                                        </div>
                                    </>
                               ) : (
                                    <div>
                                        <h2 className="text-xl font-semibold flex items-center gap-2">
                                            <Hash /> {selectedChannel.name}
                                        </h2>
                                        {selectedChannel.description && (
                                          <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
                                        )}
                                    </div>
                               )}
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-grow p-4" viewportRef={scrollAreaRef}>
                                <div className="space-y-6">
                                    {messages?.map(msg => (
                                        <ChatMessageItem key={msg.id} message={msg} isCurrentUser={user?.id === msg.userId} />
                                    ))}
                                </div>
                            </ScrollArea>

                            {/* Message Input */}
                            <div className="p-4 border-t bg-background">
                                <form onSubmit={handleSendMessage} className="relative">
                                    <Input
                                        placeholder={selectedDmThread ? `Enviar mensaje a ${selectedDmThread.otherParticipant.name}` : `Enviar mensaje a #${selectedChannel.name}`}
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        disabled={isSending}
                                        autoComplete="off"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7"
                                        disabled={isSending || !newMessage.trim()}
                                    >
                                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}


export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        }>
            <ChatPageContent />
        </Suspense>
    );
}
