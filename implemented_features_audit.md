# Implemented Features Audit

This document outlines the features from the original design that have been successfully implemented in the `cashus-feature-explorer` codebase, along with an analysis of the API types and logic flow.

## 1. Authentication

- **Login**: Fully implemented.
  - UI: `LoginPage.tsx` handles email/password input and Google OAuth redirect.
  - API: `authApi.login` uses correct `LoginRequest` type.
  - Logic: Redirects to dashboard on success, displays error toasts on failure.
- **Register**: Fully implemented.
  - UI: `RegisterPage.tsx` includes password confirmation validation.
  - API: `authApi.register` uses correct `RegisterRequest` type.
  - Logic: Shows success message instructing user to check email upon completion.
- **Profile Management**: Fully implemented.
  - UI: `ProfilePage.tsx` allows viewing and updating display name.
  - API: `authApi.updateProfile` and `authApi.getProfile`.

## 2. Dashboard

- **Financial Summary**: Implemented.
  - Logic: Calculates "Total Owed to You" and "Total You Owe" client-side by iterating through `friendships` data, matching the prompt's description.
- **Recent Activity**: Implemented.
  - Logic: Aggregates `debts` and `groupExpenses`, sorts by date, and displays the recent 5 items.
- **Quick Actions**: Implemented.
  - UI: Buttons for "Add Friend", "Record Lend", "Record Borrow", "Group Expense" are functional.

## 3. Friends Management

- **List Friends**: Implemented.
  - UI: `FriendsPage.tsx` displays friends in a grid with balances.
- **Add Friend**: Implemented.
  - UI: Supports both "Anonymous" (local) friend creation and "Search" for existing users.
- **Friend Requests**: Partially Implemented.
  - UI: tabs for "Requests" show Sent and Received requests.
  - Actions: "Accept", "Ignore", and "Cancel" are implemented.
  - _Note: "Block" and "Unblock" actions are defined in API client but missing from UI._
- **Friend Details**: Implemented.
  - UI: `FriendDetailPage.tsx` shows friendship stats and transaction history.
  - Logic: computes total lent/borrowed for that specific friend from global debt list.

## 4. Personal Debt Transactions (1-on-1)

- **Create Transaction**: Implemented.
  - UI: `TransactionModal.tsx` supports Lend, Borrow, Receive, Return actions.
  - Logic: Fetches and displays dynamic `TransferMethod` options (Wallet, Card, etc.).
- **List Transactions**: Implemented.
  - UI: Visible in Dashboard (recent) and Friend Details (history).

## 5. Group Expenses

- **Create Draft**: Implemented.
  - UI: `NewExpenseModal.tsx` allows adding multiple items and fee calculations (Flat/Percentage).
  - Logic: Calculates totals locally for preview before submission.
- **View Details**: Implemented.
  - UI: `ExpenseDetailPage.tsx` shows items, split details, and fees.
- **Participant Management**: Implemented.
  - Logic: Users can be added to specific items in the expense.
- **Confirm Expense**: Implemented.
  - Action: "Confirm & Record Debts" button changes status to CONFIRMED.

## 6. Expense Bills

- **Management**: Implemented.
  - UI: `BillsPage.tsx` allows uploading receipt images and deleting them.
  - API: Uses `FormData` for file upload as required.

## API Type Verification

### Type Definitions

The API type definitions in `src/lib/api/types.ts` generally match the specifications in `cashus/current_features.md`.

- `LoginRequest`, `RegisterRequest`
- `FriendshipResponse`, `FriendProfile`
- `DebtTransactionResponse`, `NewDebtTransactionRequest`
- `GroupExpenseResponse`, `BillResponse`

### Critical Mismatch: Response Wrappers

**FAIL**: The API client implementations (`auth.ts`, `debts.ts`, `friendships.ts`, `group-expenses.ts`) expect direct returns of the entity types (e.g., `AuthResponse`), but the `types.ts` file defines an `ApiResponse<T>` wrapper:

```typescript
interface ApiResponse<T> {
  data: T;
  message?: string;
}
```

If the backend returns this standard wrapper (which is common for this project's "Standardized JSON:API" goal), all API calls will fail to resolve the correct data because `apiClient` does not unwrap `response.data`.

**Specific Failures**:

- **Login**: `authApi.login` returns `AuthResponse`, but likely receives `{ data: AuthResponse }`. `AuthContext` tries to access properties on the wrapper instead of the inner data, causing Login to be broken.
- **All other endpoints**: Similar issue for `getFriends`, `getDebts`, etc. They likely return `{ data: T[] }` but the app expects `T[]`.

**Action Required**:

- Update all API methods to return `Promise<ApiResponse<T>>` OR modify `apiClient` to automatically unwrap the `data` property.

## Logic Flow Analysis

- **State Management**: The application uses `TanStack Query` (React Query) effectively for server state, ensuring data is cached and updated (e.g., specific query invalidation in `ExpenseDetailPage` after adding participants).
- **Error Handling**: Consistent use of `useToast` to provide user feedback for success and error states.
- **Navigation**: `react-router-dom` is used correctly with `AuthLayout` (for public auth pages) and `AppLayout` (private protected pages).
