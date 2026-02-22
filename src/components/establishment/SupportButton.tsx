import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Headset,
    MessageCircle,
    Mail,
    MessageSquare,
    ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const SupportButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    const supportOptions = [
        {
            icon: <MessageCircle className="w-5 h-5 text-green-500" />,
            label: "WhatsApp",
            description: "Atendimento via WhatsApp",
            href: "https://wa.me/5579988320546",
        },
        {
            icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
            label: "Chat Online",
            description: "Converse com nossa equipe",
            href: "#", // Placeholder for actual chat or internal route
            onClick: () => window.open("https://tawk.to/chat/placeholder", "_blank"), // Example
        },
        {
            icon: <Mail className="w-5 h-5 text-orange-500" />,
            label: "E-mail",
            description: "Envie sua dúvida por e-mail",
            href: "mailto:suporte@vaijadelivery.com",
        },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <DropdownMenu onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="lg"
                        className="rounded-full h-14 w-14 shadow-2xl bg-primary hover:bg-primary/90 transition-all duration-300 group"
                    >
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Headset className="w-7 h-7" />
                        </motion.div>
                        <span className="sr-only">Suporte</span>

                        {/* Tooltip-like label for desktop */}
                        <span className="absolute right-16 px-3 py-1 bg-background border rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:block whitespace-nowrap text-foreground pointer-events-none font-medium">
                            Precisa de Ajuda?
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-72 p-2 mb-4">
                    <DropdownMenuLabel className="flex flex-col gap-1 p-3">
                        <span className="text-lg font-bold">Suporte Vai Já</span>
                        <span className="text-sm font-normal text-muted-foreground leading-relaxed">
                            Como podemos ajudar você hoje? Escolha um canal de atendimento.
                        </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {supportOptions.map((option, index) => (
                        <DropdownMenuItem
                            key={option.label}
                            className="p-3 cursor-pointer focus:bg-primary/5 rounded-xl transition-all"
                            asChild
                        >
                            <a
                                href={option.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={option.onClick}
                                className="flex items-center gap-4 w-full"
                            >
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    {option.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold">{option.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {option.description}
                                    </span>
                                </div>
                            </a>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <div className="p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                            Atendimento de Seg a Sex • 08h às 22h
                        </p>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
