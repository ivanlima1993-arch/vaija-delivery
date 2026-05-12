import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatWindow from "./ChatWindow";
import { AnimatePresence } from "framer-motion";

interface ChatButtonProps {
  orderId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string | null;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "floating";
}

const ChatButton = ({ orderId, participantId, participantName, participantAvatar, label, variant = "default" }: ChatButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === "floating" ? (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-2xl z-[90] animate-bounce-slow"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      ) : (
        <Button
          variant={variant as any}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          {label || "Chat"}
        </Button>
      )}

      <AnimatePresence>
        {isOpen && (
          <ChatWindow
            orderId={orderId}
            participantId={participantId}
            participantName={participantName}
            participantAvatar={participantAvatar}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatButton;
