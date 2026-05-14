import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';

export function GlobalChatNotifications() {
  const { user } = useAuth();
  const audioContextRef = useRef<AudioContext | null>(null);

  // Som suave de notificação (estilo "pop" de mensagem)
  const playMessageSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.log("Could not play message sound", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Se inscreve na tabela chat_messages. O RLS do Supabase garante que 
    // o usuário só receba as mensagens das salas em que ele participa.
    const channel = supabase
      .channel('global-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Não notifica se fui eu mesmo que enviei a mensagem
          if (newMessage.sender_id === user.id) return;

          // Toca o som de nova mensagem
          playMessageSound();

          // Exibe o alerta visual
          toast(
            <div className="flex items-start gap-3 w-full cursor-pointer p-1">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary opacity-20 animate-pulse rounded-full"></div>
                <MessageSquare className="w-5 h-5 text-primary relative z-10" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm text-gray-900">Nova Mensagem!</p>
                <p className="text-xs text-gray-600 truncate max-w-[220px]">
                  {newMessage.content}
                </p>
                <p className="text-[10px] text-primary font-medium mt-1">
                  Clique no chat do pedido para responder
                </p>
              </div>
            </div>,
            {
              duration: 5000,
              position: "top-right",
              className: "border-l-4 border-primary bg-white shadow-lg",
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null; // Este componente não renderiza nada visualmente, apenas roda em background
}
