## Display Net Balance per Friend on FriendsPage

### 1. `src/lib/api/types.ts`
Add optional `balancesPerCurrency?: Record<string, string>` to `FriendshipResponse`.

### 2. `src/pages/FriendsPage.tsx`
- Import `useAuth` from `@/contexts/AuthContext` and `AmountDisplay` from `@/components/AmountDisplay`.
- Read `user?.homeCurrency` (fallback `"IDR"`).
- Inside the friend card (`filteredFriends.map`), after the name/status block, render a right-aligned `shrink-0` container:
  - Compute `balances = friendship.balancesPerCurrency ?? {}`.
  - `homeAmount = parseFloat(balances[homeCurrency] || "0")`.
  - `otherCount = Object.keys(balances).filter(c => c !== homeCurrency).length`.
  - If `homeAmount === 0 && otherCount === 0` → render nothing.
  - Else render `<AmountDisplay amount={homeAmount} currency={homeCurrency} size="sm" />` (only when `homeAmount !== 0`; if zero but others exist, skip amount and just show hint).
  - If `otherCount > 0`, render `<span className="text-xs text-muted-foreground">& {otherCount} more</span>` below, right-aligned.
- Ensure name container keeps `min-w-0` (already present), balance container uses `shrink-0 text-right`.

### Notes
- No business-logic changes; presentation only.
- Field is optional → safe with current backend until rollout.
- Verification: typecheck/build; visually verify on narrow viewport.
