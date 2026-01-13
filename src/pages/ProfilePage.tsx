import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import { useTransferMethods } from "@/hooks/useApi";
import { AddTransferMethodModal } from "@/components/AddTransferMethodModal";
import { TransferMethodsList } from "@/components/TransferMethodsList";
import {
  User,
  Mail,
  Calendar,
  Edit2,
  Save,
  Loader2,
  LogOut,
  KeyRound,
  Plus,
  CreditCard,
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [addMethodModalOpen, setAddMethodModalOpen] = useState(false);
  const { toast } = useToast();

  const {
    data: transferMethods,
    isLoading: isLoadingTransferMethods,
  } = useTransferMethods();

  const handleResetPassword = async () => {
    if (!user?.email) return;

    setIsResettingPassword(true);
    try {
      await authApi.forgotPassword(user.email);
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to send reset email",
        description: err.message || "Something went wrong",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await authApi.updateProfile(name);
      await refreshUser();
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your name has been updated successfully",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const cardButtonDisplay = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;

    if (isEditing)
      return (
        <>
          <Save className="h-4 w-4 mr-2" />
          Save
        </>
      );

    return (
      <>
        <Edit2 className="h-4 w-4 mr-2" />
        Edit
      </>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile Card */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-4">
            <AvatarCircle
              name={user?.name || "User"}
              imageUrl={user?.avatar}
              size="lg"
            />
            <div className="flex-1">
              <CardTitle className="font-display">{user?.name}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isLoading}
            >
              {cardButtonDisplay()}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Display Name
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted/30 rounded-lg">
                  {user?.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </Label>
              <p className="text-sm py-2 px-3 bg-muted/30 rounded-lg text-muted-foreground">
                {user?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Member Since
              </Label>
              <p className="text-sm py-2 px-3 bg-muted/30 rounded-lg text-muted-foreground">
                {user?.createdAt ? formatDate(user.createdAt) : "Unknown"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Methods */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transfer Methods
              </CardTitle>
              <CardDescription>
                Your saved payment methods for receiving money
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddMethodModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TransferMethodsList
            methods={transferMethods}
            isLoading={isLoadingTransferMethods}
          />
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display">Security</CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reset Password</p>
              <p className="text-sm text-muted-foreground">
                Send a password reset link to your email
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleResetPassword}
              disabled={isResettingPassword}
            >
              {isResettingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="h-4 w-4 mr-2" />
              )}
              Reset Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive font-display">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign out</p>
              <p className="text-sm text-muted-foreground">
                Sign out from your account on this device
              </p>
            </div>
            <Button variant="destructive" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Transfer Method Modal */}
      <AddTransferMethodModal
        open={addMethodModalOpen}
        onOpenChange={setAddMethodModalOpen}
      />
    </div>
  );
}
