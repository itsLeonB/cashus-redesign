import { useState, useEffect, FormEvent } from "react";
import { Loader2, Users, Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarCircle } from "./AvatarCircle";
import { cn } from "@/lib/utils";
import { useSyncParticipants, useFriendships } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ParticipantProfile {
  profileId: string;
  name: string;
  avatar?: string | null;
}

interface ParticipantSelectorProps {
  expenseId?: string;
  currentParticipants?: ParticipantProfile[];
  currentPayerId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  showSkip?: boolean;
  onSkip?: () => void;
}

export function ParticipantSelector({
  expenseId,
  currentParticipants = [],
  currentPayerId = null,
  onSuccess,
  onCancel,
  submitLabel = "Continue",
  showSkip = false,
  onSkip,
}: Readonly<ParticipantSelectorProps>) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [payerProfileId, setPayerProfileId] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { data: friendships, isLoading } = useFriendships();
  const syncParticipants = useSyncParticipants(expenseId || "");

  useEffect(() => {
    setSelectedParticipants(currentParticipants.map((p) => p.profileId));
    setPayerProfileId(currentPayerId);
  }, [currentParticipants, currentPayerId]);

  const toggleParticipant = (profileId: string) => {
    setSelectedParticipants((prev) => {
      const next = prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId];

      // If we just removed the payer from participants, clear the payer.
      if (payerProfileId === profileId && !next.includes(profileId)) {
        setPayerProfileId(null);
      }

      return next;
    });
  };

  const selectPayer = (profileId: string) => {
    setPayerProfileId(profileId);
    if (!selectedParticipants.includes(profileId)) {
      setSelectedParticipants((prev) => [...prev, profileId]);
    }
  };

  const selectableProfiles = [
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
    ...(friendships?.map((f) => ({
      profileId: f.profileId,
      profileName: f.profileName,
      profileAvatar: f.profileAvatar,
      isUser: false,
    })) || []),
  ];

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

    if (!expenseId) {
      onSuccess?.();
      return;
    }

    try {
      await syncParticipants.mutateAsync({
        participantProfileIds: selectedParticipants,
        payerProfileId,
      });
      toast({ title: "Participants updated successfully" });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectableProfiles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No friends found</p>
        <p className="text-xs">Add friends to include them in expenses</p>
      </div>
    );
  }

  const payerName = selectableProfiles.find(
    (p) => p.profileId === payerProfileId
  )?.profileName;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {selectedParticipants.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedParticipants.length} participant
          {selectedParticipants.length !== 1 && "s"} selected
          {payerName && (
            <>
              {" • "}
              Payer: {payerName}
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {showSkip && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onSkip}
          >
            Skip
          </Button>
        )}
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
