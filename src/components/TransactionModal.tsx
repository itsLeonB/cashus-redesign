import { useState, useMemo } from "react";
import { useFriendships, useCreateDebt } from "@/hooks/useApi";
import { useFilteredTransferMethods } from "@/hooks/useMasterData";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { AvatarCircle } from "@/components/AvatarCircle";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFriendId?: string;
  defaultAction?: DebtAction;
}

const actionConfig: Record<
  DebtAction,
  {
    label: string;
    description: string;
    icon: typeof ArrowUpRight;
    colorClass: string;
  }
> = {
  LEND: {
    label: "Lend",
    description: "You gave money to friend",
    icon: ArrowUpRight,
    colorClass: "border-success text-success bg-success/10",
  },
  BORROW: {
    label: "Borrow",
    description: "You received money from friend",
    icon: ArrowDownLeft,
    colorClass: "border-warning text-warning bg-warning/10",
  },
  RECEIVE: {
    label: "Receive",
    description: "Friend paid you back",
    icon: ArrowDownLeft,
    colorClass: "border-success text-success bg-success/10",
  },
  RETURN: {
    label: "Return",
    description: "You paid friend back",
    icon: ArrowUpRight,
    colorClass: "border-warning text-warning bg-warning/10",
  },
};

export function TransactionModal({
  open,
  onOpenChange,
  defaultFriendId,
  defaultAction = "LEND",
}: Readonly<TransactionModalProps>) {
  const [friendId, setFriendId] = useState(defaultFriendId || "");
  const [action, setAction] = useState<DebtAction>(defaultAction);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transferMethodId, setTransferMethodId] = useState("");
  const [transferMethodOpen, setTransferMethodOpen] = useState(false);

  const { data: friendships } = useFriendships();
  const { data: transferMethods, isLoading: isLoadingMethods } =
    useFilteredTransferMethods("for-transaction", open);
  const createDebt = useCreateDebt();
  const { toast } = useToast();

  const selectedMethod = useMemo(() => {
    return transferMethods?.find((m) => m.id === transferMethodId);
  }, [transferMethods, transferMethodId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendId || !amount || !transferMethodId) return;

    try {
      await createDebt.mutateAsync({
        friendProfileId: friendId,
        action,
        amount: Number.parseFloat(amount),
        transferMethodId,
        description: description || undefined,
      });
      toast({
        title: "Transaction recorded",
        description: `Successfully recorded ${actionConfig[
          action
        ].label.toLowerCase()} transaction`,
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

  const transferMethodInput = () => {
    if (isLoadingMethods)
      return <span className="text-muted-foreground">Loading...</span>;

    if (selectedMethod)
      return (
        <div className="flex items-center gap-2">
          <img
            src={selectedMethod.iconUrl}
            alt={selectedMethod.name}
            className="h-5 w-5 rounded object-contain"
          />
          <span>{selectedMethod.display}</span>
        </div>
      );

    return (
      <span className="text-muted-foreground">Select transfer method...</span>
    );
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

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                Rp
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-10 text-lg tabular-nums"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Transfer Method */}
          <div className="space-y-2">
            <Label>Transfer Method</Label>
            <Popover
              open={transferMethodOpen}
              onOpenChange={setTransferMethodOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={transferMethodOpen}
                  className="w-full justify-between"
                  disabled={isLoadingMethods}
                >
                  {transferMethodInput()}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-50" align="start">
                <Command>
                  <CommandInput placeholder="Search transfer method..." />
                  <CommandList>
                    <CommandEmpty>No transfer method found.</CommandEmpty>
                    <CommandGroup>
                      {transferMethods?.map((method) => (
                        <CommandItem
                          key={method.id}
                          value={method.display}
                          onSelect={() => {
                            setTransferMethodId(method.id);
                            setTransferMethodOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <img
                              src={method.iconUrl}
                              alt={method.name}
                              className="h-5 w-5 rounded object-contain"
                            />
                            <span>{method.display}</span>
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4",
                              transferMethodId === method.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
            disabled={
              !friendId || !amount || !transferMethodId || createDebt.isPending
            }
          >
            {createDebt.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Record Transaction
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
