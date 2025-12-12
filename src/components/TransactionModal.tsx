import { useState } from "react";
import { useFriendships, useCreateDebt, useTransferMethods } from "@/hooks/useApi";
import { DebtAction } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2,
  Wallet,
  CreditCard,
  Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFriendId?: string;
  defaultAction?: DebtAction;
}

const actionConfig: Record<DebtAction, { label: string; description: string; icon: typeof ArrowUpRight; colorClass: string }> = {
  LEND: { 
    label: "Lend", 
    description: "You gave money to friend",
    icon: ArrowUpRight,
    colorClass: "border-success text-success bg-success/10"
  },
  BORROW: { 
    label: "Borrow", 
    description: "You received money from friend",
    icon: ArrowDownLeft,
    colorClass: "border-warning text-warning bg-warning/10"
  },
  RECEIVE: { 
    label: "Receive", 
    description: "Friend paid you back",
    icon: ArrowDownLeft,
    colorClass: "border-success text-success bg-success/10"
  },
  RETURN: { 
    label: "Return", 
    description: "You paid friend back",
    icon: ArrowUpRight,
    colorClass: "border-warning text-warning bg-warning/10"
  },
};

export function TransactionModal({ 
  open, 
  onOpenChange, 
  defaultFriendId,
  defaultAction = "LEND" 
}: TransactionModalProps) {
  const [friendId, setFriendId] = useState(defaultFriendId || "");
  const [action, setAction] = useState<DebtAction>(defaultAction);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transferMethodId, setTransferMethodId] = useState("");

  const { data: friendships } = useFriendships();
  const { data: transferMethods } = useTransferMethods();
  const createDebt = useCreateDebt();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendId || !amount || !transferMethodId) return;

    try {
      await createDebt.mutateAsync({
        friendProfileId: friendId,
        action,
        amount: parseFloat(amount),
        transferMethodId,
        description: description || undefined,
      });
      toast({
        title: "Transaction recorded",
        description: `Successfully recorded ${actionConfig[action].label.toLowerCase()} transaction`,
      });
      resetForm();
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to record transaction",
        description: err.message || "Something went wrong",
      });
    }
  };

  const resetForm = () => {
    setFriendId(defaultFriendId || "");
    setAction(defaultAction);
    setAmount("");
    setDescription("");
    setTransferMethodId("");
  };

  const getTransferIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("cash")) return Banknote;
    if (lower.includes("card") || lower.includes("credit")) return CreditCard;
    return Wallet;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Record Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Action Type */}
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(actionConfig) as DebtAction[]).map((key) => {
              const config = actionConfig[key];
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAction(key)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                    action === key
                      ? config.colorClass
                      : "border-border/50 hover:border-border text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Friend Selection */}
          <div className="space-y-2">
            <Label>Friend</Label>
            <Select value={friendId} onValueChange={setFriendId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a friend" />
              </SelectTrigger>
              <SelectContent>
                {friendships?.map((friendship) => (
                  <SelectItem key={friendship.friendProfile.id} value={friendship.friendProfile.id}>
                    <div className="flex items-center gap-2">
                      <AvatarCircle 
                        name={friendship.friendProfile.name} 
                        imageUrl={friendship.friendProfile.avatarUrl}
                        size="xs"
                      />
                      <span>{friendship.friendProfile.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7 text-lg tabular-nums"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Transfer Method */}
          <div className="space-y-2">
            <Label>Transfer Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {transferMethods?.map((method) => {
                const Icon = getTransferIcon(method.name);
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setTransferMethodId(method.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all",
                      transferMethodId === method.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 hover:border-border text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{method.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Note (optional)</Label>
            <Textarea
              id="description"
              placeholder="What's this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={!friendId || !amount || !transferMethodId || createDebt.isPending}
          >
            {createDebt.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Record Transaction
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
