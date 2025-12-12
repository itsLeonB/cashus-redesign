import { useBills } from "@/hooks/useApi";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, Trash2, Upload } from "lucide-react";

export default function BillsPage() {
  const { data: bills, isLoading } = useBills();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getBillsGrid = () => {
    if (isLoading)
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {new Array(6).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      );

    if (bills?.length > 0)
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bills.map((bill) => (
            <Card
              key={bill.id}
              className="border-border/50 overflow-hidden group"
            >
              <div className="aspect-[3/4] relative bg-muted">
                <img
                  src={bill.imageUrl}
                  alt="Bill"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <AvatarCircle name={bill.payerProfileName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {bill.payerProfileName}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(bill.createdAt)}
                    </p>
                  </div>
                </div>
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
      {getBillsGrid()}
    </div>
  );
}
