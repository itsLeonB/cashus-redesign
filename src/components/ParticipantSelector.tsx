import { useState, useEffect, SubmitEventHandler } from "react";
import { Loader2, Users, Check, CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarCircle } from "./AvatarCircle";
import { InlineAnonymousFriendForm } from "./InlineAnonymousFriendForm";
import { cn } from "@/lib/utils";
import { useSyncParticipants, useFriendships } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface ParticipantProfile {
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

const EMPTY_PARTICIPANTS: ParticipantProfile[] = [];

export function ParticipantSelector({
  expenseId,
  currentParticipants = EMPTY_PARTICIPANTS,
  currentPayerId = null,
  onSuccess,
  onCancel,
  submitLabel = "Continue",
  showSkip = false,
  onSkip,
}: Readonly<ParticipantSelectorProps>) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    () => currentParticipants.map((p) => p.profileId),
  );
  const [payerProfileId, setPayerProfileId] = useState<string | null>(
    currentPayerId,
  );
  const [showAddForm, setShowAddForm] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const { data: friendships, isLoading, refetch } = useFriendships();
  const syncParticipants = useSyncParticipants(expenseId || "");

  const handleAnonymousFriendCreated = async (profileId: string) => {
    await refetch();
    setSelectedParticipants((prev) => [...prev, profileId]);
    setShowAddForm(false);
  };

  useEffect(() => {
    setSelectedParticipants(currentParticipants.map((p) => p.profileId));
    setPayerProfileId(currentPayerId);
    // We intentionally only want to re-initialize when the expenseId changes.
    // currentParticipants and currentPayerId are omitted because they often
    // change references in the parent on every render, which would reset user selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseId]);

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

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
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

  const participantsList = () => {
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
      (p) => p.profileId === payerProfileId,
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
                    : "border-border hover:border-primary/50",
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
                        : "border-muted-foreground hover:border-primary",
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
                        <span className="text-muted-foreground ml-1">
                          (You)
                        </span>
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
  };

  return (
    <>
      {showAddForm ? (
        <InlineAnonymousFriendForm
          onCreated={handleAnonymousFriendCreated}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-3 w-full p-3 rounded-lg border border-dashed border-muted-foreground/50 hover:border-primary/50 hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
        >
          <div className="h-5 w-5 rounded border border-dashed border-current flex items-center justify-center">
            <Plus className="h-3 w-3" />
          </div>
          <span className="text-sm">Create new friend</span>
        </button>
      )}
      {participantsList()}
    </>
  );
}
