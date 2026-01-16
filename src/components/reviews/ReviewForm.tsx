import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StarRating } from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Store, Bike } from "lucide-react";

const reviewSchema = z.object({
  establishmentRating: z.number().min(1, "Avalie o estabelecimento").max(5),
  establishmentComment: z.string().optional(),
  driverRating: z.number().min(1, "Avalie o entregador").max(5).optional(),
  driverComment: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  orderId: string;
  establishmentId: string;
  establishmentName: string;
  driverId?: string | null;
  driverName?: string;
  onSuccess?: () => void;
}

export const ReviewForm = ({
  orderId,
  establishmentId,
  establishmentName,
  driverId,
  driverName,
  onSuccess,
}: ReviewFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      establishmentRating: 0,
      establishmentComment: "",
      driverRating: 0,
      driverComment: "",
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Você precisa estar logado para avaliar");
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        order_id: orderId,
        customer_id: userData.user.id,
        establishment_id: establishmentId,
        driver_id: driverId || null,
        establishment_rating: data.establishmentRating,
        establishment_comment: data.establishmentComment || null,
        driver_rating: driverId ? data.driverRating : null,
        driver_comment: driverId ? data.driverComment : null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Você já avaliou este pedido");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Avaliação enviada com sucesso!");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Erro ao enviar avaliação");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Como foi seu pedido?</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Establishment Rating */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                <span className="font-medium">{establishmentName}</span>
              </div>
              
              <FormField
                control={form.control}
                name="establishmentRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avaliação</FormLabel>
                    <FormControl>
                      <StarRating
                        rating={field.value}
                        interactive
                        size="lg"
                        onRatingChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="establishmentComment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentário (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conte como foi sua experiência..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Driver Rating (if applicable) */}
            {driverId && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Bike className="w-5 h-5 text-primary" />
                  <span className="font-medium">{driverName || "Entregador"}</span>
                </div>

                <FormField
                  control={form.control}
                  name="driverRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avaliação da entrega</FormLabel>
                      <FormControl>
                        <StarRating
                          rating={field.value || 0}
                          interactive
                          size="lg"
                          onRatingChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverComment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentário (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Como foi a entrega..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Avaliação"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
