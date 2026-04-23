import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ShieldCheck, Search, Activity, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AnalysisScreenProps {
  onRefresh: () => void;
  onSignOut: () => void;
  establishmentName: string;
  createdAt: string;
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ onRefresh, onSignOut, establishmentName, createdAt }) => {
  const [seconds, setSeconds] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculate initial seconds from createdAt
    const start = new Date(createdAt).getTime();
    const updateTime = () => {
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000);
        setSeconds(diff > 0 ? diff : 0);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    const progressTimer = setInterval(() => {
      setProgress(prev => (prev >= 95 ? 95 : prev + 0.5));
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-orange-100/30 flex items-center justify-center p-4 overflow-hidden">
      {/* Background Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" 
          />
          <motion.div 
            animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl" 
          />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl ring-1 ring-white/20">
          <CardContent className="pt-10 pb-8 px-6 md:px-10 text-center">
            
            <div className="relative w-32 h-32 mx-auto mb-8">
                {/* Rotating ring */}
                <svg className="w-full h-full animate-[spin_8s_linear_infinite]">
                    <circle 
                        cx="64" cy="64" r="60" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="transparent" 
                        className="text-primary/10"
                        strokeDasharray="10 20"
                    />
                </svg>
                
                {/* Pulse inner child */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="bg-primary p-5 rounded-3xl shadow-[0_0_40px_rgba(249,115,22,0.4)]"
                        >
                            <Search className="w-10 h-10 text-white" />
                        </motion.div>
                        <Activity className="absolute -bottom-2 -right-2 w-8 h-8 text-orange-600 bg-white dark:bg-slate-900 rounded-full p-1 border-2 border-primary/20 animate-pulse" />
                    </div>
                </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-2">
                Análise em Curso
            </h1>
            <p className="text-muted-foreground mb-8">
                Olá <span className="font-bold text-orange-600">{establishmentName}</span>! Nossos algoritmos e equipe de segurança estão revisando seus dados.
            </p>

            {/* Timer Display */}
            <div className="bg-muted/50 rounded-2xl p-6 mb-8 border border-border/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Clock className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Tempo em análise</p>
                <div className="text-4xl font-mono font-black text-primary slashed-zero tabular-nums">
                    {formatTime(seconds)}
                </div>
            </div>

            {/* Progress Area */}
            <div className="space-y-3 mb-10">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>Verificando documentos...</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-muted transition-all duration-1000" />
                <p className="text-[10px] text-muted-foreground italic">
                    Aguarde nesta tela. O status será atualizado automaticamente assim que concluído.
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
                <Button 
                    variant="outline" 
                    className="h-12 border-primary/20 hover:bg-primary/5 gap-2 rounded-xl group"
                    onClick={onRefresh}
                >
                    <RefreshCw className="w-4 h-4 text-primary group-active:animate-spin" />
                    Atualizar Status Agora
                </Button>
                
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-destructive gap-2"
                    onClick={onSignOut}
                >
                    <LogOut className="w-4 h-4" />
                    Sair e aguardar depois
                </Button>
            </div>

            {/* Security Note */}
            <div className="mt-10 flex items-center justify-center gap-2 py-4 border-t border-border/50">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                    Ambiente Seguro via Vai Já Delivery
                </span>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalysisScreen;
