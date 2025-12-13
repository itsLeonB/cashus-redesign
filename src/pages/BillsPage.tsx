import { useState } from "react";
import { useBills } from "@/hooks/useApi";
import { AvatarCircle } from "@/components/AvatarCircle";
import { BillDetailModal } from "@/components/BillDetailModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, Upload, ChevronRight } from "lucide-react";

export default function BillsPage() {
  const { data: bills, isLoading } = useBills();
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDeleteBill = (billId: string) => {
    // TODO: Implement delete mutation
    console.log("Delete bill:", billId);
  };

  const getBillsList = () => {
    if (isLoading)
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      );

    if (bills && bills.length > 0)
      return (
        <div className="space-y-2">
          {bills.map((bill) => (
            <Card
              key={bill.id}
              className="border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => setSelectedBillId(bill.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AvatarCircle name={bill.payerProfileName} size="sm" />
                    <span className="font-medium truncate">
                      {bill.isPaidByUser ? "You" : bill.payerProfileName}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    {formatDate(bill.createdAt)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      );

    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-1">No bills uploaded</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
            Upload receipt images to keep track of your expenses
          </p>
          <Button variant="premium">
            <Upload className="h-4 w-4 mr-2" />
            Upload your first bill
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Bills</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage receipt images
          </p>
        </div>
        <Button variant="premium">
          <Upload className="h-4 w-4 mr-2" />
          Upload Bill
        </Button>
      </div>

      {getBillsList()}

      <BillDetailModal
        billId={selectedBillId}
        open={!!selectedBillId}
        onOpenChange={(open) => !open && setSelectedBillId(null)}
        onDelete={handleDeleteBill}
      />
    </div>
  );
}
