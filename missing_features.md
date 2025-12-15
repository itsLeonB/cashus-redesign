# Missing Features in Redesign

The following features from the original `cashus` application have been identified as missing or incomplete in the `cashus-feature-explorer` redesign.

## 1. Authentication

- **Verify Registration**:
  - The API method exists, but there is no corresponding UI page or Route (e.g., `/auth/verify-registration`) to handle the verification token from email.
- **Reset Password**:
  - The API method exists, but there is no corresponding UI page or Route (e.g., `/auth/reset-password`) to allow users to input a new password after clicking a reset link.
- **OAuth Callback Handling**:
  - While the Google Login button redirects to the correct URL, there is no frontend route (e.g., `/auth/google/callback`) configured to handle the redirect from the OAuth provider and process the returned code/token.

## Profile Management

- Reset password

## 2. Friends Management

- **Associate Profile**:

  - The API supports linking an Anonymous Profile to a Real Profile (`associateProfile`), but no UI controls (buttons, modals) were found in `FriendsPage.tsx` or `FriendDetailPage.tsx` to initiate this action.

- Add real friend request

## 3. Group Expenses (Draft Management)

- **Add Items/Fees to Existing Draft**:
  - Users can only add items/fees during the initial creation of the expense. The `ExpenseDetailPage` does not provide an interface to add new items or fees to an existing draft.
- **Edit Items/Fees**:
  - There is no option to modify the name, amount, or quantity of existing items/fees in `ExpenseDetailPage`. Note: Adding participants to an item is implemented.
- **Remove Items/Fees**:
  - There is no option to delete items or fees from an existing draft in `ExpenseDetailPage`.

## Bills Management

- Upload bill
- Delete bill
