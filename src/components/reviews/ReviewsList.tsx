import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "./StarRating";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "lucide-react";

interface ReviewsListProps {
  establishmentId?: string;
  driverId?: string;
  limit?: number;
}

interface Review {
  id: string;
  establishment_rating: number | null;
  establishment_comment: string | null;
  driver_rating: number | null;
  driver_comment: string | null;
  created_at: string;
  customer_id: string;
}

export const ReviewsList = ({
  establishmentId,
  driverId,
  limit = 10,
}: ReviewsListProps) => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", establishmentId, driverId],
    queryFn: async () => {
      let query = supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (establishmentId) {
        query = query.eq("establishment_id", establishmentId);
      }
      
      if (driverId) {
        query = query.eq("driver_id", driverId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!(establishmentId || driverId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!reviews?.length) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Nenhuma avaliação ainda
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const rating = establishmentId
          ? review.establishment_rating
          : review.driver_rating;
        const comment = establishmentId
          ? review.establishment_comment
          : review.driver_comment;

        if (!rating) return null;

        return (
          <Card key={review.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <StarRating rating={rating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {comment && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {comment}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
