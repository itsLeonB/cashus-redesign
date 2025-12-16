import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFriendships, useUploadBill } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";

interface UploadBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadBillModal({ open, onOpenChange }: UploadBillModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: friendships } = useFriendships();
  const uploadBill = useUploadBill();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [payerId, setPayerId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const allPayers = [
    ...(user ? [{ profileId: user.id, profileName: "You", profileAvatar: user.avatar }] : []),
    ...(friendships || []),
  ];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !payerId) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please select a file and payer",
      });
      return;
    }

    try {
      await uploadBill.mutateAsync({ payerProfileId: payerId, file: selectedFile });
      toast({
        title: "Bill uploaded",
        description: "Your bill has been uploaded successfully",
      });
      onOpenChange(false);
      clearFile();
      setPayerId("");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.message || "Something went wrong",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Bill
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payer Selection */}
          <div className="space-y-2">
            <Label>Who paid this bill?</Label>
            <Select value={payerId} onValueChange={setPayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select payer" />
              </SelectTrigger>
              <SelectContent>
                {allPayers.map((payer) => (
                  <SelectItem key={payer.profileId} value={payer.profileId}>
                    <div className="flex items-center gap-2">
                      <AvatarCircle
                        name={payer.profileName}
                        imageUrl={payer.profileAvatar}
                        size="xs"
                      />
                      <span>{payer.profileName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
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
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                `}
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || !payerId || uploadBill.isPending}
            >
              {uploadBill.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Upload Bill
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
