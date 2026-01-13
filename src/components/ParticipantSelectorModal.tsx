import { useState, useEffect, FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFriendships, useSyncParticipants } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Users, Check, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AvatarCircle } from "./AvatarCircle";

interface ParticipantProfile {
  profileId: string;
  name: string;
  avatar?: string | null;
}

interface ParticipantSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string;
  currentParticipants?: ParticipantProfile[];
  currentPayerId?: string | null;
  onSuccess?: () => void;
}

export function ParticipantSelectorModal({
  open,
  onOpenChange,
  expenseId,
  currentParticipants = [],
  currentPayerId = null,
  onSuccess,
}: Readonly<ParticipantSelectorModalProps>) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [payerProfileId, setPayerProfileId] = useState<string | null>(null);

  const { data: friendships, isLoading: friendshipsLoading } = useFriendships();
  const { user } = useAuth();
  const { toast } = useToast();
  const syncParticipants = useSyncParticipants(expenseId);

  // Initialize state when modal opens or current data changes
  useEffect(() => {
    if (open) {
      setSelectedParticipants(currentParticipants.map((p) => p.profileId));
      setPayerProfileId(currentPayerId);
    }
  }, [open, currentParticipants, currentPayerId]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

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
      toast({ title: "Participants updated successfully" });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to update participants",
        description: err.message || "Something went wrong",
      });
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

  const formInputs = () => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Edit Participants
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formInputs()}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={
                syncParticipants.isPending ||
                selectedParticipants.length === 0 ||
                !payerProfileId
              }
            >
              {syncParticipants.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Participants
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
