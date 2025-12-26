import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useGroupExpense,
  useFriendships,
  useConfirmGroupExpense,
  useDeleteGroupExpense,
} from "@/hooks/useApi";
import { useRetryBillParsing, useUploadExpenseBill } from "@/hooks/useApiV2";
import { useCalculationMethods } from "@/hooks/useMasterData";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarCircle } from "@/components/AvatarCircle";
import { ExpenseItemModal } from "@/components/ExpenseItemModal";
import { ExpenseFeeModal } from "@/components/ExpenseFeeModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Receipt,
  Calendar,
  Users,
  CheckCircle2,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Image,
  RefreshCw,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { groupExpensesApi, NewExpenseItemRequest } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { ExpenseItemResponse, OtherFeeResponse } from "@/lib/api/types";
import { statusDisplay } from "@/lib/api/v2/group-expenses";

export default function ExpenseDetailPage() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  const { data: expense, isLoading } = useGroupExpense(expenseId || "");
  const { data: friendships } = useFriendships();
  const confirmExpense = useConfirmGroupExpense();
  const deleteExpense = useDeleteGroupExpense();
  const retryBillParsing = useRetryBillParsing();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: calculationMethods } = useCalculationMethods();

  const calculationMethodDisplayByName = useMemo(() => {
    if (!calculationMethods) return {};
    return calculationMethods.reduce((acc, method) => {
      acc[method.name] = method.display;
      return acc;
    }, {} as Record<string, string>);
  }, [calculationMethods]);

  const [selectedParticipants, setSelectedParticipants] = useState<
    Record<string, string[]>
  >({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletingFeeId, setDeletingFeeId] = useState<string | null>(null);
  const [removingParticipant, setRemovingParticipant] = useState<{
    itemId: string;
    profileId: string;
  } | null>(null);

  // Item modal state
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItemResponse | null>(
    null
  );

  // Fee modal state
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<OtherFeeResponse | null>(null);

  // Bill modal state
  const [viewBillModalOpen, setViewBillModalOpen] = useState(false);
  const [retryBillModalOpen, setRetryBillModalOpen] = useState(false);
  const [uploadBillModalOpen, setUploadBillModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploadBill = useUploadExpenseBill();

  const allParticipants = useMemo(() => {
    const participants = friendships || [];
    if (!user) return participants;

    return [
      {
        profileId: user.id,
        profileName: "You",
        profileAvatar: user.avatar,
      },
      ...participants,
    ];
  }, [user, friendships]);

  const calculateItemsTotal = () => {
    if (!expense?.items) return 0;
    return expense.items?.reduce((total, item) => {
      return total + calculateItemAmount(item);
    }, 0);
  };

  const calculateFeesTotal = () => {
    if (!expense?.otherFees) return 0;
    return expense.otherFees?.reduce((total, fee) => {
      return total + Number.parseFloat(fee.amount);
    }, 0);
  };

  const calculateItemAmount = (item: NewExpenseItemRequest): number => {
    const amount = Number.parseFloat(item.amount) || 0;
    return amount * item.quantity;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "IDR",
    }).format(num);
  };

  const handleParticipantToggle = (itemId: string, profileId: string) => {
    setSelectedParticipants((prev) => {
      const current = prev[itemId] || [];
      if (current.includes(profileId)) {
        return { ...prev, [itemId]: current.filter((id) => id !== profileId) };
      }
      return { ...prev, [itemId]: [...current, profileId] };
    });
  };

  const handleConfirm = async () => {
    if (!expenseId) return;

    try {
      await confirmExpense.mutateAsync(expenseId);
      toast({
        title: "Expense confirmed",
        description:
          "The expense has been confirmed and debts have been recorded",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to confirm",
        description: err.message || "Something went wrong",
      });
    }
  };

  const handleAddParticipants = async (itemId: string) => {
    const newParticipantIds = selectedParticipants[itemId] || [];
    if (newParticipantIds.length === 0) return;

    const item = expense?.items.find((i) => i.id === itemId);
    if (!item || !expense) return;

    setIsUpdating(true);
    try {
      const existingParticipantIds =
        item.participants?.map((p) => p.profileId) || [];
      const allParticipantIds = Array.from(
        new Set([...existingParticipantIds, ...newParticipantIds])
      );

      const shareRatio = 1 / allParticipantIds.length;

      const participantRequests = allParticipantIds.map((profileId) => ({
        profileId,
        share: shareRatio.toFixed(4),
      }));

      await groupExpensesApi.updateItem(itemId, {
        id: itemId,
        groupExpenseId: expense.id,
        name: item.name,
        amount: item.amount,
        quantity: item.quantity,
        participants: participantRequests,
      });

      queryClient.invalidateQueries({
        queryKey: ["group-expenses", expenseId],
      });
      toast({
        title: "Participants added",
        description: `Added ${newParticipantIds.length} participant(s) to the item`,
      });
      setSelectedParticipants((prev) => ({ ...prev, [itemId]: [] }));
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to add participants",
        description: err.message || "Something went wrong",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!expense) return;

    setDeletingItemId(itemId);
    try {
      await groupExpensesApi.removeItem(expense.id, itemId);
      queryClient.invalidateQueries({
        queryKey: ["group-expenses", expenseId],
      });
      toast({
        title: "Item removed",
        description: "The item has been removed from the expense.",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to remove item",
        description: err.message || "Something went wrong",
      });
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    if (!expense) return;

    setDeletingFeeId(feeId);
    try {
      await groupExpensesApi.removeFee(expense.id, feeId);
      queryClient.invalidateQueries({
        queryKey: ["group-expenses", expenseId],
      });
      toast({
        title: "Fee removed",
        description: "The fee has been removed from the expense.",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to remove fee",
        description: err.message || "Something went wrong",
      });
    } finally {
      setDeletingFeeId(null);
    }
  };

  const handleRemoveParticipant = async (itemId: string, profileId: string) => {
    const item = expense?.items.find((i) => i.id === itemId);
    if (!item || !expense) return;

    setRemovingParticipant({ itemId, profileId });
    try {
      const remainingParticipants =
        item.participants?.filter((p) => p.profileId !== profileId) || [];

      if (remainingParticipants.length === 0) {
        await groupExpensesApi.updateItem(itemId, {
          id: itemId,
          groupExpenseId: expense.id,
          name: item.name,
          amount: item.amount,
          quantity: item.quantity,
          participants: [],
        });
      } else {
        const shareRatio = 1 / remainingParticipants.length;
        const participantRequests = remainingParticipants.map((p) => ({
          profileId: p.profileId,
          share: shareRatio.toFixed(4),
        }));

        await groupExpensesApi.updateItem(itemId, {
          id: itemId,
          groupExpenseId: expense.id,
          name: item.name,
          amount: item.amount,
          quantity: item.quantity,
          participants: participantRequests,
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["group-expenses", expenseId],
      });
      toast({
        title: "Participant removed",
        description: "The participant has been removed from the item",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to remove participant",
        description: err.message || "Something went wrong",
      });
    } finally {
      setRemovingParticipant(null);
    }
  };

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemModalOpen(true);
  };

  const openEditItemModal = (item: ExpenseItemResponse) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  const openAddFeeModal = () => {
    setEditingFee(null);
    setFeeModalOpen(true);
  };

  const openEditFeeModal = (fee: OtherFeeResponse) => {
    setEditingFee(fee);
    setFeeModalOpen(true);
  };

  const handleRetryBillParsing = async () => {
    if (!expenseId || !expense?.bill?.id) return;

    try {
      await retryBillParsing.mutateAsync({
        expenseId,
        billId: expense.bill.id,
      });
      setRetryBillModalOpen(false);
      toast({
        title: "Retry initiated",
        description: "Bill processing has been restarted.",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to retry",
        description: err.message || "Something went wrong",
      });
    }
  };

  const billStatusDisplay: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    PENDING: { label: "Processing...", variant: "secondary" },
    EXTRACTED: { label: "Processing...", variant: "secondary" },
    FAILED_EXTRACTING: { label: "Extraction Failed", variant: "destructive" },
    PARSED: { label: "Parsed", variant: "default" },
    FAILED_PARSING: { label: "Parsing Failed", variant: "destructive" },
    NOT_DETECTED: { label: "Not Detected", variant: "outline" },
  };

  const isRetryableStatus = (status: string) => {
    return status === "FAILED_EXTRACTING" || status === "FAILED_PARSING";
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file.",
      });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadBill = async () => {
    if (!expenseId || !selectedFile) return;

    try {
      await uploadBill.mutateAsync({ expenseId, file: selectedFile });
      setUploadBillModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({
        queryKey: ["group-expenses", expenseId],
      });
      toast({
        title: "Bill uploaded",
        description:
          "Your bill image has been uploaded and is being processed.",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.message || "Something went wrong",
      });
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Expense not found</p>
        <Link to="/expenses">
          <Button variant="link">Back to Expenses</Button>
        </Link>
      </div>
    );
  }

  const isConfirmed = expense.confirmed || expense.status === "CONFIRMED";

  const billInformationSection = () => {
    if (isConfirmed && !expense.billExists) return null;
    return (
      <>
        <div className="border-t border-border/50 my-6" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <Image className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Bill Image</p>
              {expense.billExists ? (
                <Badge
                  variant={
                    billStatusDisplay[expense.bill.status]?.variant ||
                    "secondary"
                  }
                >
                  {billStatusDisplay[expense.bill.status]?.label ||
                    expense.bill.status}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No bill uploaded
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expense.billExists ? (
              <>
                {expense.bill.imageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewBillModalOpen(true)}
                  >
                    <Image className="h-4 w-4 mr-1" />
                    View Image
                  </Button>
                )}
                {isRetryableStatus(expense.bill.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRetryBillModalOpen(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                )}
                {expense.bill.status === "NOT_DETECTED" && !isConfirmed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadBillModalOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload New
                  </Button>
                )}
              </>
            ) : (
              !isConfirmed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadBillModalOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Bill
                </Button>
              )
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back Link */}
      <Link
        to="/expenses"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Expenses
      </Link>

      {/* Expense Header */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-display font-bold">
                  {expense.description || "Untitled Expense"}
                </h1>
                <Badge variant={isConfirmed ? "default" : "secondary"}>
                  {isConfirmed && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {statusDisplay[expense.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(expense.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {expense.participants?.length || 0} participants
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-3xl font-bold tabular-nums">
                {formatCurrency(expense.totalAmount)}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {expense.payerName ? (
                  <>
                    <span>Paid by</span>
                    <AvatarCircle name={expense.payerName} size="xs" />
                    <span className="font-medium text-foreground">
                      {expense.payerName}
                    </span>
                  </>
                ) : (
                  <span>No payer yet</span>
                )}
              </div>
            </div>
          </div>

          {billInformationSection()}
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Items</CardTitle>
          {!isConfirmed && (
            <Button size="sm" variant="outline" onClick={openAddItemModal}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {expense.items?.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border/50 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} × {formatCurrency(item.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold tabular-nums">
                    {formatCurrency(
                      Number.parseFloat(item.amount) * item.quantity
                    )}
                  </p>
                  {!isConfirmed && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEditItemModal(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={deletingItemId === item.id}
                      >
                        {deletingItemId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Participants */}
              {item.participants?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Split between:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.participants?.map((participant) => {
                      const isRemoving =
                        removingParticipant?.itemId === item.id &&
                        removingParticipant?.profileId ===
                          participant.profileId;
                      return (
                        <div
                          key={participant.profileId}
                          className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1 group"
                        >
                          <AvatarCircle
                            name={participant.profileName}
                            size="xs"
                          />
                          <span className="text-sm">
                            {participant.profileName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            (
                            {formatCurrency(
                              Number.parseFloat(participant.share) *
                                Number.parseFloat(item.amount) *
                                item.quantity
                            )}
                            )
                          </span>
                          {!isConfirmed && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveParticipant(
                                  item.id,
                                  participant.profileId
                                )
                              }
                              disabled={isRemoving}
                              className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              {isRemoving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Participants (only for draft) */}
              {!isConfirmed && friendships && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">
                    Add participants:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {allParticipants.map((participant) => {
                      const isSelected = (
                        selectedParticipants[item.id] || []
                      ).includes(participant.profileId);
                      const alreadyParticipant = item.participants?.some(
                        (p) => p.profileId === participant.profileId
                      );

                      if (alreadyParticipant) return null;

                      return (
                        <button
                          key={participant.profileId}
                          type="button"
                          onClick={() =>
                            handleParticipantToggle(
                              item.id,
                              participant.profileId
                            )
                          }
                          className={cn(
                            "flex items-center gap-2 rounded-full px-3 py-1 border transition-colors",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/50 hover:border-border"
                          )}
                        >
                          <Checkbox checked={isSelected} className="h-3 w-3" />
                          <AvatarCircle
                            name={participant.profileName}
                            imageUrl={participant.profileAvatar}
                            size="xs"
                          />
                          <span className="text-sm">
                            {participant.profileName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {(selectedParticipants[item.id]?.length || 0) > 0 && (
                    <Button
                      size="sm"
                      onClick={() => handleAddParticipants(item.id)}
                      disabled={isUpdating}
                    >
                      {isUpdating && (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      )}
                      <Plus className="h-3 w-3 mr-1" />
                      Add {selectedParticipants[item.id]?.length} participant(s)
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {expense.items?.length < 1 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No items yet.</p>
              {!isConfirmed && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={openAddItemModal}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add your first item
                </Button>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Other Fees */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Additional Fees</CardTitle>
          {!isConfirmed && (
            <Button size="sm" variant="outline" onClick={openAddFeeModal}>
              <Plus className="h-4 w-4 mr-1" />
              Add Fee
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {expense.otherFees?.length > 0 ? (
            <div className="space-y-2">
              {expense.otherFees?.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{fee.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {calculationMethodDisplayByName[fee.calculationMethod]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(fee.amount)}
                    </span>
                    {!isConfirmed && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditFeeModal(fee)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteFee(fee.id)}
                          disabled={deletingFeeId === fee.id}
                        >
                          {deletingFeeId === fee.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No additional fees.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">
                {formatCurrency(calculateItemsTotal())}
              </span>
            </div>
            {expense.otherFees?.length > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Fees</span>
                <span className="tabular-nums">
                  {formatCurrency(calculateFeesTotal())}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-border/50">
              <span>Total</span>
              <span className="tabular-nums">
                {formatCurrency(expense.totalAmount)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-6">
            {expense.status === "READY" && (
              <Button
                className="w-full"
                size="lg"
                onClick={handleConfirm}
                disabled={confirmExpense.isPending || deleteExpense.isPending}
              >
                {confirmExpense.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm & Record Debts
              </Button>
            )}
            {!isConfirmed && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    size="lg"
                    disabled={
                      deleteExpense.isPending || confirmExpense.isPending
                    }
                  >
                    {deleteExpense.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Expense
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this expense? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={async () => {
                        if (!expenseId) return;
                        try {
                          await deleteExpense.mutateAsync(expenseId);
                          toast({
                            title: "Expense deleted",
                            description:
                              "The expense has been deleted successfully.",
                          });
                          navigate("/expenses");
                        } catch (error: unknown) {
                          const err = error as { message?: string };
                          toast({
                            variant: "destructive",
                            title: "Failed to delete",
                            description: err.message || "Something went wrong",
                          });
                        }
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Item Modal */}
      <ExpenseItemModal
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        expenseId={expenseId || ""}
        item={editingItem}
      />

      {/* Fee Modal */}
      <ExpenseFeeModal
        open={feeModalOpen}
        onOpenChange={setFeeModalOpen}
        expenseId={expenseId || ""}
        fee={editingFee}
      />

      {/* View Bill Image Modal */}
      <Dialog open={viewBillModalOpen} onOpenChange={setViewBillModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bill Image</DialogTitle>
          </DialogHeader>
          {expense?.bill?.imageUrl && (
            <div className="flex items-center justify-center">
              <img
                src={expense.bill.imageUrl}
                alt="Bill"
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Retry Bill Parsing Confirmation Modal */}
      <AlertDialog
        open={retryBillModalOpen}
        onOpenChange={setRetryBillModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Retry Bill Processing
            </AlertDialogTitle>
            <AlertDialogDescription>
              The bill processing seems to have failed. Would you like to retry
              processing the bill image? This will attempt to parse the bill
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRetryBillParsing}
              disabled={retryBillParsing.isPending}
            >
              {retryBillParsing.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Retry Processing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Bill Modal */}
      <AlertDialog
        open={uploadBillModalOpen}
        onOpenChange={(open) => {
          setUploadBillModalOpen(open);
          if (!open) clearFile();
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Upload Bill Image
            </AlertDialogTitle>
            <AlertDialogDescription>
              Uploading a bill image will trigger automatic parsing. If
              successful, this may overwrite existing items with the parsed
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-contain rounded-lg border border-border"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileSelect(file);
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileSelect(file);
                  };
                  input.click();
                }}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop an image, or click to select
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={clearFile}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUploadBill}
              disabled={!selectedFile || uploadBill.isPending}
            >
              {uploadBill.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Upload Bill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
