### Ambag Supabase RPC Documentation

All RPC functions use **camelCase** names and are designed to be **frontend friendly**:

- **Input**: a single `payload` argument of type `jsonb` for create/update functions, or primitive IDs (`uuid`) for lookups/deletes.
- **Output**: the full row from the underlying table (for create/update/get), or `jsonb` for composite responses, or a boolean for delete, or `SETOF` for list-style reads.
- **Auth / RLS**: All RPCs run as `SECURITY DEFINER` but are still subject to existing **RLS policies**. The current Supabase user is always available as `auth.uid()`.

#### RPC index (aligned with `rpc.sql`)

| Function | Section |
|----------|---------|
| `createProfile`, `updateProfile`, `getProfileById`, `deleteProfile` | Profiles |
| `createGroup`, `updateGroup`, `getGroupById`, `deleteGroup`, `getUserGroupsSummary`, `getGroupTransactionsFeed` | Groups |
| `createGroupMember`, `updateGroupMember`, `getGroupMemberById`, `deleteGroupMember` | Group Members |
| `createExpense`, `updateExpense`, `getExpenseById`, `deleteExpense` | Expenses |
| `createExpensePayer`, `updateExpensePayer`, `getExpensePayerById`, `deleteExpensePayer` | Expense Payers |
| `createExpenseParticipant`, `updateExpenseParticipant`, `getExpenseParticipantById`, `deleteExpenseParticipant` | Expense Participants |
| `createExpenseSplit`, `updateExpenseSplit`, `getExpenseSplitById`, `deleteExpenseSplit` | Expense Splits |
| `createPaymentMethod`, `updatePaymentMethod`, `getPaymentMethodById`, `deletePaymentMethod` | Payment Methods |
| `createSettlement`, `updateSettlement`, `getSettlementById`, `deleteSettlement` | Settlements |
| `createNotificationRpc`, `updateNotificationRpc`, `getNotificationById`, `deleteNotification` | Notifications |
| `createGroupInvite`, `updateGroupInvite`, `getGroupInviteById`, `deleteGroupInvite` | Group Invites |
| `createGroupJoinRequest`, `updateGroupJoinRequest`, `getGroupJoinRequestById`, `deleteGroupJoinRequest` | Group Join Requests |
| `getExpenseHistoryByExpenseId` | Expense History |
| `createExpenseItem`, `updateExpenseItem`, `getExpenseItemById`, `deleteExpenseItem` | Expense Items |
| `createExpenseItemParticipant`, `updateExpenseItemParticipant`, `getExpenseItemParticipantById`, `deleteExpenseItemParticipant` | Expense Item Participants |
| `getImageUploadPath`, `saveImageUrl` | Image uploads |

This document is aligned with **`rpc.sql`**: every RPC defined there is listed above and documented below. Section order below follows the same grouping as in the SQL file.

Below is a summary of each RPC, its input shape, and output.

---

### Profiles

- **`createProfile(payload jsonb) -> profiles`**
  - **Input payload**:
    - `id?` `uuid` (defaults to `auth.uid()`)
    - `fullName` `string`
    - `avatarUrl?` `string`
    - `email` `string`
  - **Output**: Full `profiles` row that was created.

- **`updateProfile(profileId uuid, payload jsonb) -> profiles`**
  - **Input**:
    - `profileId` `uuid`
    - `payload` (any subset of):
      - `fullName?` `string`
      - `avatarUrl?` `string`
      - `email?` `string`
  - **Output**: Updated `profiles` row.

- **`getProfileById(profileId uuid) -> profiles`**
  - **Input**: `profileId` `uuid`
  - **Output**: Matching `profiles` row (or `null`).
  - **PostgREST / JS client**: Schema cache exposes the function as **`getprofilebyid`** (lowercase). Call `supabase.rpc('getprofilebyid', { profileid: userId })`. Using `getProfileById` can trigger PGRST202 (“no matches in the schema cache”).

- **`deleteProfile(profileId uuid) -> boolean`**
  - **Input**: `profileId` `uuid`
  - **Output**: `true` if a row was deleted, else `false`.

---

### Groups

- **`updateGroup(groupId uuid, payload jsonb) -> groups`**
  - **Input**:
    - `groupId` `uuid`
    - `payload` (any subset of):
      - `name?` `string`
      - `description?` `string`
      - `imageUrl?` `string`
      - `archivedAt?` `timestamptz`
  - **Output**: Updated `groups` row.

- **`getGroupById(groupId uuid) -> groups`**
- **`deleteGroup(groupId uuid) -> boolean`**

- **`createGroupWithMembers(payload jsonb) -> jsonb`**
  - **Input payload**:
    - `id?` `uuid` (optional; if omitted, generated in the database)
    - `name` `string`
    - `description?` `string`
    - `imageurl?` `string` (public URL from Storage upload, optional)
    - `memberids?` `uuid[]` (array of extra member user ids; creator is `auth.uid()`)
  - **Behavior**: Inserts into `public.groups` and `public.groupmembers` in a single transaction. If member insertion fails, the whole transaction rolls back and the group is not created. If `id` is not provided, a `gen_random_uuid()` value is used.
  - **Output**: `{ group, autoapproved: true }` where `group` matches an item from `getUserGroupsSummary().groups[]` (same keys/shape).
  - **PostgREST / JS client**: Call as `supabase.rpc('creategroupwithmembers', { payload: { ... } })`.

- **`getUserGroupsSummary(p_user_id uuid DEFAULT auth.uid()) -> jsonb`**
  - **Input**: Optional `p_user_id`; defaults to current user.
  - **Output**: `{ groups: [ ... ] }` — list of groups the user is a member of (excluding removed membership). Each item has:
    - **Group details**: `id`, `name`, `description`, `inviteCode`, `imageUrl`, `createdAt`, `archivedAt`, `createdById`
    - **Role**: `role` — current user's role in that group (`'admin'` or `'member'`)
    - **Counts**: `memberCount`, `pendingJoinRequestCount`, `pendingInvitationCount`
    - **Totals**: `totalExpenses`, `totalSettlements` (sum of amounts)
    - **Creator**: `createdBy` — `{ id, name, avatar }` (profile of the group creator; `name` = fullName, `avatar` = avatarUrl)
  - **Use case**: Dashboard, group selector, or "my groups" summary in one call.

- **`getGroupTransactionsFeed(p_group_id uuid) -> jsonb`**
  - **Input**: `p_group_id` — the group id (caller must be a member).
  - **Output**: `{ items: [ ... ] }` — unified, date-sorted list of expenses and settlements. Each item has:
    - **Common**: `type` (`'expense'` | `'settlement'`), `id`, `groupId`, `amount`, `createdAt`, `date` (sort key), `receiptUrl`
    - **Expense only**: `name`, `notes`, `expenseDate`, `splitType`, `createdBy` (`{ id, name, avatar }`), `payors` (array of `{ id, name, avatar }`), `participants` (array of `{ id, name, avatar }`). Settlement-only fields are null.
    - **Settlement only**: `payerId`, `receiverId`, `payer` (`{ id, name, avatar }`), `receiver` (`{ id, name, avatar }`). Expense-only fields are null.
  - **Use case**: Group activity/transactions feed in one call.

### Join by invite code

- **`joinGroupByInviteCode(invitecode text) -> jsonb`**
  - **Input**: `invitecode` (8-char group access key)
  - **Output**: `{ group, autoapproved: true }` where `group` matches an item from `getUserGroupsSummary().groups[]` (same keys/shape).
  - **Behavior**: Immediately inserts (or re-activates) the caller in `public.groupmembers`.
  - **PostgREST / JS client**: Call as `supabase.rpc('joingroupbyinvitecode', { invitecode })` (schema cache typically exposes lowercase).

---

### Group Members

- **`createGroupMember(payload jsonb) -> groupMembers`**
  - **Input payload**:
    - `groupId` `uuid`
    - `userId?` `uuid` (defaults to `auth.uid()`)
    - `role?` `'admin' | 'member'` (defaults to `'member'`)
    - `status?` `string` (defaults to `'active'`)
    - `joinedAt?` `timestamptz` (defaults to `now()`)
    - `removedAt?` `timestamptz`
  - **Output**: New `groupMembers` row.

- **`updateGroupMember(memberId uuid, payload jsonb) -> groupMembers`**
  - **Input**:
    - `memberId` `uuid`
    - `payload` (any subset of):
      - `role?` `'admin' | 'member'`
      - `status?` `string`
      - `removedAt?` `timestamptz`
  - **Output**: Updated `groupMembers` row.

- **`getGroupMemberById(memberId uuid) -> groupMembers`**
- **`deleteGroupMember(memberId uuid) -> boolean`**

---

### Expenses

- **`createExpense(payload jsonb) -> jsonb`**
  - **Input payload**:
    - `groupId` `uuid`
    - `createdBy?` `uuid` (defaults to `auth.uid()`)
    - `name` `string`
    - `amount` `numeric`
    - `splitType` `string`
    - `notes?` `string`
    - `expenseDate?` `timestamptz` (defaults to `now()`)
    - `receiptUrl?` `string` (set at insert when using upload-first flow)
    - `id?` `uuid` (optional; client-generated for upload-first so path and row share the same id)
    - `receiptFileName?` `string` (optional; default `'receipt.jpg'`)
  - **Output**: `{ expense, imageUpload }`
    - `expense`: the new expense row
    - `imageUpload`: `{ bucket, path, fileName }` for receipt (bucket `'expense-receipts'`).

- **`updateExpense(expenseId uuid, payload jsonb) -> expenses`**
  - **Input**:
    - `expenseId` `uuid`
    - `payload` (any subset of):
      - `name?` `string`
      - `amount?` `numeric`
      - `splitType?` `string`
      - `notes?` `string`
      - `expenseDate?` `timestamptz`
      - `receiptUrl?` `string`
  - **Output**: Updated `expenses` row.

- **`getExpenseById(expenseId uuid) -> expenses`**
- **`deleteExpense(expenseId uuid) -> boolean`**

---

### Expense Payers

- **`createExpensePayer(payload jsonb) -> expensePayers`**
  - **Input payload**:
    - `expenseId` `uuid`
    - `userId` `uuid`
    - `amountPaid` `numeric`
  - **Output**: New `expensePayers` row.

- **`updateExpensePayer(expensePayerId uuid, payload jsonb) -> expensePayers`**
  - **Input**:
    - `expensePayerId` `uuid`
    - `payload`:
      - `amountPaid?` `numeric`
  - **Output**: Updated `expensePayers` row.

- **`getExpensePayerById(expensePayerId uuid) -> expensePayers`**
- **`deleteExpensePayer(expensePayerId uuid) -> boolean`**

---

### Expense Participants

- **`createExpenseParticipant(payload jsonb) -> expenseParticipants`**
  - **Input payload**:
    - `expenseId` `uuid`
    - `userId` `uuid`
  - **Output**: New `expenseParticipants` row.

- **`updateExpenseParticipant(expenseParticipantId uuid, payload jsonb) -> expenseParticipants`**
  - **Input**:
    - `expenseParticipantId` `uuid`
    - `payload`:
      - `expenseId?` `uuid`
      - `userId?` `uuid`
  - **Output**: Updated row.

- **`getExpenseParticipantById(expenseParticipantId uuid) -> expenseParticipants`**
- **`deleteExpenseParticipant(expenseParticipantId uuid) -> boolean`**

---

### Expense Splits

- **`createExpenseSplit(payload jsonb) -> expenseSplits`**
  - **Input payload**:
    - `expenseId` `uuid`
    - `userId` `uuid`
    - `amountOwed?` `numeric`
    - `percent?` `numeric`
    - `shares?` `numeric`
  - **Output**: New `expenseSplits` row.

- **`updateExpenseSplit(expenseSplitId uuid, payload jsonb) -> expenseSplits`**
  - **Input**:
    - `expenseSplitId` `uuid`
    - `payload` (any subset of):
      - `amountOwed?` `numeric`
      - `percent?` `numeric`
      - `shares?` `numeric`
  - **Output**: Updated row.

- **`getExpenseSplitById(expenseSplitId uuid) -> expenseSplits`**
- **`deleteExpenseSplit(expenseSplitId uuid) -> boolean`**

---

### Payment Methods

- **`createPaymentMethod(payload jsonb) -> paymentMethods`**
  - **Input payload**:
    - `userId?` `uuid` (defaults to `auth.uid()`)
    - `type?` `string`
    - `accountName?` `string`
    - `accountNumber?` `string`
    - `bankType?` `string`
    - `qrCodeUrl?` `string`
  - **Output**: New `paymentMethods` row.

- **`updatePaymentMethod(paymentMethodId uuid, payload jsonb) -> paymentMethods`**
  - **Input**:
    - `paymentMethodId` `uuid`
    - `payload` (any subset of above fields)
  - **Output**: Updated row.

- **`getPaymentMethodById(paymentMethodId uuid) -> paymentMethods`**
- **`deletePaymentMethod(paymentMethodId uuid) -> boolean`**

---

### Settlements

- **`createSettlement(payload jsonb) -> jsonb`**
  - **Input payload**:
    - `groupId` `uuid`
    - `payerId` `uuid`
    - `receiverId` `uuid`
    - `amount` `numeric`
    - `paymentMethodId` `uuid`
    - `receiptUrl?` `string` (set at insert when using upload-first flow)
    - `id?` `uuid` (optional; client-generated for upload-first)
    - `receiptFileName?` `string` (optional; default `'receipt.jpg'`)
  - **Output**: `{ settlement, imageUpload }`
    - `settlement`: the new settlement row
    - `imageUpload`: `{ bucket, path, fileName }` for receipt (bucket `'settlement-receipts'`).

- **`updateSettlement(settlementId uuid, payload jsonb) -> settlements`**
  - **Input**:
    - `settlementId` `uuid`
    - `payload`:
      - `amount?` `numeric`
      - `paymentMethodId?` `uuid`
      - `receiptUrl?` `string`
      - `deletedAt?` `timestamptz`
  - **Output**: Updated row.

- **`getSettlementById(settlementId uuid) -> settlements`**
- **`deleteSettlement(settlementId uuid) -> boolean`**

---

### Notifications

- **`createNotificationRpc(payload jsonb) -> notifications`**
  - **Input payload**:
    - `userId` `uuid`
    - `groupId?` `uuid`
    - `type?` `string`
    - `referenceId?` `uuid`
    - `message` `string`
    - `isRead?` `boolean` (defaults to `false`)
  - **Output**: New `notifications` row.

- **`updateNotificationRpc(notificationId uuid, payload jsonb) -> notifications`**
  - **Input**:
    - `notificationId` `uuid`
    - `payload`:
      - `message?` `string`
      - `isRead?` `boolean`
  - **Output**: Updated row.

- **`getNotificationById(notificationId uuid) -> notifications`**
- **`deleteNotification(notificationId uuid) -> boolean`**

---

### Group Invites

- **`createGroupInvite(payload jsonb) -> groupInvites`**
  - **Input payload**:
    - `groupId` `uuid`
    - `invitedBy?` `uuid` (defaults to `auth.uid()`)
    - `invitedUserId?` `uuid`
    - `invitedEmail?` `string`
    - `status?` `string` (defaults to `'pending'`)
    - `inviteToken` `string`
  - **Output**: New `groupInvites` row.

- **`updateGroupInvite(groupInviteId uuid, payload jsonb) -> groupInvites`**
  - **Input**:
    - `groupInviteId` `uuid`
    - `payload`:
      - `status?` `string`
      - `respondedAt?` `timestamptz`
  - **Output**: Updated row.

- **`getGroupInviteById(groupInviteId uuid) -> groupInvites`**
- **`deleteGroupInvite(groupInviteId uuid) -> boolean`**

---

### Group Join Requests

- **`createGroupJoinRequest(payload jsonb) -> groupJoinRequests`**
  - **Input payload**:
    - `groupId` `uuid`
    - `userId?` `uuid` (defaults to `auth.uid()`)
    - `status?` `string` (defaults to `'pending'`)
    - `requestedAt?` `timestamptz` (defaults to `now()`)
  - **Output**: New `groupJoinRequests` row.

- **`updateGroupJoinRequest(groupJoinRequestId uuid, payload jsonb) -> groupJoinRequests`**
  - **Input**:
    - `groupJoinRequestId` `uuid`
    - `payload`:
      - `status?` `string`
      - `respondedAt?` `timestamptz`
  - **Output**: Updated row.

- **`getGroupJoinRequestById(groupJoinRequestId uuid) -> groupJoinRequests`**
- **`deleteGroupJoinRequest(groupJoinRequestId uuid) -> boolean`**

---

### Expense History (Read-only)

- **`getExpenseHistoryByExpenseId(expenseId uuid) -> SETOF expenseHistory`**
  - **Input**: `expenseId` `uuid`
  - **Output**: List of `expenseHistory` rows for the given expense, ordered by `createdAt DESC`.
  - **Note**: `expenseHistory` is managed by triggers; there are no create/update/delete RPCs.

---

### Expense Items

- **`createExpenseItem(payload jsonb) -> expenseItems`**
  - **Input payload**:
    - `expenseId` `uuid`
    - `name` `string`
    - `amount` `numeric`
  - **Output**: New `expenseItems` row.

- **`updateExpenseItem(expenseItemId uuid, payload jsonb) -> expenseItems`**
  - **Input**:
    - `expenseItemId` `uuid`
    - `payload`:
      - `name?` `string`
      - `amount?` `numeric`
  - **Output**: Updated row.

- **`getExpenseItemById(expenseItemId uuid) -> expenseItems`**
- **`deleteExpenseItem(expenseItemId uuid) -> boolean`**

---

### Expense Item Participants

- **`createExpenseItemParticipant(payload jsonb) -> expenseItemParticipants`**
  - **Input payload**:
    - `itemId` `uuid`
    - `userId` `uuid`
    - `share` `numeric`
  - **Output**: New `expenseItemParticipants` row.

- **`updateExpenseItemParticipant(expenseItemParticipantId uuid, payload jsonb) -> expenseItemParticipants`**
  - **Input**:
    - `expenseItemParticipantId` `uuid`
    - `payload`:
      - `share?` `numeric`
  - **Output**: Updated row.

- **`getExpenseItemParticipantById(expenseItemParticipantId uuid) -> expenseItemParticipants`**
- **`deleteExpenseItemParticipant(expenseItemParticipantId uuid) -> boolean`**

---

### Image uploads

Use these RPCs for the upload flow: call **`getImageUploadPath`** to get the storage bucket and path, upload the file with the Supabase Storage client, then call **`saveImageUrl`** to store the resulting URL on the correct table.

**Recommended: upload first, then create with the image URL.** If the upload fails, you never create the entity (nothing to revert). Create RPCs accept optional **`id`** (client-generated UUID) and **`imageUrl`** / **`receiptUrl`** so you can pass the URL at insert time.

#### Flow: New group with cover image

1. **Generate an id** and **get the upload path** (entity does not exist yet):
   ```ts
   const groupId = crypto.randomUUID();
   const { data: pathData } = await supabase.rpc('getImageUploadPath', {
     payload: { entityType: 'group', entityId: groupId, fileName: 'cover.jpg' }
   });
   ```

2. **Upload the file**:
   ```ts
   await supabase.storage.from(pathData.bucket).upload(pathData.path, file);
   const publicUrl = supabase.storage.from(pathData.bucket).getPublicUrl(pathData.path).data.publicUrl;
   ```

3. **Create the group with the same id and imageUrl** (insert includes the URL):
   ```ts
   const { data } = await supabase.rpc('createGroup', {
     payload: { id: groupId, name: 'Trip', description: '...', inviteCode: 'ABC12XYZ', imageUrl: publicUrl }
   });
   ```

If step 2 fails, you never call create. For **expense** and **settlement**, pass **`groupId`** in the `getImageUploadPath` payload and use the same upload-first flow with **`id`** and **`receiptUrl`** in the create payload.

---

- **`getImageUploadPath(payload jsonb) -> jsonb`**
  - **Input payload**:
    - `entityType` `'profile' | 'group' | 'expense' | 'settlement'` (required)
    - `entityId?` `uuid` (required for group, expense, settlement; for profile defaults to current user)
    - `fileName?` `string` (optional; default `'image'`; extension default `.jpg` if missing)
  - **Output**: `{ bucket, path, fileName }`
    - `bucket`: storage bucket name (`'avatars'`, `'group-images'`, `'expense-receipts'`, `'settlement-receipts'`)
    - `path`: full object path to use in `storage.from(bucket).upload(path, file)`
    - `fileName`: final file name used
  - **Access**: Profile: own id. Group: existing group and member, or **entityId for a not-yet-created group** (any authenticated user). Expense/settlement: existing entity and member, or **pending entity** — pass **`groupId`** in payload and you must be a member.
  - **Example (new group)**: `getImageUploadPath({ "entityType": "group", "entityId": "<client-uuid>", "fileName": "cover.jpg" })` → use same id in `createGroup({ id, ..., imageUrl })` after upload.

- **`saveImageUrl(payload jsonb) -> jsonb`**
  - **Input payload**:
    - `entityType` `'profile' | 'group' | 'expense' | 'settlement'` (required)
    - `entityId?` `uuid` (required for group, expense, settlement; for profile defaults to current user)
    - `imageUrl` `string` (required; public URL of the uploaded file)
  - **Output**: `{ entityType, entityId, imageUrl }` confirming the saved URL.
  - **Behavior**: Updates the correct column for the entity (`profiles.avatarUrl`, `groups.imageUrl`, `expenses.receiptUrl`, `settlements.receiptUrl`). Same access rules as `getImageUploadPath`.
  - **Example**: After upload, `saveImageUrl({ "entityType": "group", "entityId": "<group-id>", "imageUrl": "https://.../group-images/..." })`

