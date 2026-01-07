import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useGroupExpense,
  useConfirmGroupExpense,
  useDeleteGroupExpense,
  useUploadExpenseBill,
  useTriggerBillParsing,
} from "@/hooks/useApi";
import { useCalculationMethods } from "@/hooks/useMasterData";
import { AvatarCircle } from "@/components/AvatarCircle";
import { ExpenseItemModal } from "@/components/ExpenseItemModal";
import { ExpenseFeeModal } from "@/components/ExpenseFeeModal";
import { ItemParticipantManager } from "@/components/ItemParticipantManager";
import { ParticipantSelectorModal } from "@/components/ParticipantSelectorModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  groupExpensesApi,
  NewExpenseItemRequest,
  statusDisplay,
} from "@/lib/api";
import type {
  ExpenseItemResponse,
  OtherFeeResponse,
  ExpenseConfirmationResponse,
} from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";

export default function ExpenseDetailPage() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  const { data: expense, isLoading } = useGroupExpense(expenseId || "");
  const confirmExpense = useConfirmGroupExpense(expenseId);
  const deleteExpense = useDeleteGroupExpense();
  const triggerBillParsing = useTriggerBillParsing(expenseId || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: calculationMethods } = useCalculationMethods();

  const calculationMethodDisplayByName = useMemo(() => {
    if (!calculationMethods) return {};
    return calculationMethods.reduce((acc, method) => {
      acc[method.name] = method.display;
      return acc;
    }, {} as Record<string, string>);
  }, [calculationMethods]);

  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletingFeeId, setDeletingFeeId] = useState<string | null>(null);

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

  // Participant modal state
  const [participantModalOpen, setParticipantModalOpen] = useState(false);

  // Confirm dry-run modal state
  const [confirmPreviewModalOpen, setConfirmPreviewModalOpen] = useState(false);
  const [dryRunResult, setDryRunResult] =
    useState<ExpenseConfirmationResponse | null>(null);
  const [isDryRunLoading, setIsDryRunLoading] = useState(false);

  const uploadBill = useUploadExpenseBill();

  const participantProfiles = (expense?.participants || []).map(
    (p) => p.profile
  );

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

  const handleConfirmDryRun = async () => {
    if (!expenseId) return;

    setIsDryRunLoading(true);
    try {
      const result = await confirmExpense.mutateAsync(true);
      setDryRunResult(result);
      setConfirmPreviewModalOpen(true);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to preview",
        description: err.message || "Something went wrong",
      });
    } finally {
      setIsDryRunLoading(false);
    }
  };

  const handleConfirmFinal = async () => {
    if (!expenseId) return;

    try {
      await confirmExpense.mutateAsync(false);
      setConfirmPreviewModalOpen(false);
      setDryRunResult(null);
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
      await triggerBillParsing.mutateAsync(expense.bill.id);
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

  const isConfirmed = expense.status === "CONFIRMED";
  const isReady = expense.status === "READY";

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

  const otherFeeSection = () => {
    if (isConfirmed && (expense.otherFees?.length || 0) === 0) return null;
    return (
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
                {expense.payer.name ? (
                  <>
                    <span>Paid by</span>
                    <AvatarCircle
                      name={expense.payer.name}
                      imageUrl={expense.payer.avatar}
                      size="xs"
                    />
                    <span className="font-medium text-foreground">
                      {expense.payer.name}
                    </span>
                  </>
                ) : (
                  <span>No payer yet</span>
                )}
                {!isConfirmed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setParticipantModalOpen(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
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

              <div className="mt-4">
                <ItemParticipantManager
                  item={item}
                  expenseId={expense.id}
                  availableParticipants={participantProfiles}
                  isConfirmed={isConfirmed}
                />
              </div>
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

      {otherFeeSection()}

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
            {!isConfirmed && (
              <>
                <Button
                  className="w-full"
                  size={isReady ? "lg" : "default"}
                  onClick={handleConfirmDryRun}
                  disabled={
                    !isReady ||
                    isDryRunLoading ||
                    confirmExpense.isPending ||
                    deleteExpense.isPending
                  }
                >
                  {isDryRunLoading && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {isReady && !isDryRunLoading && (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {isReady
                    ? "Confirm & Record Debts"
                    : "Please assign participants to all items before confirming"}
                </Button>
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
                        Are you sure you want to delete this expense? This
                        action cannot be undone.
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
                              description:
                                err.message || "Something went wrong",
                            });
                          }
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
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
              disabled={triggerBillParsing.isPending}
            >
              {triggerBillParsing.isPending && (
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

      {/* Participant Selector Modal */}
      <ParticipantSelectorModal
        open={participantModalOpen}
        onOpenChange={setParticipantModalOpen}
        expenseId={expense.id}
        currentParticipants={expense.participants?.map((p) => ({
          profileId: p.profile.id,
          name: p.profile.name,
          avatar: p.profile.avatar,
        }))}
        currentPayerId={expense.payer?.id}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["group-expenses", expenseId],
          });
        }}
      />

      {/* Confirm Preview Modal */}
      <Dialog
        open={confirmPreviewModalOpen}
        onOpenChange={(open) => {
          if (!confirmExpense.isPending) {
            setConfirmPreviewModalOpen(open);
            if (!open) setDryRunResult(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Confirm Expense
            </DialogTitle>
          </DialogHeader>

          {/* Header Summary */}
          <div className="space-y-1 pb-3 border-b border-border/50">
            <p className="font-semibold text-lg">
              {dryRunResult?.description || "Expense"}
            </p>
            <p className="text-sm text-muted-foreground">
              Total: {formatCurrency(dryRunResult?.totalAmount || 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              Paid by {dryRunResult?.payer.name}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Clicking continue will record the following debts:
          </p>

          {/* Per-Participant Breakdown */}
          {dryRunResult?.participants &&
          dryRunResult.participants.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {dryRunResult.participants.map((participant) => {
                const isPayer =
                  participant.profile.id === dryRunResult.payer.id;
                const isCurrentUser = participant.profile.isUser;

                return (
                  <div
                    key={participant.profile.id}
                    className={`rounded-lg border p-4 space-y-3 ${
                      isCurrentUser
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 bg-muted/30"
                    }`}
                  >
                    {/* Participant Header */}
                    <div className="flex items-center gap-2">
                      <AvatarCircle
                        name={participant.profile.name}
                        imageUrl={participant.profile.avatar}
                        size="sm"
                      />
                      <span className="font-medium">
                        {participant.profile.name}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (You)
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Items Breakdown */}
                    {participant.items && participant.items.length > 0 && (
                      <div className="space-y-1.5 text-sm">
                        {participant.items.map((item) => {
                          const isNegative =
                            parseFloat(item.shareAmount) < 0;
                          return (
                            <div
                              key={item.id}
                              className="flex justify-between items-start"
                            >
                              <span className="text-muted-foreground">
                                {item.name}
                              </span>
                              <span
                                className={`tabular-nums text-right ${
                                  isNegative
                                    ? "text-green-600 dark:text-green-400"
                                    : ""
                                }`}
                              >
                                {formatCurrency(item.baseAmount)} →{" "}
                                {formatCurrency(item.shareAmount)}{" "}
                                <span className="text-xs text-muted-foreground">
                                  ({item.shareRate})
                                </span>
                              </span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between pt-1 border-t border-border/30">
                          <span className="text-muted-foreground">
                            Items subtotal
                          </span>
                          <span className="tabular-nums font-medium">
                            {formatCurrency(participant.itemsTotal)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Fees Breakdown */}
                    {participant.fees && participant.fees.length > 0 && (
                      <div className="space-y-1.5 text-sm">
                        {participant.fees.map((fee) => {
                          const isNegative =
                            parseFloat(fee.shareAmount) < 0;
                          return (
                            <div
                              key={fee.id}
                              className="flex justify-between items-start"
                            >
                              <span className="text-muted-foreground">
                                {fee.name}
                              </span>
                              <span
                                className={`tabular-nums text-right ${
                                  isNegative
                                    ? "text-green-600 dark:text-green-400"
                                    : ""
                                }`}
                              >
                                {formatCurrency(fee.baseAmount)} →{" "}
                                {formatCurrency(fee.shareAmount)}{" "}
                                <span className="text-xs text-muted-foreground">
                                  ({fee.shareRate})
                                </span>
                              </span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between pt-1 border-t border-border/30">
                          <span className="text-muted-foreground">
                            Fees subtotal
                          </span>
                          <span className="tabular-nums font-medium">
                            {formatCurrency(participant.feesTotal)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Participant Total & Settlement */}
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="tabular-nums">
                          {formatCurrency(participant.total)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isPayer ? (
                          <span className="text-primary font-medium">
                            Paid the bill
                          </span>
                        ) : (
                          <>
                            Owes {dryRunResult.payer.name}{" "}
                            <span className="font-medium text-foreground">
                              {formatCurrency(participant.total)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No participants found
            </p>
          )}

          {/* Final Cross-Check Summary */}
          {dryRunResult?.participants &&
            dryRunResult.participants.length > 0 && (
              <div className="pt-3 border-t border-border/50 space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Summary
                </p>
                <div className="space-y-1 text-sm">
                  {dryRunResult.participants.map((p) => (
                    <div
                      key={p.profile.id}
                      className="flex justify-between"
                    >
                      <span className="text-muted-foreground">
                        {p.profile.name}
                      </span>
                      <span className="tabular-nums">
                        {formatCurrency(p.total)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t border-border/50 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(dryRunResult?.totalAmount || 0)}
                  </span>
                </div>
              </div>
            )}

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setConfirmPreviewModalOpen(false);
                setDryRunResult(null);
              }}
              disabled={confirmExpense.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmFinal}
              disabled={confirmExpense.isPending}
            >
              {confirmExpense.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
