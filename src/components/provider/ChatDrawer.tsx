import React, { useState, useEffect, useRef } from "react";
import { Send, X, User, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    status: 'sent' | 'delivered' | 'read';
}

interface ChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    customerName: string;
    currentUserId: string;
}

const ChatDrawer = ({ isOpen, onClose, requestId, customerName, currentUserId }: ChatDrawerProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && requestId) {
            fetchMessages();
            subscribeToMessages();
        }
    }, [isOpen, requestId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const fetchMessages = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("service_messages" as any)
            .select("*")
            .eq("request_id", requestId)
            .order("created_at", { ascending: true });

        if (data) setMessages(data);
        setLoading(false);
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`chat:${requestId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "service_messages",
                    filter: `request_id=eq.${requestId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            request_id: requestId,
            sender_id: currentUserId,
            content: newMessage,
            status: 'sent'
        };

        setNewMessage("");
        const { error } = await supabase.from("service_messages" as any).insert([messageData]);
        if (error) {
            console.error("Error sending message:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-background shadow-2xl z-50 flex flex-col border-l">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-primary text-primary-foreground">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-bold">{customerName}</p>
                        <p className="text-[10px] opacity-80 uppercase font-black">Cliente em Atendimento</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-sm text-muted-foreground italic">Inicie uma conversa com o cliente.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div 
                                key={msg.id}
                                className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                    msg.sender_id === currentUserId 
                                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                                        : "bg-muted text-foreground rounded-tl-none"
                                }`}>
                                    <p>{msg.content}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1 opacity-70 text-[10px]">
                                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {msg.sender_id === currentUserId && (
                                            msg.status === 'read' ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-muted/30">
                <div className="flex gap-2">
                    <Input 
                        placeholder="Digite sua mensagem..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="rounded-xl border-none shadow-inner focus-visible:ring-primary"
                    />
                    <Button type="submit" size="icon" className="rounded-xl shrink-0">
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ChatDrawer;
