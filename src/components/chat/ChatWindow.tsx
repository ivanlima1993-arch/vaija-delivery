import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatWindowProps {
  orderId: string;
  participantId: string; // ID do entregador ou dono do estabelecimento
  participantName: string;
  participantAvatar?: string | null;
  onClose: () => void;
}

const ChatWindow = ({ orderId, participantId, participantName, participantAvatar, onClose }: ChatWindowProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      initChat();
    }
  }, [user, orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const initChat = async () => {
    try {
      // Fetch order details to get correct IDs
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("customer_id, establishment_id")
        .eq("id", orderId)
        .single();
      
      if (orderError) throw orderError;

      const orderCustomerId = order.customer_id;
      const currentUserId = user.id;
      
      // O participant_id no banco deve ser sempre a outra parte (Loja ou Entregador)
      // se o usuário atual for o cliente. Se o usuário atual NÃO for o cliente, 
      // então o usuário atual é o participante.
      const targetParticipantId = currentUserId === orderCustomerId ? participantId : currentUserId;
      
      // Find or create room
      let { data: room, error } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("order_id", orderId)
        .eq("customer_id", orderCustomerId)
        .eq("participant_id", targetParticipantId)
        .maybeSingle();

      if (!room) {
        const { data: newRoom, error: createError } = await supabase
          .from("chat_rooms")
          .insert({
            order_id: orderId,
            customer_id: orderCustomerId,
            participant_id: targetParticipantId,
          })
          .select()
          .single();
        
        if (createError) throw createError;
        room = newRoom;
      }

      setRoomId(room.id);
      fetchMessages(room.id);
      subscribeToMessages(room.id);
    } catch (error) {
      console.error("Chat init error:", error);
      toast.error("Erro ao iniciar chat");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (rid: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", rid)
      .order("created_at", { ascending: true });
    
    if (data) setMessages(data as Message[]);
  };

  const subscribeToMessages = (rid: string) => {
    const channel = supabase
      .channel(`room-${rid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${rid}`,
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId || !user) return;

    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: user.id,
      content,
    });

    if (error) {
      toast.error("Erro ao enviar mensagem");
      setNewMessage(content); // Restore content on error
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-[100] w-[350px] sm:w-[400px] h-[500px] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
            <AvatarImage src={participantAvatar || undefined} />
            <AvatarFallback className="bg-primary-foreground/10">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-sm leading-none">{participantName}</p>
            <p className="text-[10px] opacity-70 mt-1">Pedido #{orderId.slice(0, 8)}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 opacity-50 ${isMine ? "text-right" : "text-left"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-background/50 backdrop-blur">
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default ChatWindow;
