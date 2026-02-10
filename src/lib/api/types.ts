// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  passwordConfirmation: string;
}

export interface TokenResponse {
  type: string;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// User Profile
export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  email?: string;
  createdAt: string;
}

// Friendship Types
export interface FriendshipResponse {
  id: string;
  type: "ANON" | "REAL";
  profileId: string;
  profileName: string; // Used to be friendProfile.name
  profileAvatar?: string;
  balance?: number; // Calculated on frontend or separate? Legacy has no balance in FriendshipResponse
  createdAt: string;
}

export interface FriendProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  isAnonymous: boolean;
  email?: string;
}

export interface FriendDetailsResponse {
  friend: FriendDetails;
  balance: FriendBalance;
  redirectToRealFriendship?: string;
}

export interface FriendDetails {
  id: string;
  profileId: string;
  name: string;
  type: "ANON" | "REAL";
  email?: string; // Only for registered friends
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface FriendBalance {
  netBalance: string;
  totalLentToFriend: string;
  totalBorrowedFromFriend: string;
  transactionHistory: FriendTransaction[];
  currencyCode: string;
}

export interface FriendTransaction {
  id: string;
  type: "LENT" | "BORROWED";
  amount: string;
  transferMethod: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewAnonymousFriendshipRequest {
  name: string;
}

// Debt Transaction Types
export type DebtDirection = "INCOMING" | "OUTGOING";

export interface DebtTransactionResponse {
  id: string;
  profile: SimpleProfile;
  type: "LENT" | "BORROWED";
  amount: string;
  transferMethod: string;
  description: string;
  createdAt: string;
}

export interface NewDebtTransactionRequest {
  friendProfileId: string;
  direction: DebtDirection;
  amount: number;
  transferMethodId: string;
  description?: string;
}

export interface TransferMethod {
  id: string;
  name: string;
  display: string;
  iconUrl: string;
  parentId: string;
}

export interface ProfileTransferMethod {
  id: string;
  method: TransferMethod;
  accountName: string;
  accountNumber: string;
}

export interface NewProfileTransferMethod {
  transferMethodId: string;
  accountName: string;
  accountNumber: string;
}

export interface SimpleProfile {
  id: string;
  name: string;
  avatar: string;
  isUser: boolean;
}

// Expense Ownership Types
export type ExpenseOwnership = "OWNED" | "PARTICIPATING";

// Group Expense Types
export interface GroupExpenseResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  totalAmount: string;
  itemsTotalAmount: string;
  feesTotalAmount: string;
  description?: string;
  status: "DRAFT" | "READY" | "CONFIRMED";
  isPreviewable: boolean;

  // Relationships
  payer: SimpleProfile;
  creator: SimpleProfile;
  items: ExpenseItemResponse[];
  otherFees?: OtherFeeResponse[];
  participants?: ExpenseParticipantResponse[];
  bill: ExpenseBillResponse;
  billExists: boolean;

  confirmationPreview: ExpenseConfirmationResponse;
}

export const statusDisplay = {
  DRAFT: "Draft",
  READY: "Ready to Confirm",
  CONFIRMED: "Confirmed",
};

export interface ExpenseItemResponse {
  id: string;
  groupExpenseId: string;
  name: string;
  amount: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  participants: ItemParticipantResponse[];
}

export interface ItemParticipantResponse {
  profile: SimpleProfile;
  shareRatio: string;
  weight: number;
}

export interface OtherFeeResponse {
  id: string;
  name: string;
  amount: string;
  calculationMethod: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ExpenseParticipantResponse {
  profile: SimpleProfile;
  shareAmount: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: string;
  quantity: number;
  participants: ItemParticipant[];
}

export interface ItemParticipant {
  profileId: string;
  profile: FriendProfile;
  share: string;
}

export interface OtherFee {
  id: string;
  name: string;
  amount: string;
  calculationMethod: string;
}

export interface NewExpenseItemRequest {
  groupExpenseId?: string;
  name: string;
  amount: string;
  quantity: number;
}

export interface NewOtherFeeRequest {
  groupExpenseId?: string;
  name: string;
  amount: string;
  calculationMethod: string;
}

export interface FeeCalculationMethodInfo {
  name: string;
  display: string;
  description: string;
}

export interface ExpenseParticipantsRequest {
  participantProfileIds: string[];
  payerProfileId: string;
}

export interface UpdateExpenseItemRequest {
  id: string;
  groupExpenseId: string;
  name: string;
  amount: string;
  quantity: number;
}

export interface UpdateOtherFeeRequest extends NewOtherFeeRequest {
  id: string;
}

export interface SyncItemParticipantsRequest {
  participants: ItemParticipantRequest[];
}

export interface ItemParticipantRequest {
  profileId: string;
  weight: number;
}

export interface ExpenseConfirmationResponse {
  id: string;
  description: string;
  totalAmount: string;
  payer: SimpleProfile;
  participants: ConfirmedExpenseParticipant[];
}

export interface ConfirmedExpenseParticipant {
  profile: SimpleProfile;
  items: ConfirmedItemShare[];
  itemsTotal: string;
  fees: ConfirmedItemShare[];
  feesTotal: string;
  total: string;
}

export interface ConfirmedItemShare {
  id: string;
  name: string;
  baseAmount: string;
  shareRate: string;
  shareAmount: string;
}

// Friend Request Types
export interface FriendRequest {
  id: string;
  senderAvatar?: string;
  senderName: string;
  recipientAvatar?: string;
  recipientName: string;
  createdAt: string;
  blockedAt: string;
  isSentByUser: boolean;
  isReceivedByUser: boolean;
  isBlocked: boolean;
}

// Bill Types
export interface ExpenseBillResponse {
  id: string;
  creatorProfileId: string;
  payerProfileId: string;
  imageUrl?: string;
  status:
    | "PENDING"
    | "EXTRACTED"
    | "FAILED_EXTRACTING"
    | "PARSED"
    | "FAILED_PARSING"
    | "NOT_DETECTED";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  isCreatedByUser: boolean;
  isPaidByUser: boolean;
  creatorProfileName: string;
  payerProfileName: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
}

export interface ValidationError {
  code: string;
  detail: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  isRefreshFailure?: boolean;
  errors?: ValidationError[];
}
