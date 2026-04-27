import { Bell, LogOut, Menu, ShieldCheck, AlertCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface ProviderHeaderProps {
    providerData: any;
    isOnline: boolean;
    toggleOnline: (checked: boolean) => void;
    onSignOut: () => void;
    onMenuClick: () => void;
    hasPendingSounds?: boolean;
}

const ProviderHeader = ({ 
    providerData, 
    isOnline, 
    toggleOnline, 
    onSignOut, 
    onMenuClick,
    hasPendingSounds 
}: ProviderHeaderProps) => {
    return (
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b px-4 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
                        <Menu className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg">Olá, {providerData?.name?.split(' ')[0]}!</h1>
                        <div className="flex items-center gap-2">
                            {providerData?.is_active ? (
                                <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 gap-1 px-1">
                                    <ShieldCheck className="w-3 h-3" /> Perfil Verificado
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50 gap-1 px-1">
                                    <AlertCircle className="w-3 h-3" /> Aguardando Aprovação
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{isOnline ? "Online" : "Indisponível"}</span>
                        <Switch
                            checked={isOnline}
                            onCheckedChange={toggleOnline}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="relative text-primary">
                        <Volume2 className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive"
                        onClick={onSignOut}
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default ProviderHeader;
