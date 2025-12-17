import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDraftExpense } from "@/hooks/useApiV2";
import { Loader2, Camera, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type InputType = "upload" | "manual";

interface NewGroupExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewGroupExpenseModal({
  open,
  onOpenChange,
}: NewGroupExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [inputType, setInputType] = useState<InputType>("manual");
  const createDraft = useCreateDraftExpense();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const expense = await createDraft.mutateAsync(description || "");
      toast.success("Group expense created");
      onOpenChange(false);
      setDescription("");
      setInputType("manual");

      // Navigate to the expense detail page
      if (inputType === "upload") {
        // TODO: Navigate to bill upload flow
        navigate(`/expenses/${expense.id}`);
      } else {
        navigate(`/expenses/${expense.id}`);
      }
    } catch (error) {
      toast.error("Failed to create expense");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">New Group Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="e.g., Dinner at restaurant"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Input Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInputType("upload")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  inputType === "upload"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <Camera className="h-6 w-6" />
                <span className="text-sm font-medium">Upload Bill</span>
              </button>
              <button
                type="button"
                onClick={() => setInputType("manual")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  inputType === "manual"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <PenLine className="h-6 w-6" />
                <span className="text-sm font-medium">Manual Input</span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createDraft.isPending}
          >
            {createDraft.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Create Expense
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
