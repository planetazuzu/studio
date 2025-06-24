'use client';

import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Hash, Send, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { ChatChannel, ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function ChatPage() {
    const { user } = useAuth();
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const channels = useLiveQuery(db.getAllChatChannels, []);
    const messages = useLiveQuery(() =>
        selectedChannelId ? db.getChatMessages(selectedChannelId) : [],
        [selectedChannelId],
        []
    );

    // Set default channel on load
    useEffect(() => {
        if (!selectedChannelId && channels && channels.length > 0) {
            setSelectedChannelId(channels.find(c => c.name === 'general')?.id || channels[0].id);
        }
    }, [channels, selectedChannelId]);

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
    
    if (!channels) {
        return (
             <div className="flex h-full items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    const selectedChannel = channels.find(c => c.id === selectedChannelId);

    return (
        <div className="h-[calc(100vh-8rem)]">
            <Card className="h-full grid grid-cols-[280px_1fr] shadow-lg">
                {/* Channels Sidebar */}
                <div className="border-r">
                    <CardHeader>
                        <CardTitle>Canales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <nav className="flex flex-col gap-1">
                            {channels.map(channel => (
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
                            <div className="p-4 border-b">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Hash /> {selectedChannel.name}
                                </h2>
                                {selectedChannel.description && (
                                  <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
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
                                        placeholder={`Enviar mensaje a #${selectedChannel.name}`}
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