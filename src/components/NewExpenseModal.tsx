import { useState } from "react";
import {
  useFriendships,
  useCreateGroupExpense,
  useCalculationMethods,
} from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Plus, Trash2, Loader2, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ExpenseItem {
  name: string;
  amount: string;
  quantity: number;
}

interface OtherFee {
  name: string;
  amount: string;
  calculationMethod: string;
}

interface NewExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewExpenseModal({
  open,
  onOpenChange,
}: Readonly<NewExpenseModalProps>) {
  const [description, setDescription] = useState("");
  const [payerProfileId, setPayerProfileId] = useState("me");
  const [items, setItems] = useState<ExpenseItem[]>([
    { name: "", amount: "", quantity: 1 },
  ]);
  const [fees, setFees] = useState<OtherFee[]>([]);

  const { data: friendships } = useFriendships();
  const { data: calculationMethods } = useCalculationMethods();
  const createExpense = useCreateGroupExpense();
  const { toast } = useToast();
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => {
    const amount = Number.parseFloat(item.amount) || 0;
    return sum + amount * item.quantity;
  }, 0);

  const feesTotal = fees.reduce((sum, fee) => {
    const amount = Number.parseFloat(fee.amount) || 0;
    if (fee.calculationMethod === "PERCENTAGE") {
      return sum + (subtotal * amount) / 100;
    }
    return sum + amount;
  }, 0);

  const total = subtotal + feesTotal;

  const handleAddItem = () => {
    setItems([...items, { name: "", amount: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof ExpenseItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddFee = () => {
    setFees([...fees, { name: "", amount: "", calculationMethod: "FLAT" }]);
  };

  const handleRemoveFee = (index: number) => {
    setFees(fees.filter((_, i) => i !== index));
  };

  const handleFeeChange = (
    index: number,
    field: keyof OtherFee,
    value: string
  ) => {
    const newFees = [...fees];
    newFees[index] = { ...newFees[index], [field]: value };
    setFees(newFees);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter((item) => item.name && item.amount);
    if (validItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No items",
        description: "Add at least one item to the expense",
      });
      return;
    }

    try {
      const expense = await createExpense.mutateAsync({
        payerProfileId: payerProfileId === "me" ? undefined : payerProfileId,
        description: description || undefined,
        totalAmount: total.toFixed(2),
        subtotal: subtotal.toFixed(2),
        items: validItems.map((item) => ({
          name: item.name,
          amount: item.amount,
          quantity: item.quantity,
        })),
        otherFees: fees
          .filter((fee) => fee.name && fee.amount)
          .map((fee) => ({
            name: fee.name,
            amount: fee.amount,
            calculationMethod: fee.calculationMethod,
          })),
      });

      toast({
        title: "Expense created",
        description: "Now add participants to split the bill",
      });

      onOpenChange(false);
      navigate(`/expenses/${expense.id}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to create expense",
        description: err.message || "Something went wrong",
      });
    }
  };

  const resetForm = () => {
    setDescription("");
    setPayerProfileId("me");
    setItems([{ name: "", amount: "", quantity: 1 }]);
    setFees([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            New Group Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Dinner at restaurant, groceries, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Payer */}
          <div className="space-y-2">
            <Label>Who paid?</Label>
            <Select value={payerProfileId} onValueChange={setPayerProfileId}>
              <SelectTrigger>
                <SelectValue placeholder="Select who paid (you if empty)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Me (default)</SelectItem>
                {friendships?.map((friendship) => (
                  <SelectItem
                    key={friendship.profileId}
                    value={friendship.profileId}
                  >
                    <div className="flex items-center gap-2">
                      <AvatarCircle
                        name={friendship.profileName}
                        imageUrl={friendship.profileAvatar}
                        size="xs"
                      />
                      <span>{friendship.profileName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <Input
                    placeholder="Item name"
                    className="flex-1"
                    value={item.name}
                    onChange={(e) =>
                      handleItemChange(index, "name", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    className="w-16 text-center"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "quantity",
                        Number.parseInt(e.target.value) || 1
                      )
                    }
                  />
                  <div className="relative w-24">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      Rp
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      value={item.amount}
                      onChange={(e) =>
                        handleItemChange(index, "amount", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Other Fees */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Additional Fees (optional)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddFee}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Fee
              </Button>
            </div>

            {fees.length > 0 && (
              <div className="space-y-2">
                {fees.map((fee, index) => (
                  <div key={fee.name} className="flex items-center gap-2">
                    <Input
                      placeholder="Fee name (Tax, Service, etc.)"
                      className="flex-1"
                      value={fee.name}
                      onChange={(e) =>
                        handleFeeChange(index, "name", e.target.value)
                      }
                    />
                    <Select
                      value={fee.calculationMethod}
                      onValueChange={(value) =>
                        handleFeeChange(index, "calculationMethod", value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {calculationMethods?.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method === "PERCENTAGE" ? "%" : "Rp"}
                          </SelectItem>
                        )) || (
                          <>
                            <SelectItem value="FLAT">Rp</SelectItem>
                            <SelectItem value="PERCENTAGE">%</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      className="w-20"
                      value={fee.amount}
                      onChange={(e) =>
                        handleFeeChange(index, "amount", e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFee(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Summary */}
          <div className="rounded-lg bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">Rp{subtotal.toFixed(2)}</span>
            </div>
            {feesTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fees</span>
                <span className="tabular-nums">Rp{feesTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border/50">
              <span>Total</span>
              <span className="tabular-nums">Rp{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={createExpense.isPending}
          >
            {createExpense.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Create Expense
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
