import { motion } from "framer-motion";
import { Briefcase, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ServiceRequestCardProps {
    req: any;
    onAccept: (id: string) => void;
    onSchedule: (req: any) => void;
    onReject: (id: string) => void;
    processing: boolean;
}

const ServiceRequestCard = ({ req, onAccept, onSchedule, onReject, processing }: ServiceRequestCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <Card className="border-none shadow-soft overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-4 flex justify-between items-start border-b border-border/50">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge className='bg-amber-500'>
                                    NOVA SOLICITAÇÃO
                                </Badge>
                                <span className="text-xs text-muted-foreground font-bold italic">
                                    {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <h3 className="font-black text-lg">{req.service_type}</h3>
                        </div>
                        <p className="text-xl font-black text-primary">
                            {req.price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(req.price) : "A combinar"}
                        </p>
                    </div>

                    <div className="p-4 bg-muted/30 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground">Cliente</p>
                                <p className="text-sm font-bold">{req.customer_full_name || req.customer_name || "Usuário Vai Já"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground">Local</p>
                                <p className="text-sm font-bold truncate w-32">{req.address}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                        <div className="flex gap-3">
                            <Button 
                                className="flex-1 bg-primary hover:bg-primary/90 font-black h-14 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-white"
                                onClick={() => onAccept(req.id)}
                                disabled={processing}
                            >
                                ACEITAR AGORA
                            </Button>
                            <Button 
                                variant="outline" 
                                className="flex-1 border-primary text-primary hover:bg-primary/5 font-black h-14 rounded-2xl transition-all active:scale-95"
                                onClick={() => onSchedule(req)}
                                disabled={processing}
                            >
                                <CalendarIcon className="w-4 h-4 mr-2" /> AGENDAR
                            </Button>
                        </div>
                        <Button 
                            variant="ghost" 
                            className="w-full text-destructive font-bold h-10 hover:bg-destructive/5"
                            onClick={() => onReject(req.id)}
                            disabled={processing}
                        >
                            RECUSAR CHAMADO
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ServiceRequestCard;
