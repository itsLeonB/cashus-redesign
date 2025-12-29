import { useState, useEffect, useRef } from "react";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useSyncItemParticipants } from "@/hooks/useApi";
import type { ExpenseItemResponse, SimpleProfile } from "@/lib/api/types";
import { toast } from "@/hooks/use-toast";

interface ItemParticipantManagerProps {
  item: ExpenseItemResponse;
  expenseId: string;
  availableParticipants: SimpleProfile[];
  isConfirmed: boolean;
}

export function ItemParticipantManager({
  item,
  expenseId,
  availableParticipants,
  isConfirmed,
}: Readonly<ItemParticipantManagerProps>) {
  const syncParticipants = useSyncItemParticipants(expenseId, item.id);

  // Initialize state from props
  const [selectedIds, setSelectedIds] = useState<string[]>(
    item.participants?.map((p) => p.profile.id) || []
  );

  const [isSyncing, setIsSyncing] = useState(false);

  // Debounce the selection
  const debouncedSelectedIds = useDebounce(selectedIds, 500);

  // Track if this is the initial render to avoid syncing on mount
  const isFirstRender = useRef(true);

  // Toggle handler
  const handleToggle = (profileId: string) => {
    if (isConfirmed) return;

    setSelectedIds((prev) => {
      if (prev.includes(profileId)) {
        return prev.filter((id) => id !== profileId);
      }
      return [...prev, profileId];
    });
  };

  // Effect to sync when debounced value changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const sync = async () => {
      setIsSyncing(true);
      try {
        const count = debouncedSelectedIds.length;
        // If count is 0, we send empty list.
        // If count > 0, share is 1/count.

        const participantsRequest = debouncedSelectedIds.map((id) => ({
          profileId: id,
          share: count > 0 ? (1 / count).toFixed(4) : "0",
        }));

        await syncParticipants.mutateAsync({
          participants: participantsRequest,
        });
      } catch (error) {
        console.error("Failed to sync participants", error);
        toast({
          variant: "destructive",
          title: "Failed to update participants",
          description: "Could not save changes. Please try again.",
        });
        // Revert state? complicate UI. Let's just notify.
      } finally {
        setIsSyncing(false);
      }
    };

    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSelectedIds]);

  // Update local state if props change (e.g. from websocket or other updates),
  // but ONLY if we are not currently debouncing a local change.
  // This is tricky. Simplified: Just update if item.participants changes significantly?
  // For now, let's keep it simple and trust local state dominates user interaction.

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Split between:</p>
        {isSyncing && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {availableParticipants.map((participant) => {
          const isSelected = selectedIds.includes(participant.id);
          return (
            <button
              key={participant.id}
              type="button"
              disabled={isConfirmed}
              onClick={() => handleToggle(participant.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1 border transition-colors",
                isSelected && "border-primary bg-primary/10 text-primary",
                !isSelected &&
                  isConfirmed &&
                  "border-border/50 opacity-50 cursor-not-allowed",
                !isSelected &&
                  !isConfirmed &&
                  "border-border/50 hover:border-border"
              )}
            >
              {!isConfirmed && (
                <Checkbox
                  checked={isSelected}
                  className="h-3 w-3 pointer-events-none"
                />
              )}
              <AvatarCircle
                name={participant.name}
                imageUrl={participant.avatar}
                size="xs"
              />
              <span className="text-sm">
                {participant.isUser ? "You" : participant.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
