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

  // Track the last known state on the server to avoid redundant updates
  const serverIdsRef = useRef<string[]>(
    item.participants?.map((p) => p.profile.id) || []
  );

  // Helper to compare two ID arrays
  const areIdsDifferent = (idsA: string[], idsB: string[]) => {
    if (idsA.length !== idsB.length) return true;
    const setA = new Set(idsA);
    return idsB.some((id) => !setA.has(id));
  };

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

    // Ignore if the debounced state matches what we know is on the server
    if (!areIdsDifferent(debouncedSelectedIds, serverIdsRef.current)) {
      return;
    }

    const sync = async () => {
      setIsSyncing(true);
      try {
        const count = debouncedSelectedIds.length;
        const participantsRequest = debouncedSelectedIds.map((id) => ({
          profileId: id,
          share: count > 0 ? (1 / count).toFixed(4) : "0",
        }));

        await syncParticipants.mutateAsync({
          participants: participantsRequest,
        });

        // Update serverIdsRef after successful mutation to prevent immediate re-sync
        serverIdsRef.current = [...debouncedSelectedIds];
      } catch (error) {
        console.error("Failed to sync participants", error);
        toast({
          variant: "destructive",
          title: "Failed to update participants",
          description: "Could not save changes. Please try again.",
        });
      } finally {
        setIsSyncing(false);
      }
    };

    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSelectedIds]);

  // Track the most recent version of props we have processed
  const lastPropIdsRef = useRef<string[]>(
    item.participants?.map((p) => p.profile.id) || []
  );

  // Update local state if props change (e.g. from websocket or other updates)
  useEffect(() => {
    const propIds = item.participants?.map((p) => p.profile.id) || [];
    const propsChanged = areIdsDifferent(propIds, lastPropIdsRef.current);

    // Update references to current server truth
    lastPropIdsRef.current = propIds;
    serverIdsRef.current = propIds;

    // Only update local selectedIds if props actually changed from what we last processed
    // AND if we are not currently syncing/debouncing (user is idle)
    if (propsChanged && !isSyncing && selectedIds === debouncedSelectedIds) {
      setSelectedIds(propIds);
    }
  }, [item.participants, isSyncing, selectedIds, debouncedSelectedIds]);

  // Filter selectedIds against availableParticipants
  // This ensures if someone is removed from the expense, they are also removed from local item state
  useEffect(() => {
    const availableIds = new Set(availableParticipants.map((p) => p.id));
    const filtered = selectedIds.filter((id) => availableIds.has(id));

    if (filtered.length !== selectedIds.length) {
      setSelectedIds(filtered);
    }
  }, [availableParticipants, selectedIds]);

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
          if (isConfirmed && !isSelected) return null;
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
