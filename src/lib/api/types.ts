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

export interface LoginResponse {
  type: string;
  token: string;
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
  transactions: FriendTransaction[];
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
  totalOwedToYou: number; // Amount friend owes you
  totalYouOwe: number; // Amount you owe friend
  netBalance: number; // Positive = they owe you, Negative = you owe them
  currency: string;
}

export interface FriendTransaction {
  id: string;
  type: "LEND" | "REPAY";
  action: "LEND" | "BORROW" | "RECEIVE" | "RETURN";
  amount: number;
  description: string;
  transferMethod: string;
  createdAt: string;
  updatedAt: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
}

export interface NewAnonymousFriendshipRequest {
  name: string;
}

// Debt Transaction Types
export type DebtType = "DEBT" | "CREDIT";
// DEBT = You Owe (Borrow), CREDIT = You are Owed (Lend)
// The legacy app uses type: "DEBT" | "CREDIT".
// But the redesign uses Action: "LEND" | "BORROW" etc.
// We need to map this in the frontend or update the type here.
// Legacy type:
export type DebtAction = "LEND" | "BORROW" | "RECEIVE" | "RETURN";

export interface DebtTransactionResponse {
  id: string;
  profileId: string; // The friend's profile ID
  type: DebtType;
  amount: string; // Legacy uses string for amount
  transferMethod: string; // Legacy returns string name
  description: string;
  createdAt: string;
}

export interface NewDebtTransactionRequest {
  friendProfileId: string;
  action: DebtAction;
  amount: number;
  transferMethodId: string;
  description?: string;
}

export interface TransferMethod {
  id: string;
  name: string;
  display: string;
}

// Group Expense Types
export interface GroupExpenseResponse {
  id: string;
  payerProfileId?: string;
  payerName?: string;
  paidByUser: boolean;
  totalAmount: string;
  itemsTotal: string;
  feesTotal: string;
  description?: string;
  items: ExpenseItemResponse[];
  otherFees?: OtherFeeResponse[];
  creatorProfileId: string;
  creatorName?: string;
  createdByUser: boolean;
  // Deprecated: refer to status instead
  confirmed: boolean;
  // Deprecated: refer to status instead
  participantsConfirmed: boolean;
  status: "DRAFT" | "PROCESSING_BILL" | "READY" | "CONFIRMED";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  participants?: ExpenseParticipantResponse[];
}

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
  profileName: string;
  profileId: string;
  share: string;
  isUser: boolean;
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
  profileName: string;
  profileId: string;
  shareAmount: string;
  isUser: boolean;
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

export interface NewGroupExpenseRequest {
  payerProfileId?: string;
  totalAmount: string;
  subtotal: string;
  description?: string;
  items: NewExpenseItemRequest[];
  otherFees?: NewOtherFeeRequest[];
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
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}
