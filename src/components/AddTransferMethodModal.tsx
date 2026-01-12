import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransferMethods } from "@/hooks/useMasterData";
import { profileApi } from "@/lib/api/profile";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface AddTransferMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransferMethodModal({
  open,
  onOpenChange,
}: AddTransferMethodModalProps) {
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const { data: transferMethods, isLoading: isLoadingMethods } =
    useTransferMethods("children");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedMethod = useMemo(() => {
    return transferMethods?.find((m) => m.id === selectedMethodId);
  }, [transferMethods, selectedMethodId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMethodId || !accountName.trim() || !accountNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await profileApi.addTransferMethod({
        transferMethodId: selectedMethodId,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
      });

      toast({
        title: "Transfer method added",
        description: "Your transfer method has been saved successfully",
      });

      // Reset form and close modal
      setSelectedMethodId("");
      setAccountName("");
      setAccountNumber("");
      onOpenChange(false);

      // Invalidate the query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["transfer-methods"] });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to add transfer method",
        description: err.message || "Something went wrong",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedMethodId("");
      setAccountName("");
      setAccountNumber("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            Add Transfer Method
          </DialogTitle>
          <DialogDescription>
            Add a new payment method to receive money from friends
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transfer Method Selector */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                  disabled={isLoadingMethods}
                >
                  {isLoadingMethods ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : selectedMethod ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedMethod.iconUrl}
                        alt={selectedMethod.name}
                        className="h-5 w-5 rounded object-contain"
                      />
                      <span>{selectedMethod.display}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Select payment method...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-50" align="start">
                <Command>
                  <CommandInput placeholder="Search payment method..." />
                  <CommandList>
                    <CommandEmpty>No payment method found.</CommandEmpty>
                    <CommandGroup>
                      {transferMethods?.map((method) => (
                        <CommandItem
                          key={method.id}
                          value={method.display}
                          onSelect={() => {
                            setSelectedMethodId(method.id);
                            setComboboxOpen(false);
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
                              selectedMethodId === method.id
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

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g., John Doe"
            />
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g., 1234567890"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add Method"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
