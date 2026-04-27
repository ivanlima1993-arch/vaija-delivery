import { AlertCircle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProviderAlertsProps {
    providerData: any;
    onDeposit: () => void;
}

const ProviderAlerts = ({ providerData, onDeposit }: ProviderAlertsProps) => {
    return (
        <>
            {!providerData?.is_active && providerData?.wallet_balance >= 15 && (
                <Card className="border-none bg-amber-500/10 border-amber-500/20 text-amber-700">
                    <CardContent className="p-4 flex gap-4 items-center">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-black uppercase text-xs">Atenção ao seu Perfil</p>
                            <p className="text-sm font-medium">Seu cadastro está em análise. Você ainda não pode receber novos pedidos, mas pode configurar seu perfil.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {providerData?.wallet_balance < 15 && (
                <Card className="border-none bg-destructive/10 border-destructive/20 text-destructive">
                    <CardContent className="p-4 flex gap-4 items-center">
                        <div className="w-12 h-12 bg-destructive rounded-2xl flex items-center justify-center text-white shrink-0">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="font-black uppercase text-xs">Saldo Insuficiente</p>
                            <p className="text-sm font-medium">Você precisa de no mínimo R$ 15,00 para receber novos chamados.</p>
                        </div>
                        <Button 
                            size="sm" 
                            className="bg-destructive hover:bg-destructive/90 text-white font-bold rounded-xl"
                            onClick={onDeposit}
                        >
                            RECARREGAR
                        </Button>
                    </CardContent>
                </Card>
            )}
        </>
    );
};

export default ProviderAlerts;
