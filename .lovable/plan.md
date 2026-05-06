## Plan: Add Currency to New Group Expense Draft

### Changes

1. **`src/lib/api/group-expenses.ts`**
   - Update `createDraft` signature: `createDraft(data: { description: string; currency: string })` and POST that body to `/group-expenses`.

2. **`src/hooks/useApi.ts`**
   - `useCreateDraftExpense` already passes through to `createDraft`; no logic change, but the mutation argument type now becomes the new object shape.

3. **`src/components/NewGroupExpenseModal.tsx`**
   - Add local state `currency`, default to `user?.homeCurrency || "IDR"` (via `useAuth`).
   - Render a new required `Currency` field on the **details** step, using the existing `<CurrencySelect>` component (searchable, `code+name` format), placed above or beside the Description input.
   - Block submission when `currency` is empty; disable the "Next" button accordingly.
   - Pass `{ description, currency }` to `createDraft.mutateAsync(...)`.
   - Reset `currency` back to default in `resetModal()`.

### Notes
- No backend type changes beyond the request payload — response shape (`GroupExpenseResponse`) already exposes `currency`.
- Reuses `CurrencySelect` for full UX consistency with TransactionModal & Profile.
- No breaking changes to other callers (only one caller of `createDraft`).