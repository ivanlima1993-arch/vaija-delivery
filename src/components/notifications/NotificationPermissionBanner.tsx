import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface NotificationPermissionBannerProps {
  variant?: "compact" | "full";
  className?: string;
}

export const NotificationPermissionBanner = ({
  variant = "full",
  className,
}: NotificationPermissionBannerProps) => {
  const { isSupported, permission, isGranted, isDenied, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedKey = "notification-banner-dismissed";
    setDismissed(localStorage.getItem(dismissedKey) === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("notification-banner-dismissed", "true");
    setDismissed(true);
  };

  const handleRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      handleDismiss();
    }
  };

  // Don't show if not supported, already granted, or dismissed
  if (!isSupported || isGranted || dismissed) {
    return null;
  }

  if (isDenied) {
    return (
      <div className={cn(
        "bg-muted/50 border rounded-lg p-3 flex items-center gap-3",
        className
      )}>
        <BellOff className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="flex-1 text-sm">
          <p className="text-muted-foreground">
            Notificações bloqueadas. Ative nas configurações do navegador para receber alertas.
          </p>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleRequest}
        className={cn("gap-2", className)}
      >
        <Bell className="w-4 h-4" />
        Ativar Notificações
      </Button>
    );
  }

  return (
    <div className={cn(
      "bg-primary/10 border border-primary/20 rounded-lg p-4",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Ativar Notificações</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Receba alertas em tempo real sobre novos pedidos e atualizações de status, mesmo com o app em segundo plano.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRequest} className="gap-2">
              <Bell className="w-4 h-4" />
              Ativar
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationStatus = () => {
  const { isSupported, isGranted, requestPermission } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="w-4 h-4" />
        <span>Notificações não suportadas</span>
      </div>
    );
  }

  if (isGranted) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="w-4 h-4" />
        <span>Notificações ativadas</span>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={requestPermission} className="gap-2">
      <Bell className="w-4 h-4" />
      Ativar Notificações
    </Button>
  );
};
