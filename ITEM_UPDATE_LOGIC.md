# Item Update Logic Analysis

This document outlines how the application handles updates to Expense Items, specifically focusing on how participants and item details are managed.

## Overview

Item updates are primarily handled in two places:

1. **`ExpenseDetailPage.tsx`**: Manages adding/removing participants to/from an item.
2. **`ExpenseItemModal.tsx`**: Manages editing item details (name, amount, quantity).

Both of these components interact with the backend via the `groupExpensesApi.updateItem` method.

## Data Structures

### Update Payload (`UpdateExpenseItemRequest`)

When updating an item, the entire object state is sent to the API. The `participants` field is crucial here.

```typescript
interface UpdateExpenseItemRequest {
  id: string;
  groupExpenseId: string;
  name: string;
  amount: string;
  quantity: number;
  participants: ItemParticipantRequest[];
}

interface ItemParticipantRequest {
  profileId: string;
  share: string;
}
```

## Logic Flows

### 1. Adding Participants (`ExpenseDetailPage.tsx`)

When a user selects new participants (via checkboxes) and clicks "Add participants":

1.  **Selection**: `selectedParticipants` state tracks selected profile IDs for each item.
2.  **Merging**: The function `handleAddParticipants` retrieves the _current_ list of participants for the item.
3.  **Combination**: It creates a new set of participant IDs by combining existing participants + new selected participants.
4.  **Share Calculation**:
    - It calculates an equal share for _all_ participants: `1 / allParticipantIds.length`.
    - _Note: This overwrites any custom shares previously set._
5.  **API Call**: Calls `groupExpensesApi.updateItem` with the existing item details (name, amount, quantity) and the _new_ list of participants with recalculated shares.

### 2. Removing a Participant (`ExpenseDetailPage.tsx`)

When a user removes a participant (via the 'X' button on a participant chip):

1.  **Filtering**: The function `handleRemoveParticipant` filters out the target `profileId` from the current participants list.
2.  **Recalculation**:
    - If participants remain: It recalculates shares equally: `1 / remainingParticipants.length`.
    - If no participants remain: Sends an empty `participants` array.
3.  **API Call**: Calls `groupExpensesApi.updateItem` with the existing item details and the updated participant list.

### 3. Editing Item Details (`ExpenseItemModal.tsx`)

When a user edits the item's name, amount, or quantity:

1.  **Form State**: Local state manages `name`, `amount`, and `quantity`.
2.  **Preserving Participants**: The `handleSubmit` function checks if the item is being edited.
3.  **Mapping**: It maps the _existing_ `item.participants` to the request format (`profileId`, `share`).
    - _Crucial_: It uses the **existing shares** without recalculating them.
4.  **API Call**: Calls `groupExpensesApi.updateItem` with the new form values (name, amount, quantity) and the preserved participants list.

## Key Observations & Potential Issues

- **Share Overwrite**: Adding or removing a participant triggers a complete recalculation of shares for _everyone_ on that item (splitting equally). This means if a user had manually adjusted a share (feature mentioned in missing features), that manual adjustment would be lost when another person is added or removed.
- **Race Conditions**: There is no optimistic locking or versioning visible in the frontend. If two users update the item simultaneously, the last write wins, potentially overwriting participant changes.
- **Full Update**: The API requires a full update (PUT-like behavior even if implemented as PATCH or similar on backend logic). The frontend always sends the full state (name, amount, etc.) even when just changing participants.
