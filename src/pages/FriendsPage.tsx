import { useState, useMemo } from "react";
import {
  useFriendships,
  useFriendRequests,
  useSearchProfiles,
  useCreateAnonymousFriend,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useIgnoreFriendRequest,
  useCancelFriendRequest,
  useDebts,
} from "@/hooks/useApi";
import { AvatarCircle } from "@/components/AvatarCircle";
import { AmountDisplay } from "@/components/AmountDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  UserPlus,
  Users,
  UserCheck,
  Clock,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [anonymousName, setAnonymousName] = useState("");
  const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());

  const { data: friendships, isLoading } = useFriendships();
  const { data: debts } = useDebts();
  const { sent, received } = useFriendRequests();
  const { data: searchResults, isLoading: searching } =
    useSearchProfiles(searchQuery);
  const createAnonymousFriend = useCreateAnonymousFriend();
  const sendFriendRequest = useSendFriendRequest();
  const acceptFriendRequest = useAcceptFriendRequest();
  const ignoreFriendRequest = useIgnoreFriendRequest();
  const cancelFriendRequest = useCancelFriendRequest();
  const { toast } = useToast();

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    debts?.forEach((debt) => {
      const amount = Number.parseFloat(debt.amount);
      const current = map.get(debt.profileId) || 0;
      const change = debt.type === "CREDIT" ? amount : -amount;
      map.set(debt.profileId, current + change);
    });
    return map;
  }, [debts]);

  const filteredFriends = friendships?.filter((f) =>
    f.profileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAnonymous = async () => {
    if (!anonymousName.trim()) return;

    try {
      await createAnonymousFriend.mutateAsync({ name: anonymousName });
      toast({
        title: "Friend added",
        description: `${anonymousName} has been added to your friends`,
      });
      setAnonymousName("");
      setAddDialogOpen(false);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to add friend",
        description: err.message || "Something went wrong",
      });
    }
  };

  const handleSendFriendRequest = async (profileId: string) => {
    setPendingRequestIds((prev) => new Set(prev).add(profileId));
    try {
      await sendFriendRequest.mutateAsync(profileId);
      toast({
        title: "Request sent",
        description: "Friend request has been sent",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to send request",
        description: err.message || "Something went wrong",
      });
    } finally {
      setPendingRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(profileId);
        return next;
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest.mutateAsync(requestId);
      toast({
        title: "Request accepted",
        description: "You are now friends",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to accept request",
        description: err.message || "Something went wrong",
      });
    }
  };

  const handleIgnoreRequest = async (requestId: string) => {
    try {
      await ignoreFriendRequest.mutateAsync(requestId);
      toast({
        title: "Request ignored",
        description: "The request has been removed",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to ignore request",
        description: err.message || "Something went wrong",
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelFriendRequest.mutateAsync(requestId);
      toast({
        title: "Request cancelled",
        description: "The request has been cancelled",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to cancel request",
        description: err.message || "Something went wrong",
      });
    }
  };

  const pendingCount = received.data?.length || 0;

  const allFriendsTabContent = () => {
    if (isLoading)
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {new Array(6).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      );

    if (filteredFriends?.length > 0)
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFriends.map((friendship) => (
            <Link key={friendship.id} to={`/friends/${friendship.id}`}>
              <Card className="border-border/50 hover:border-border transition-colors h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AvatarCircle
                      name={friendship.profileName}
                      imageUrl={friendship.profileAvatar}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {friendship.profileName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {friendship.type === "ANON" ? (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            Anonymous
                          </span>
                        ) : (
                          <span className="text-xs text-success flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            Connected
                          </span>
                        )}
                      </div>
                    </div>
                    <AmountDisplay
                      amount={balances.get(friendship.profileId) || 0}
                      size="md"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      );

    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">No friends yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Add friends to start tracking expenses together
          </p>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add your first friend
          </Button>
        </CardContent>
      </Card>
    );
  };

  const receivedRequestsTabContent = () => {
    if (received.isLoading)
      return (
        <div className="space-y-3">
          {new Array(2).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      );

    if (received?.data?.length > 0)
      return (
        <div className="space-y-3">
          {received.data.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
            >
              <AvatarCircle
                name={request.fromProfile.name}
                imageUrl={request.fromProfile.avatarUrl}
                size="md"
              />
              <div className="flex-1">
                <p className="font-medium">{request.fromProfile.name}</p>
                <p className="text-xs text-muted-foreground">
                  Sent {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleIgnoreRequest(request.id)}
                  disabled={ignoreFriendRequest.isPending}
                >
                  {ignoreFriendRequest.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Ignore"
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAcceptRequest(request.id)}
                  disabled={acceptFriendRequest.isPending}
                >
                  {acceptFriendRequest.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Accept"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      );

    return (
      <p className="text-center text-muted-foreground py-8">
        No pending requests
      </p>
    );
  };

  const sentRequestsTabContent = () => {
    if (sent?.isLoading)
      return (
        <div className="space-y-3">
          {new Array(2).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      );

    if (sent?.data?.length > 0)
      return (
        <div className="space-y-3">
          {sent.data.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
            >
              <AvatarCircle
                name={request.toProfile.name}
                imageUrl={request.toProfile.avatarUrl}
                size="md"
              />
              <div className="flex-1">
                <p className="font-medium">{request.toProfile.name}</p>
                <p className="text-xs text-muted-foreground">
                  Pending since{" "}
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleCancelRequest(request.id)}
                disabled={cancelFriendRequest.isPending}
              >
                {cancelFriendRequest.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Cancel"
                )}
              </Button>
            </div>
          ))}
        </div>
      );

    return (
      <p className="text-center text-muted-foreground py-8">No sent requests</p>
    );
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            Friends
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your connections and track balances
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="premium">
              <Plus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Add a Friend</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="anonymous" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="anonymous">Anonymous</TabsTrigger>
                <TabsTrigger value="search">Search Users</TabsTrigger>
              </TabsList>
              <TabsContent value="anonymous" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Create a friend profile for someone who isn't on Cashus yet
                </p>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter friend's name"
                    value={anonymousName}
                    onChange={(e) => setAnonymousName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateAnonymous}
                    disabled={
                      !anonymousName.trim() || createAnonymousFriend.isPending
                    }
                  >
                    {createAnonymousFriend.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Add Friend
                  </Button>
                </DialogFooter>
              </TabsContent>
              <TabsContent value="search" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or username..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {searching && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {searchResults && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50"
                      >
                        <AvatarCircle
                          name={profile.name}
                          imageUrl={profile.avatarUrl}
                          size="sm"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{profile.name}</p>
                          {profile.email && (
                            <p className="text-xs text-muted-foreground">
                              {profile.email}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendFriendRequest(profile.id)}
                          disabled={pendingRequestIds.has(profile.id)}
                        >
                          {pendingRequestIds.has(profile.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 &&
                  !searching &&
                  searchResults?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No users found
                    </p>
                  )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search friends..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            All Friends
            {friendships && (
              <span className="text-xs bg-muted px-1.5 rounded">
                {friendships.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="h-4 w-4" />
            Requests
            {pendingCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground px-1.5 rounded">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {allFriendsTabContent()}
        </TabsContent>

        <TabsContent value="requests" className="mt-6 space-y-6">
          {/* Received Requests */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">
                Received Requests
              </CardTitle>
            </CardHeader>
            <CardContent>{receivedRequestsTabContent()}</CardContent>
          </Card>

          {/* Sent Requests */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">
                Sent Requests
              </CardTitle>
            </CardHeader>
            <CardContent>{sentRequestsTabContent()}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
