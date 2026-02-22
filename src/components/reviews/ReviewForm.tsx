import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StarRating } from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Store, Bike, CheckCircle2 } from "lucide-react";

interface ReviewFormProps {
  orderId: string;
  establishmentId: string;
  establishmentName: string;
  driverId?: string | null;
  driverName?: string;
  onSuccess?: () => void;
}

type ReviewFormData = {
  establishmentRating: number;
  establishmentComment?: string;
  driverRating?: number;
  driverComment?: string;
};

export const ReviewForm = ({
  orderId,
  establishmentId,
  establishmentName,
  driverId,
  driverName,
  onSuccess,
}: ReviewFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const reviewSchema = z.object({
    establishmentRating: z.number().min(1, "Avalie o estabelecimento").max(5),
    establishmentComment: z.string().optional(),
    driverRating: driverId
      ? z.number().min(1, "Avalie o entregador").max(5)
      : z.number().optional(),
    driverComment: z.string().optional(),
  });

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
        setIsSubmitting(false);
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
          console.error("Error submitting review:", error);
          toast.error("Erro ao enviar avaliação");
        }
        setIsSubmitting(false);
        return;
      }

      toast.success("Avaliação enviada com sucesso!");
      setIsSuccess(true);

      // Delay before closing to show success animation
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Erro ao enviar avaliação");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="py-12 px-6 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1
              }}
              className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2
                }}
              >
                <CheckCircle2 className="w-12 h-12 text-success" />
              </motion.div>
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-display font-bold text-center"
            >
              Obrigado pela avaliação!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-center mt-2"
            >
              Sua opinião é muito importante para nós
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
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
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Avaliação *</FormLabel>
                          <FormControl>
                            <div>
                              <StarRating
                                rating={field.value}
                                interactive
                                size="lg"
                                onRatingChange={field.onChange}
                              />
                              {field.value === 0 && fieldState.error && (
                                <p className="text-sm text-destructive mt-2">
                                  Toque nas estrelas para avaliar
                                </p>
                              )}
                            </div>
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
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Avaliação da entrega *</FormLabel>
                            <FormControl>
                              <div>
                                <StarRating
                                  rating={field.value || 0}
                                  interactive
                                  size="lg"
                                  onRatingChange={field.onChange}
                                />
                                {(field.value === 0 || !field.value) && fieldState.error && (
                                  <p className="text-sm text-destructive mt-2">
                                    Toque nas estrelas para avaliar
                                  </p>
                                )}
                              </div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
