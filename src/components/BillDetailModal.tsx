import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { groupExpensesApi } from "@/lib/api";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, CreditCard, Trash2, Loader2 } from "lucide-react";

interface BillDetailModalProps {
  billId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (billId: string) => Promise<void>;
  isDeleting?: boolean;
}

export function BillDetailModal({
  billId,
  open,
  onOpenChange,
  onDelete,
  isDeleting = false,
}: BillDetailModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: bill, isLoading } = useQuery({
    queryKey: ["bills", billId],
    queryFn: () => groupExpensesApi.getBillById(billId!),
    enabled: !!billId && open,
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    if (bill && onDelete) {
      await onDelete(bill.id);
      onOpenChange(false);
    }
  };

  // Reset image loaded state when modal opens with new bill
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setImageLoaded(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bill Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        ) : bill ? (
          <div className="space-y-4">
            {/* Bill Image */}
            {bill.imageUrl && (
              <div className="relative rounded-lg overflow-hidden bg-muted">
                {!imageLoaded && (
                  <Skeleton className="aspect-[4/3] w-full rounded-lg absolute inset-0" />
                )}
                <img
                  src={bill.imageUrl}
                  alt="Bill receipt"
                  className={`w-full h-auto max-h-[400px] object-contain transition-opacity ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
            )}

            {/* Bill Info */}
            <div className="space-y-3">
              {/* Creator */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Uploaded by</p>
                  <div className="flex items-center gap-2">
                    <AvatarCircle name={bill.creatorProfileName} size="sm" />
                    <span className="font-medium">
                      {bill.isCreatedByUser ? "You" : bill.creatorProfileName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payer */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Paid by</p>
                  <div className="flex items-center gap-2">
                    <AvatarCircle name={bill.payerProfileName} size="sm" />
                    <span className="font-medium">
                      {bill.isPaidByUser ? "You" : bill.payerProfileName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-9 w-9 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Uploaded on</p>
                  <p className="font-medium">{formatDate(bill.createdAt)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(bill.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Delete Button */}
            {bill.isCreatedByUser && onDelete && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {isDeleting ? "Deleting..." : "Delete Bill"}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Bill not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
