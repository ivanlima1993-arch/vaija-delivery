import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReviewForm } from "./ReviewForm";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  establishmentId: string;
  establishmentName: string;
  driverId?: string | null;
  driverName?: string;
  onSuccess?: () => void;
}

export const ReviewModal = ({
  open,
  onOpenChange,
  orderId,
  establishmentId,
  establishmentName,
  driverId,
  driverName,
  onSuccess,
}: ReviewModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Avaliar pedido</DialogTitle>
        </DialogHeader>
        <ReviewForm
          orderId={orderId}
          establishmentId={establishmentId}
          establishmentName={establishmentName}
          driverId={driverId}
          driverName={driverName}
          onSuccess={() => {
            onSuccess?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
