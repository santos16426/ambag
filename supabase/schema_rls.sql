-- Ambag: Single migration — initial schema, RLS, storage buckets and policies
-- Collates: schema (001, 004), indexes (003), RLS (002), buckets + storage policies (018, 020)
-- Check if user is group member

-- =============================================================================
-- PART 1: Profiles table
-- =============================================================================

-- 1. PROFILE TABLE (extends Supabase auth.users)
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fullName TEXT NOT NULL,
  avatarUrl TEXT,
  email TEXT NOT NULL UNIQUE,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS public.groups CASCADE;
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  createdBy UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imageUrl TEXT,
  archivedAt TIMESTAMPTZ,
  inviteCode CHAR(8) UNIQUE NOT NULL
);
DO $$ BEGIN
  CREATE TYPE groupRole AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DROP TABLE IF EXISTS public.groupMembers CASCADE;
CREATE TABLE IF NOT EXISTS public.groupMembers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupId UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role groupRole NOT NULL DEFAULT 'member',
  status TEXT DEFAULT 'active',
  joinedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removedAt TIMESTAMPTZ,
  UNIQUE(groupId, userId)
);

CREATE OR REPLACE FUNCTION public.isGroupMember(gid uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groupMembers
    WHERE groupId = gid
    AND userId = auth.uid()
    AND removedAt IS NULL
  );
$$;


-- Check if user is group admin
CREATE OR REPLACE FUNCTION public.isGroupAdmin(gid uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groupMembers
    WHERE groupId = gid
    AND userId = auth.uid()
    AND role = 'admin'
    AND removedAt IS NULL
  );
$$;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 2: ROW LEVEL SECURITY : PROFILES TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
ON profiles
FOR DELETE
USING (id = auth.uid());

-- ==============================================================
-- PART 3: Groups table
-- ==============================================================


ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 4: ROW LEVEL SECURITY : GROUPS TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view all groups" ON public.groups;
CREATE POLICY "Users can view all groups"
ON groups
FOR SELECT
USING (
  public.isGroupMember(id)
);

DROP POLICY IF EXISTS "Users can insert group" ON public.groups;
CREATE POLICY "Users can insert group"
ON groups
FOR INSERT
WITH CHECK (
  createdBy = auth.uid()
);

DROP POLICY IF EXISTS "Users can update group" ON public.groups;
CREATE POLICY "Users can update group"
ON groups
FOR UPDATE
USING (
  createdBy = auth.uid()
);

DROP POLICY IF EXISTS "Users can delete group" ON public.groups;
CREATE POLICY "Users can delete group"
ON groups
FOR DELETE
USING (
  createdBy = auth.uid()
);

-- ==============================================================
-- PART 5: Group members table
-- ==============================================================


ALTER TABLE groupMembers ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 6: ROW LEVEL SECURITY : GROUP MEMBERS TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view group members" ON public.groupMembers;
CREATE POLICY "Users can view group members"
ON groupMembers
FOR SELECT
USING (
  public.isGroupMember(groupId)
);

DROP POLICY IF EXISTS "Manage members" ON public.groupMembers;
CREATE POLICY "Manage members"
ON groupMembers
FOR ALL
USING (
  public.isGroupAdmin(groupId)
)
WITH CHECK (
  public.isGroupAdmin(groupId)
);

-- ==============================================================
-- PART 7: Expenses table
-- ==============================================================

DROP TABLE IF EXISTS public.expenses CASCADE;
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupId UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  createdBy UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  splitType TEXT NOT NULL,
  notes TEXT,
  expenseDate TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  receiptUrl TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 8: ROW LEVEL SECURITY : EXPENSES TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view expenses" ON public.expenses;
CREATE POLICY "Users can view expenses"
ON expenses
FOR SELECT
USING (
  public.isGroupMember(groupId)
);

DROP POLICY IF EXISTS "Users can insert expense" ON public.expenses;
CREATE POLICY "Users can insert expense"
ON expenses
FOR INSERT
WITH CHECK (
  public.isGroupMember(groupId)
);

DROP POLICY IF EXISTS "Users can update expense" ON public.expenses;
CREATE POLICY "Users can update expense"
ON expenses
FOR UPDATE
USING (
  public.isGroupMember(groupId)
);

DROP POLICY IF EXISTS "Users can delete expense" ON public.expenses;
CREATE POLICY "Users can delete expense"
ON expenses
FOR DELETE
USING (
  public.isGroupMember(groupId)
);

-- ==============================================================
-- PART 9: Expense payers table
-- ==============================================================

DROP TABLE IF EXISTS public.expensePayers CASCADE;
CREATE TABLE IF NOT EXISTS public.expensePayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expenseId UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amountPaid NUMERIC NOT NULL
);

ALTER TABLE expensePayers ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 10: ROW LEVEL SECURITY : EXPENSE PAYERS TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view expense payers" ON public.expensePayers;
CREATE POLICY "Users can view expense payers"
ON expensePayers
FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM public.expenses
  WHERE id = expenseId
  AND public.isGroupMember(groupId)
)
);

DROP POLICY IF EXISTS "Users can insert expense payer" ON public.expensePayers;
CREATE POLICY "Users can insert expense payer"
ON expensePayers
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1
  FROM public.expenses
  WHERE id = expenseId
  AND public.isGroupMember(groupId)
));

DROP POLICY IF EXISTS "Users can update expense payer" on public.expensePayers;
CREATE POLICY "Users can update expense payer"
ON expensePayers
FOR UPDATE
USING (
  expenseId IN (
    SELECT id
    FROM public.expenses
    WHERE public.isGroupMember(groupId)
  )
);

DROP POLICY IF EXISTS "Users can delete expense payer" ON public.expensePayers;
CREATE POLICY "Users can delete expense payer"
ON expensePayers
FOR DELETE
USING (
  expenseId IN (
    SELECT id
    FROM public.expenses
    WHERE public.isGroupMember(groupId)
  )
);

-- ==============================================================
-- PART 11: Expense participants table
-- ==============================================================

DROP TABLE IF EXISTS public.expenseParticipants CASCADE;
CREATE TABLE IF NOT EXISTS public.expenseParticipants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expenseId UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE expenseParticipants ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 12: ROW LEVEL SECURITY : EXPENSE PARTICIPANTS TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view participants" ON public.expenseParticipants;
CREATE POLICY "Users can view participants"
on expenseParticipants
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.expenses
    WHERE id = expenseId
    AND public.isGroupMember(groupId)
  )
);

DROP POLICY IF EXISTS "Users can insert participant" ON public.expenseParticipants;
CREATE POLICY "Users can insert participant"
ON expenseParticipants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.expenses
    WHERE id = expenseId
    AND public.isGroupMember(groupId)
  )
);

DROP POLICY IF EXISTS "Users can update participant" ON public.expenseParticipants;
CREATE POLICY "Users can update participant"
ON expenseParticipants
FOR UPDATE
USING (
  expenseId IN (
    SELECT id
    FROM public.expenses
    WHERE public.isGroupMember(groupId)
  )
);

DROP POLICY IF EXISTS "Users can delete participant" ON public.expenseParticipants;
CREATE POLICY "Users can delete participant"
ON expenseParticipants
FOR DELETE
USING (
  expenseId IN (
    SELECT id
    FROM public.expenses
    WHERE public.isGroupMember(groupId)
  )
);

-- ==============================================================
-- PART 13: Expense Splits Table
-- ==============================================================

DROP TABLE IF EXISTS public.expenseSplits CASCADE;
CREATE TABLE IF NOT EXISTS public.expenseSplits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expenseId UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amountOwed NUMERIC,
  percent NUMERIC,
  shares NUMERIC
);

ALTER TABLE expenseSplits ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 14: ROW LEVEL SECURITY : EXPENSE SPLITS TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view splits" ON public.expenseSplits;
CREATE POLICY "Users can view splits"
ON expenseSplits
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.expenses
    WHERE id = expenseId
    AND public.isGroupMember(groupId)
  )
);

DROP POLICY IF EXISTS "Users can insert split" ON public.expenseSplits;
CREATE POLICY "Users can insert split"
ON expenseSplits
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.expenses
    WHERE id = expenseId
    AND public.isGroupMember(groupId)
  )
);

DROP POLICY IF EXISTS "Users can update split" ON public.expenseSplits;
CREATE POLICY "Users can update split"
ON expenseSplits
FOR UPDATE
USING (
  expenseId IN (
    SELECT id
    FROM public.expenses
    WHERE public.isGroupMember(groupId)
  )
);

DROP POLICY IF EXISTS "Users can delete split" ON public.expenseSplits;
CREATE POLICY "Users can delete split"
ON expenseSplits
FOR DELETE
USING (
  expenseId IN (
    SELECT id
    FROM public.expenses
    WHERE public.isGroupMember(groupId)
  )
);

-- ==============================================================
-- PART 15: Payment Methods Table
-- ==============================================================

DROP TABLE IF EXISTS public.paymentMethods CASCADE;
CREATE TABLE IF NOT EXISTS public.paymentMethods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT,
  accountName TEXT,
  accountNumber TEXT,
  bankType TEXT,
  qrCodeUrl TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE paymentMethods ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 16: ROW LEVEL SECURITY : PAYMENT METHODS TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view payment methods" ON public.paymentMethods;
CREATE POLICY "Users can view payment methods"
ON paymentMethods
FOR SELECT
USING (
  userId = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.groupMembers gm
    JOIN groupMembers me
    ON gm.groupId = me.groupId
    WHERE gm.userId = paymentMethods.userId
    AND me.userId = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert payment method" ON public.paymentMethods;
CREATE POLICY "Users can insert payment method"
ON paymentMethods
FOR INSERT
WITH CHECK (userId = auth.uid());

DROP POLICY IF EXISTS "Users can update payment method" ON public.paymentMethods;
CREATE POLICY "Users can update payment method"
ON paymentMethods
FOR UPDATE
USING (userId = auth.uid());

DROP POLICY IF EXISTS "Users can delete payment method" ON public.paymentMethods;
CREATE POLICY "Users can delete payment method"
ON paymentMethods
FOR DELETE
USING (userId = auth.uid());

-- ==============================================================
-- PART 17: Settlements Table
-- ==============================================================

DROP TABLE IF EXISTS public.settlements CASCADE;
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupId UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  payerId UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiverId UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  paymentMethodId UUID NOT NULL REFERENCES public.paymentMethods(id) ON DELETE CASCADE,
  receiptUrl TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deletedAt TIMESTAMPTZ
);

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 18: ROW LEVEL SECURITY : SETTLEMENTS TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view settlements" ON public.settlements;
CREATE POLICY "Users can view settlements"
ON settlements
FOR SELECT
USING (
  public.isGroupMember(groupId)
);

DROP POLICY IF EXISTS "Users can insert settlement" ON public.settlements;
CREATE POLICY "Users can insert settlement"
ON settlements
FOR INSERT
WITH CHECK (
  public.isGroupMember(groupId)
);

DROP POLICY IF EXISTS "Users can update settlement" ON public.settlements;
CREATE POLICY "Users can update settlement"
ON settlements
FOR UPDATE
USING (
  public.isGroupMember(groupId)
);

DROP POLICY IF EXISTS "Users can delete settlement" ON public.settlements;
CREATE POLICY "Users can delete settlement"
ON settlements
FOR DELETE
USING (
  public.isGroupMember(groupId)
);

-- ==============================================================
-- PART 19: Notifications Table
-- ==============================================================

DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  groupId UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  type TEXT,
  referenceId UUID,
  message TEXT,
  isRead BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 20: ROW LEVEL SECURITY : NOTIFICATIONS TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
CREATE POLICY "Users can view notifications"
ON notifications
FOR SELECT
USING (userId = auth.uid());

DROP POLICY IF EXISTS "Users can insert notification" ON public.notifications;
CREATE POLICY "Users can insert notification"
ON notifications
FOR INSERT
WITH CHECK (userId = auth.uid());

DROP POLICY IF EXISTS "Users can update notification" ON public.notifications;
CREATE POLICY "Users can update notification"
ON notifications
FOR UPDATE
USING (userId = auth.uid());

DROP POLICY IF EXISTS "Users can delete notification" ON public.notifications;
CREATE POLICY "Users can delete notification"
ON notifications
FOR DELETE
USING (userId = auth.uid());

-- ==============================================================
-- PART 21: Group Invites Table
-- ==============================================================

DROP TABLE IF EXISTS public.groupInvites CASCADE;
CREATE TABLE IF NOT EXISTS public.groupInvites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupId UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invitedBy UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitedUserId UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitedEmail TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  inviteToken TEXT UNIQUE NOT NULL,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  respondedAt TIMESTAMPTZ
);

ALTER TABLE groupInvites ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 22: ROW LEVEL SECURITY : GROUP INVITES TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view group invites" ON public.groupInvites;
CREATE POLICY "Users can view group invites"
ON groupInvites
FOR SELECT
USING (invitedUserId = auth.uid() OR invitedBy = auth.uid());

DROP POLICY IF EXISTS "Users can insert group invite" ON public.groupInvites;
CREATE POLICY "Users can insert group invite"
ON groupInvites
FOR INSERT
WITH CHECK (
  public.isGroupMember(groupId)
);

DROP POLICY IF EXISTS "Users can update group invite" ON public.groupInvites;
CREATE POLICY "Users can update group invite"
ON groupInvites
FOR UPDATE
USING (
  public.isGroupMember(groupId)
);

DROP POLICY IF EXISTS "Users can delete group invite" ON public.groupInvites;
CREATE POLICY "Users can delete group invite"
ON groupInvites
FOR DELETE
USING (
  public.isGroupMember(groupId)
);

-- ==============================================================
-- PART 23: Group Join Requests Table
-- ==============================================================

DROP TABLE IF EXISTS public.groupJoinRequests CASCADE;
CREATE TABLE IF NOT EXISTS public.groupJoinRequests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupId UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  requestedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  respondedAt TIMESTAMPTZ
);

ALTER TABLE groupJoinRequests ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 24: ROW LEVEL SECURITY : GROUP JOIN REQUESTS TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can join requests" on public.groupJoinRequests;
CREATE POLICY "Users can join requests"
ON groupJoinRequests
FOR INSERT
WITH CHECK (userId = auth.uid());

DROP POLICY IF EXISTS "Owner can view join requests" on public.groupJoinRequests;
CREATE POLICY "Owner can view join requests"
ON groupJoinRequests
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.groups
    WHERE groups.id = groupJoinRequests.groupId
    AND groups.createdBy = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owner can update join request" on public.groupJoinRequests;
CREATE POLICY "Owner can update join request"
ON groupJoinRequests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.groups
    WHERE groups.id = groupJoinRequests.groupId
    AND groups.createdBy = auth.uid()
  )
);


-- ==============================================================
-- PART 25: Expense History Table
-- ==============================================================

DROP TABLE IF EXISTS public.expenseHistory CASCADE;
CREATE TABLE IF NOT EXISTS public.expenseHistory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expenseId UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  editedBy UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  oldAmount NUMERIC,
  oldSplitType TEXT,
  oldName TEXT,
  oldNotes TEXT,
  oldExpenseDate TIMESTAMPTZ,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE expenseHistory ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 26: ROW LEVEL SECURITY : EXPENSE HISTORY TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view expense history" ON public.expenseHistory;
CREATE POLICY "Users can view expense history"
ON expenseHistory
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM expenses e
    WHERE e.id = expenseHistory.expenseId
    AND public.isGroupMember(e.groupId)
  )
);

DROP POLICY IF EXISTS "No update history" ON public.expenseHistory;
CREATE POLICY "No update history"
ON expenseHistory
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "no delete history" ON public.expenseHistory;
CREATE POLICY "no delete history"
ON expenseHistory
FOR DELETE
USING (false);


-- ==============================================================
-- PART 27: Expense Items Table
-- ==============================================================

DROP TABLE IF EXISTS public.expenseItems CASCADE;
CREATE TABLE IF NOT EXISTS public.expenseItems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expenseId UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE expenseItems ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 28: ROW LEVEL SECURITY : EXPENSE ITEMS TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view expense items" ON public.expenseItems;

CREATE POLICY "Users can view expense items"
ON expenseItems
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.expenses e
    WHERE e.id = expenseItems.expenseId
    AND public.isGroupMember(e.groupId)
  )
);

DROP POLICY IF EXISTS "Users can insert expense item" ON public.expenseItems;
CREATE POLICY "Users can insert expense item"
ON expenseItems
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.expenses e
    WHERE e.id = expenseItems.expenseId
    AND public.isGroupMember(e.groupId)
  )
);

DROP POLICY IF EXISTS "Users can update expense item" ON public.expenseItems;
CREATE POLICY "Users can update expense item"
ON expenseItems
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.expenses e
    WHERE e.id = expenseItems.expenseId
    AND public.isGroupMember(e.groupId)
  )
);

-- ==============================================================
-- PART 29: Expense Item Participants Table
-- ==============================================================

DROP TABLE IF EXISTS public.expenseItemParticipants CASCADE;

CREATE TABLE IF NOT EXISTS public.expenseItemParticipants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itemId UUID NOT NULL REFERENCES public.expenseItems(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share NUMERIC,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expenseItemParticipants ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- PART 30: ROW LEVEL SECURITY : EXPENSE ITEM PARTICIPANTS TABLE
-- ==============================================================

DROP POLICY IF EXISTS "Users can view item participants" ON public.expenseItemParticipants;

CREATE POLICY "Users can view item participants"
ON public.expenseItemParticipants
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.expenseItems i
    JOIN public.expenses e ON e.id = i.expenseId
    WHERE i.id = expenseItemParticipants.itemId
    AND public.isGroupMember(e.groupId)
  )
);

DROP POLICY IF EXISTS "Users can insert item participant" ON public.expenseItemParticipants;

CREATE POLICY "Users can insert item participant"
ON public.expenseItemParticipants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.expenseItems i
    JOIN public.expenses e ON e.id = i.expenseId
    WHERE i.id = expenseItemParticipants.itemId
    AND public.isGroupMember(e.groupId)
  )
);

DROP POLICY IF EXISTS "Users can update item participant" ON public.expenseItemParticipants;

CREATE POLICY "Users can update item participant"
ON public.expenseItemParticipants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.expenseItems i
    JOIN public.expenses e ON e.id = i.expenseId
    WHERE i.id = expenseItemParticipants.itemId
    AND public.isGroupMember(e.groupId)
  )
);

DROP POLICY IF EXISTS "Users can delete item participant" ON public.expenseItemParticipants;

CREATE POLICY "Users can delete item participant"
ON public.expenseItemParticipants
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.expenseItems i
    JOIN public.expenses e ON e.id = i.expenseId
    WHERE i.id = expenseItemParticipants.itemId
    AND public.isGroupMember(e.groupId)
  )
);

-- ==============================================================
-- INDEXES
-- ==============================================================

-- Groups
CREATE INDEX IF NOT EXISTS idxGroupsCreatedBy ON public.groups(createdBy);
CREATE INDEX IF NOT EXISTS idxGroupsInviteCode ON public.groups(inviteCode);
CREATE INDEX IF NOT EXISTS idxGroupsCreatedAt ON public.groups(createdAt DESC);

-- Group members
CREATE INDEX IF NOT EXISTS idxGroupMembersUserId ON public.groupMembers(userId);
CREATE INDEX IF NOT EXISTS idxGroupMembersGroupId ON public.groupMembers(groupId);
CREATE INDEX IF NOT EXISTS idxGroupMembersUserGroup ON public.groupMembers(userId, groupId);
CREATE INDEX IF NOT EXISTS idxGroupMembersRole ON public.groupMembers(groupId, role);

-- Expenses
CREATE INDEX IF NOT EXISTS idxExpensesGroupId ON public.expenses(groupId);
CREATE INDEX IF NOT EXISTS idxExpensesCreatedBy ON public.expenses(createdBy);
CREATE INDEX IF NOT EXISTS idxExpensesExpenseDate ON public.expenses(groupId, expenseDate DESC);
CREATE INDEX IF NOT EXISTS idxExpensesCreatedAt ON public.expenses(createdAt DESC);

-- Expense payers
CREATE INDEX IF NOT EXISTS idxExpensePayersExpenseId ON public.expensePayers(expenseId);
CREATE INDEX IF NOT EXISTS idxExpensePayersUserId ON public.expensePayers(userId);

-- Expense participants
CREATE INDEX IF NOT EXISTS idxExpenseParticipantsExpenseId ON public.expenseParticipants(expenseId);
CREATE INDEX IF NOT EXISTS idxExpenseParticipantsUserId ON public.expenseParticipants(userId);

-- Expense splits
CREATE INDEX IF NOT EXISTS idxExpenseSplitsExpenseId ON public.expenseSplits(expenseId);
CREATE INDEX IF NOT EXISTS idxExpenseSplitsUserId ON public.expenseSplits(userId);

-- Payment methods
CREATE INDEX IF NOT EXISTS idxPaymentMethodsUserId ON public.paymentMethods(userId);

-- Settlements
CREATE INDEX IF NOT EXISTS idxSettlementsGroupId ON public.settlements(groupId);
CREATE INDEX IF NOT EXISTS idxSettlementsPayerId ON public.settlements(payerId);
CREATE INDEX IF NOT EXISTS idxSettlementsReceiverId ON public.settlements(receiverId);
CREATE INDEX IF NOT EXISTS idxSettlementsCreatedAt ON public.settlements(createdAt DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idxNotificationsUserId ON public.notifications(userId);
CREATE INDEX IF NOT EXISTS idxNotificationsIsRead ON public.notifications(userId, isRead) WHERE isRead = FALSE;

-- Group invites
CREATE INDEX IF NOT EXISTS idxGroupInvitesGroupId ON public.groupInvites(groupId);
CREATE INDEX IF NOT EXISTS idxGroupInvitesInvitedUserId ON public.groupInvites(invitedUserId);
CREATE INDEX IF NOT EXISTS idxGroupInvitesStatus ON public.groupInvites(status);

-- Group join requests
CREATE INDEX IF NOT EXISTS idxGroupJoinRequestsGroupId ON public.groupJoinRequests(groupId);
CREATE INDEX IF NOT EXISTS idxGroupJoinRequestsUserId ON public.groupJoinRequests(userId);
CREATE INDEX IF NOT EXISTS idxGroupJoinRequestsStatus ON public.groupJoinRequests(status);

-- Expense history and items
CREATE INDEX IF NOT EXISTS idxExpenseHistoryExpenseId ON public.expenseHistory(expenseId);
CREATE INDEX IF NOT EXISTS idxExpenseItemsExpenseId ON public.expenseItems(expenseId);
CREATE INDEX IF NOT EXISTS idxExpenseItemParticipantsItemId ON public.expenseItemParticipants(itemId);
CREATE INDEX IF NOT EXISTS idxExpenseItemParticipantsUserId ON public.expenseItemParticipants(userId);

-- ==============================================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================================

CREATE OR REPLACE FUNCTION logExpenseHistory()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

INSERT INTO expenseHistory (
  expenseId,
  editedBy,
  oldAmount,
  oldSplitType,
  createdAt
)
VALUES (
  OLD.id,
  auth.uid(),
  OLD.amount,
  OLD.splitType,
  NOW()
);

RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS expenseHistoryTrigger ON public.expenses;
CREATE TRIGGER expenseHistoryTrigger
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION logExpenseHistory();

-- ==============================================================
-- TRIGGER FUNCTIONS
-- ==============================================================


-- ==============================================================
-- 1. AUTO CREATE PROFILE AFTER AUTH SIGNUP

CREATE OR REPLACE FUNCTION public.createProfileForUser()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  display_name TEXT;
  avatar_url TEXT;
BEGIN
  -- Derive a reasonable display name for both email/password and OAuth (Google) signups.
  display_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'fullName'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    'User'
  );

  -- Try to capture an avatar URL when available (Google puts this in "picture").
  avatar_url := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'avatarUrl'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'picture'), '')
  );

  -- Upsert so that:
  -- - new email/password or Google accounts create a profile
  -- - later Google sign-in / metadata updates keep the profile in sync
  INSERT INTO public.profiles (id, fullName, email, avatarUrl, createdAt)
  VALUES (NEW.id, display_name, NEW.email, avatar_url, NOW())
  ON CONFLICT (id) DO UPDATE
  SET
    fullName = EXCLUDED.fullName,
    email = EXCLUDED.email,
    avatarUrl = COALESCE(EXCLUDED.avatarUrl, public.profiles.avatarUrl);

  -- If this user was invited by email before they had an account, add them to those
  -- groups as a member, then delete the pending invitation records.
  INSERT INTO public.groupmembers (groupid, userid, role, joinedat)
  SELECT gi.groupid, NEW.id, 'member', NOW()
  FROM public.groupinvites gi
  WHERE gi.status = 'pending'
    AND NEW.email IS NOT NULL
    AND trim(NEW.email) <> ''
    AND lower(trim(gi.invitedemail)) = lower(trim(NEW.email))
  ON CONFLICT (groupid, userid) DO NOTHING;

  DELETE FROM public.groupinvites
  WHERE status = 'pending'
    AND NEW.email IS NOT NULL
    AND trim(NEW.email) <> ''
    AND lower(trim(invitedemail)) = lower(trim(NEW.email));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS createProfileForUserTrigger ON auth.users;
CREATE TRIGGER createProfileForUserTrigger
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.createProfileForUser();



-- ==============================================================
-- 2. GENERATE GROUP INVITE CODE
-- ==============================================================

CREATE OR REPLACE FUNCTION public.generateInviteCode()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT := 0;
BEGIN

FOR i IN 1..8 LOOP
  result := result || substr(chars, floor(random()*length(chars)+1)::int,1);
END LOOP;

RETURN result;

END;
$$;


CREATE OR REPLACE FUNCTION public.setGroupInviteCode()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

IF NEW.inviteCode IS NULL THEN
  NEW.inviteCode := public.generateInviteCode();
END IF;

RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS groupInviteCodeTrigger ON public.groups;

CREATE TRIGGER groupInviteCodeTrigger
BEFORE INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.setGroupInviteCode();



-- ==============================================================
-- 3. ADD CREATOR AS GROUP ADMIN
-- ==============================================================

CREATE OR REPLACE FUNCTION public.addCreatorAsAdmin()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

INSERT INTO public.groupMembers (
  groupId,
  userId,
  role,
  joinedAt
)
VALUES (
  NEW.id,
  NEW.createdBy,
  'admin',
  NOW()
);

RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS addCreatorAdminTrigger ON public.groups;

CREATE TRIGGER addCreatorAdminTrigger
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.addCreatorAsAdmin();



-- ==============================================================
-- 4. ACCEPT INVITE → ADD MEMBER
-- ==============================================================

CREATE OR REPLACE FUNCTION public.acceptInviteAddMember()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN

INSERT INTO public.groupMembers (
  groupId,
  userId,
  role,
  joinedAt
)
VALUES (
  NEW.groupId,
  NEW.invitedUserId,
  'member',
  NOW()
)
ON CONFLICT DO NOTHING;

END IF;

RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS acceptInviteAddMemberTrigger ON public.groupInvites;

CREATE TRIGGER acceptInviteAddMemberTrigger
AFTER UPDATE ON public.groupInvites
FOR EACH ROW
EXECUTE FUNCTION public.acceptInviteAddMember();



-- ==============================================================
-- 5. APPROVED JOIN REQUEST → ADD MEMBER
-- ==============================================================

CREATE OR REPLACE FUNCTION public.approveJoinRequestAddMember()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

IF NEW.status = 'approved' AND OLD.status = 'pending' THEN

INSERT INTO public.groupMembers (
  groupId,
  userId,
  role,
  joinedAt
)
VALUES (
  NEW.groupId,
  NEW.userId,
  'member',
  NOW()
)
ON CONFLICT DO NOTHING;

END IF;

RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS approveJoinRequestTrigger ON public.groupJoinRequests;

CREATE TRIGGER approveJoinRequestTrigger
AFTER UPDATE ON public.groupJoinRequests
FOR EACH ROW
EXECUTE FUNCTION public.approveJoinRequestAddMember();



-- ==============================================================
-- 6. EXPENSE HISTORY LOGGER
-- ==============================================================

CREATE OR REPLACE FUNCTION public.logExpenseHistory()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

INSERT INTO public.expenseHistory (
  expenseId,
  editedBy,
  oldAmount,
  oldSplitType,
  oldName,
  oldNotes,
  oldExpenseDate,
  createdAt
)
VALUES (
  OLD.id,
  auth.uid(),
  OLD.amount,
  OLD.splitType,
  OLD.name,
  OLD.notes,
  OLD.expenseDate,
  NOW()
);

RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS expenseHistoryTrigger ON public.expenses;

CREATE TRIGGER expenseHistoryTrigger
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.logExpenseHistory();



-- ==============================================================
-- 7. NOTIFY GROUP WHEN EXPENSE CREATED
-- ==============================================================

CREATE OR REPLACE FUNCTION public.notifyExpenseCreated()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

INSERT INTO public.notifications (
  userId,
  groupId,
  type,
  referenceId,
  message
)
SELECT
  gm.userId,
  NEW.groupId,
  'expense_created',
  NEW.id,
  'New expense added: ' || NEW.name
FROM public.groupMembers gm
WHERE gm.groupId = NEW.groupId
AND gm.userId != NEW.createdBy
AND gm.removedAt IS NULL;

RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS notifyExpenseCreatedTrigger ON public.expenses;

CREATE TRIGGER notifyExpenseCreatedTrigger
AFTER INSERT ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.notifyExpenseCreated();



-- ==============================================================
-- 8. NOTIFY GROUP WHEN EXPENSE UPDATED
-- ==============================================================

CREATE OR REPLACE FUNCTION public.notifyExpenseUpdated()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

INSERT INTO public.notifications (
  userId,
  groupId,
  type,
  referenceId,
  message
)
SELECT
  gm.userId,
  NEW.groupId,
  'expense_updated',
  NEW.id,
  'Expense updated: ' || NEW.name
FROM public.groupMembers gm
WHERE gm.groupId = NEW.groupId
AND gm.userId != auth.uid()
AND gm.removedAt IS NULL;

RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS notifyExpenseUpdatedTrigger ON public.expenses;

CREATE TRIGGER notifyExpenseUpdatedTrigger
AFTER UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.notifyExpenseUpdated();



-- ==============================================================
-- 9. NOTIFY GROUP WHEN EXPENSE DELETED
-- ==============================================================

CREATE OR REPLACE FUNCTION public.notifyExpenseDeleted()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

INSERT INTO public.notifications (
  userId,
  groupId,
  type,
  referenceId,
  message
)
SELECT
  gm.userId,
  OLD.groupId,
  'expense_deleted',
  OLD.id,
  'Expense deleted: ' || OLD.name
FROM public.groupMembers gm
WHERE gm.groupId = OLD.groupId
AND gm.userId != auth.uid()
AND gm.removedAt IS NULL;

RETURN OLD;

END;
$$;


DROP TRIGGER IF EXISTS notifyExpenseDeletedTrigger ON public.expenses;

CREATE TRIGGER notifyExpenseDeletedTrigger
AFTER DELETE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.notifyExpenseDeleted();



-- ==============================================================
-- 10. SETTLEMENT NOTIFICATION
-- ==============================================================

CREATE OR REPLACE FUNCTION public.notifySettlement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

INSERT INTO public.notifications (
  userId,
  groupId,
  type,
  referenceId,
  message
)
VALUES (
  NEW.receiverId,
  NEW.groupId,
  'settlement',
  NEW.id,
  'You received a settlement payment'
);

RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS notifySettlementTrigger ON public.settlements;

CREATE TRIGGER notifySettlementTrigger
AFTER INSERT ON public.settlements
FOR EACH ROW
EXECUTE FUNCTION public.notifySettlement();
-- ==============================================================
-- CREATE BUCKETS
-- ==============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
('expense-receipts','expense-receipts',false),
('settlement-receipts','settlement-receipts',false),
('avatars','avatars',true),
('group-images','group-images',false)
ON CONFLICT (id) DO NOTHING;



-- ==============================================================
-- EXPENSE RECEIPTS POLICIES
-- path: expense-receipts/{groupId}/{expenseId}/{file}
-- ==============================================================

DROP POLICY IF EXISTS "View expense receipts" ON storage.objects;
CREATE POLICY "View expense receipts"
ON storage.objects
FOR SELECT
USING (

bucket_id = 'expense-receipts'

AND EXISTS (
  SELECT 1
  FROM public.groups g
  WHERE g.id = (split_part(name,'/',1))::uuid
  AND public.isGroupMember(g.id)
)

);


DROP POLICY IF EXISTS "Upload expense receipts" ON storage.objects;
CREATE POLICY "Upload expense receipts"
ON storage.objects
FOR INSERT
WITH CHECK (

bucket_id = 'expense-receipts'

AND EXISTS (
  SELECT 1
  FROM public.groups g
  WHERE g.id = (split_part(name,'/',1))::uuid
  AND public.isGroupMember(g.id)
)

);


DROP POLICY IF EXISTS "Delete own expense receipt" ON storage.objects;
CREATE POLICY "Delete own expense receipt"
ON storage.objects
FOR DELETE
USING (

bucket_id = 'expense-receipts'
AND owner = auth.uid()

);



-- ==============================================================
-- SETTLEMENT RECEIPTS
-- path: settlement-receipts/{groupId}/{settlementId}/{file}
-- ==============================================================

DROP POLICY IF EXISTS "View settlement receipts" ON storage.objects;
CREATE POLICY "View settlement receipts"
ON storage.objects
FOR SELECT
USING (

bucket_id = 'settlement-receipts'

AND EXISTS (
  SELECT 1
  FROM public.groups g
  WHERE g.id = (split_part(name,'/',1))::uuid
  AND public.isGroupMember(g.id)
)

);


DROP POLICY IF EXISTS "Upload settlement receipts" ON storage.objects;
CREATE POLICY "Upload settlement receipts"
ON storage.objects
FOR INSERT
WITH CHECK (

bucket_id = 'settlement-receipts'
AND auth.uid() IS NOT NULL

);


DROP POLICY IF EXISTS "Delete settlement receipt" ON storage.objects;
CREATE POLICY "Delete settlement receipt"
ON storage.objects
FOR DELETE
USING (

bucket_id = 'settlement-receipts'
AND owner = auth.uid()

);



-- ==============================================================
-- AVATARS
-- path: avatars/{userId}.jpg
-- ==============================================================

DROP POLICY IF EXISTS "Upload avatar" ON storage.objects;
CREATE POLICY "Upload avatar"
ON storage.objects
FOR INSERT
WITH CHECK (

bucket_id = 'avatars'
AND owner = auth.uid()

);


DROP POLICY IF EXISTS "Update avatar" ON storage.objects;
CREATE POLICY "Update avatar"
ON storage.objects
FOR UPDATE
USING (

bucket_id = 'avatars'
AND owner = auth.uid()

);


DROP POLICY IF EXISTS "Delete avatar" ON storage.objects;
CREATE POLICY "Delete avatar"
ON storage.objects
FOR DELETE
USING (

bucket_id = 'avatars'
AND owner = auth.uid()

);



-- ==============================================================
-- GROUP IMAGES
-- path: group-images/{groupId}/cover.jpg
-- ==============================================================
DROP POLICY IF EXISTS "View group images" ON storage.objects;
CREATE POLICY "View group images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'group-images'
AND (
  -- allow viewing temp files if user uploaded them
  (split_part(name,'/',1) = 'temp' AND owner = auth.uid())
  -- allow group members to view group images
  OR (
      split_part(name,'/',1) = 'groups'
      AND EXISTS (
        SELECT 1
        FROM public.groupmembers gm
        WHERE gm.groupid::text = split_part(name,'/',2)
        AND gm.userid = auth.uid()
        AND gm.status = 'active'
      )
    )
  )
);



DROP POLICY IF EXISTS "Upload group image" ON storage.objects;
CREATE POLICY "Upload group image"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'group-images'
  AND (
-- allow temp uploads
  (split_part(name,'/',1) = 'temp')
  OR
-- allow group owner uploads
    (
      split_part(name,'/',1) = 'groups'
      AND EXISTS (
        SELECT 1
        FROM public.groups g
        WHERE g.id::text = split_part(name,'/',2)
        AND g.createdby = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Delete group image" ON storage.objects;
CREATE POLICY "Delete group image"
ON storage.objects
FOR DELETE
USING (
bucket_id = 'group-images'
AND (
  (owner = auth.uid())
  OR (
      split_part(name,'/',1) = 'groups'
      AND EXISTS (
        SELECT 1
        FROM public.groups g
        WHERE g.id::text = split_part(name,'/',2)
        AND g.createdby = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "View temp uploads" ON storage.objects;
CREATE POLICY "View temp uploads"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'group-images'
  AND split_part(name,'/',1) = 'temp'
  AND owner = auth.uid()
);

DROP POLICY IF EXISTS "Insert group images" ON storage.objects;
CREATE POLICY "Insert group images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'group-images'
  AND split_part(name,'/',1) = 'groups'
);

DROP POLICY IF EXISTS "Delete temp uploads" ON storage.objects;
CREATE POLICY "Delete temp uploads"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'group-images'
  AND split_part(name,'/',1) = 'temp'
  AND owner = auth.uid()
);

DROP POLICY IF EXISTS "Update temp objects" ON storage.objects;
CREATE POLICY "Update temp objects"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'group-images'
  AND owner = auth.uid()
);