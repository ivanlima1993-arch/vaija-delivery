import { motion } from "framer-motion";
import { Briefcase, MapPin, MessageSquare, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AcceptedServiceCardProps {
    req: any;
    onChat: (req: any) => void;
    onComplete?: (id: string) => void;
    status: 'accepted' | 'scheduled';
}

const AcceptedServiceCard = ({ req, onChat, onComplete, status }: AcceptedServiceCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="border-none shadow-soft overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={status === 'scheduled' ? 'text-blue-600 border-blue-600' : 'text-green-600 border-green-600'}>
                                    {status === 'scheduled' ? 'AGENDADO' : 'EM ANDAMENTO'}
                                </Badge>
                                {req.scheduled_at && (
                                    <span className="text-xs font-bold text-muted-foreground">
                                        {new Date(req.scheduled_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-black text-lg">{req.service_type}</h3>
                            <p className="text-sm text-muted-foreground font-medium">{req.customer_full_name || req.customer_name}</p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl"
                            onClick={() => onChat(req)}
                        >
                            <MessageSquare className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="truncate">{req.address}</span>
                    </div>

                    <div className="flex gap-2">
                        {status === 'accepted' && (
                            <Button 
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black h-12 rounded-xl gap-2"
                                onClick={() => onComplete && onComplete(req.id)}
                            >
                                <CheckCircle2 className="w-4 h-4" /> CONCLUIR SERVIÇO
                            </Button>
                        )}
                        {status === 'scheduled' && (
                            <Button 
                                variant="outline"
                                className="flex-1 border-primary text-primary hover:bg-primary/5 font-black h-12 rounded-xl"
                                onClick={() => onChat(req)}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" /> FALAR COM CLIENTE
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default AcceptedServiceCard;
