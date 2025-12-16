import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { groupExpensesApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Package } from "lucide-react";
import type { ExpenseItemResponse } from "@/lib/api/types";

interface ExpenseItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string;
  item?: ExpenseItemResponse | null;
}

export function ExpenseItemModal({
  open,
  onOpenChange,
  expenseId,
  item,
}: ExpenseItemModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState(1);

  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setName(item.name);
      setAmount(item.amount);
      setQuantity(item.quantity);
    } else {
      setName("");
      setAmount("");
      setQuantity(1);
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !amount) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && item) {
        const participantRequests = item.participants?.map((p) => ({
          profileId: p.profileId,
          share: p.share,
        })) || [];

        await groupExpensesApi.updateItem(item.id, {
          id: item.id,
          groupExpenseId: expenseId,
          name: name.trim(),
          amount,
          quantity,
          participants: participantRequests,
        });
        
        toast({
          title: "Item updated",
          description: `"${name}" has been updated.`,
        });
      } else {
        await groupExpensesApi.addItem(expenseId, {
          groupExpenseId: expenseId,
          name: name.trim(),
          amount,
          quantity,
        });
        
        toast({
          title: "Item added",
          description: `"${name}" has been added to the expense.`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["group-expenses", expenseId] });
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: isEditing ? "Failed to update item" : "Failed to add item",
        description: err.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Item" : "Add Item"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              placeholder="e.g., Pizza, Coffee"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (IDR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  Rp
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEditing ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
