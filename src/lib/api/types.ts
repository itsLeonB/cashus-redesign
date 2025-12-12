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

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

// Friendship Types
export interface FriendshipResponse {
  id: string;
  friendProfile: FriendProfile;
  balance: number;
  createdAt: string;
}

export interface FriendProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  isAnonymous: boolean;
  email?: string;
}

export interface NewAnonymousFriendshipRequest {
  name: string;
}

// Debt Transaction Types
export type DebtAction = "LEND" | "BORROW" | "RECEIVE" | "RETURN";

export interface DebtTransactionResponse {
  id: string;
  friendProfile: FriendProfile;
  action: DebtAction;
  amount: number;
  description?: string;
  transferMethod: TransferMethod;
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
  icon?: string;
}

// Group Expense Types
export interface GroupExpenseResponse {
  id: string;
  description?: string;
  totalAmount: string;
  subtotal: string;
  status: "DRAFT" | "CONFIRMED";
  payerProfile: FriendProfile;
  items: ExpenseItem[];
  otherFees: OtherFee[];
  createdAt: string;
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

// Friend Request Types
export interface FriendRequest {
  id: string;
  fromProfile: FriendProfile;
  toProfile: FriendProfile;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
}

// Bill Types
export interface BillResponse {
  id: string;
  payerProfile: FriendProfile;
  imageUrl: string;
  createdAt: string;
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
