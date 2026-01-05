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
import {
  useFriendships,
  useSyncParticipants,
  useCreateDraftExpense,
  useUploadExpenseBill,
} from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  Camera,
  PenLine,
  Receipt,
  ImageIcon,
  X,
  ArrowLeft,
  Users,
  Check,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AvatarCircle } from "./AvatarCircle";

type InputType = "upload" | "manual";
type Step = "details" | "upload" | "participants";

interface NewGroupExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewGroupExpenseModal({
  open,
  onOpenChange,
}: Readonly<NewGroupExpenseModalProps>) {
  const [description, setDescription] = useState("");
  const [inputType, setInputType] = useState<InputType>("upload");
  const [step, setStep] = useState<Step>("details");
  const [expenseId, setExpenseId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [payerProfileId, setPayerProfileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createDraft = useCreateDraftExpense();
  const uploadBill = useUploadExpenseBill();
  const { data: friendships, isLoading: friendshipsLoading } = useFriendships();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize sync participants with expenseId when available
  const syncParticipants = useSyncParticipants(expenseId || "");

  const resetModal = () => {
    setDescription("");
    setInputType("upload");
    setStep("details");
    setExpenseId(null);
    setSelectedParticipants([]);
    setPayerProfileId(null);
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
      setExpenseId(expense.id);

      if (inputType === "upload") {
        setStep("upload");
      } else {
        // Manual input - go to participants step
        setStep("participants");
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
      // After successful upload, go to participants step
      setStep("participants");
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
    // Skip bill upload, go to participants step
    setStep("participants");
  };

  const toggleParticipant = (profileId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    );

    // If removing participant who is the payer, reset payer
    if (
      payerProfileId === profileId &&
      selectedParticipants.includes(profileId)
    ) {
      setPayerProfileId(null);
    }
  };

  const selectPayer = (profileId: string) => {
    setPayerProfileId(profileId);
    // Ensure payer is also a participant
    if (!selectedParticipants.includes(profileId)) {
      setSelectedParticipants((prev) => [...prev, profileId]);
    }
  };

  const handleParticipantsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Expense ID is missing",
      });
      return;
    }

    if (!payerProfileId) {
      toast({
        variant: "destructive",
        title: "Missing payer",
        description: "Please select who paid for this expense",
      });
      return;
    }

    if (selectedParticipants.length === 0) {
      toast({
        variant: "destructive",
        title: "No participants",
        description: "Please select at least one participant",
      });
      return;
    }

    try {
      await syncParticipants.mutateAsync({
        participantProfileIds: selectedParticipants,
        payerProfileId,
      });
      toast({ title: "Participants added successfully" });
      handleOpenChange(false);
      navigate(`/expenses/${expenseId}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to add participants",
        description: err.message || "Something went wrong",
      });
    }
  };

  const handleSkipParticipants = () => {
    if (expenseId) {
      handleOpenChange(false);
      navigate(`/expenses/${expenseId}`);
    }
  };

  // Build the list of selectable profiles (user + friends)
  const selectableProfiles = [
    // Current user
    ...(user
      ? [
          {
            profileId: user.id,
            profileName: user.name,
            profileAvatar: user.avatar,
            isUser: true,
          },
        ]
      : []),
    // Friends
    ...(friendships?.map((f) => ({
      profileId: f.profileId,
      profileName: f.profileName,
      profileAvatar: f.profileAvatar,
      isUser: false,
    })) || []),
  ];

  const getStepTitle = () => {
    switch (step) {
      case "details":
        return "New Group Expense";
      case "upload":
        return "Upload Bill";
      case "participants":
        return "Add Participants";
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case "details":
        return <Receipt className="h-5 w-5 text-primary" />;
      case "upload":
        return <ImageIcon className="h-5 w-5 text-primary" />;
      case "participants":
        return <Users className="h-5 w-5 text-primary" />;
    }
  };

  const handleBack = () => {
    if (step === "upload") {
      setStep("details");
    } else if (step === "participants") {
      if (inputType === "upload") {
        setStep("upload");
      } else {
        setStep("details");
      }
    }
  };

  const participantsStepForm = () => {
    if (friendshipsLoading)
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );

    if (selectableProfiles.length === 0)
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No friends found</p>
          <p className="text-xs">Add friends to include them in expenses</p>
        </div>
      );

    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {selectableProfiles.map((profile) => {
          const isSelected = selectedParticipants.includes(profile.profileId);
          const isPayer = payerProfileId === profile.profileId;

          return (
            <div
              key={profile.profileId}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleParticipant(profile.profileId)}
                  className={cn(
                    "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground hover:border-primary"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
                <AvatarCircle
                  name={profile.profileName}
                  imageUrl={profile.profileAvatar}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium">
                    {profile.profileName}
                    {profile.isUser && (
                      <span className="text-muted-foreground ml-1">(You)</span>
                    )}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant={isPayer ? "default" : "outline"}
                size="sm"
                onClick={() => selectPayer(profile.profileId)}
                className="gap-1"
              >
                <CreditCard className="h-3 w-3" />
                {isPayer ? "Payer" : "Set as Payer"}
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            {step !== "details" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 mr-1"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {getStepIcon()}
            {getStepTitle()}
          </DialogTitle>
        </DialogHeader>

        {step === "details" && (
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
              {inputType === "upload"
                ? "Next: Upload Bill"
                : "Next: Add Participants"}
            </Button>
          </form>
        )}

        {step === "upload" && (
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

        {step === "participants" && (
          <form onSubmit={handleParticipantsSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label>Select Participants</Label>
              {participantsStepForm()}
            </div>

            {selectedParticipants.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedParticipants.length} participant
                {selectedParticipants.length !== 1 && "s"} selected
                {payerProfileId && (
                  <>
                    {" • "}
                    Payer:{" "}
                    {selectableProfiles.find(
                      (p) => p.profileId === payerProfileId
                    )?.profileName || "Unknown"}
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleSkipParticipants}
              >
                Skip
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={syncParticipants.isPending}
              >
                {syncParticipants.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Continue
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
