import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDraftExpense, useUploadExpenseBill } from "@/hooks/useApiV2";
import { Loader2, Camera, PenLine, Receipt, ImageIcon, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type InputType = "upload" | "manual";
type Step = "details" | "upload";

interface NewGroupExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewGroupExpenseModal({
  open,
  onOpenChange,
}: NewGroupExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [inputType, setInputType] = useState<InputType>("upload");
  const [step, setStep] = useState<Step>("details");
  const [expenseId, setExpenseId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createDraft = useCreateDraftExpense();
  const uploadBill = useUploadExpenseBill();
  const navigate = useNavigate();
  const { toast } = useToast();

  const resetModal = () => {
    setDescription("");
    setInputType("upload");
    setStep("details");
    setExpenseId(null);
    clearFile();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetModal();
    }
    onOpenChange(open);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please select an image file",
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const expense = await createDraft.mutateAsync(description || "");
      
      if (inputType === "upload") {
        setExpenseId(expense.id);
        setStep("upload");
      } else {
        toast({ title: "Group expense created" });
        handleOpenChange(false);
        navigate(`/expenses/${expense.id}`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to create expense",
        description: err.message || "Something went wrong",
      });
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !expenseId) {
      toast({
        variant: "destructive",
        title: "Missing file",
        description: "Please select an image file",
      });
      return;
    }

    try {
      await uploadBill.mutateAsync({ expenseId, file: selectedFile });
      toast({ title: "Bill uploaded successfully" });
      handleOpenChange(false);
      navigate(`/expenses/${expenseId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.message || "Something went wrong",
      });
    }
  };

  const handleSkipUpload = () => {
    if (expenseId) {
      handleOpenChange(false);
      navigate(`/expenses/${expenseId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            {step === "upload" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 mr-1"
                onClick={() => setStep("details")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Receipt className="h-5 w-5 text-primary" />
            {step === "details" ? "New Group Expense" : "Upload Bill"}
          </DialogTitle>
        </DialogHeader>

        {step === "details" ? (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
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
              {inputType === "upload" ? "Next: Upload Bill" : "Create Expense"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Bill Image</Label>
              {selectedFile && previewUrl ? (
                <div className="relative rounded-lg border border-border overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Bill preview"
                    className="w-full max-h-64 object-contain bg-muted/30"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={clearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop an image here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports JPG, PNG, GIF
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleSkipUpload}
              >
                Skip
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!selectedFile || uploadBill.isPending}
              >
                {uploadBill.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Upload Bill
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
