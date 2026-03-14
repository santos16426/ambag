-- Ambag RPC functions
-- Frontend-friendly JSONB-based CRUD helpers for camelCase schema

-- =====================================================================
-- PROFILES
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createProfile(payload jsonb)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row profiles;
BEGIN
  INSERT INTO public.profiles (id, fullName, avatarUrl, email)
  VALUES (
    COALESCE((payload->>'id')::uuid, auth.uid()),
    payload->>'fullName',
    payload->>'avatarUrl',
    payload->>'email'
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.updateProfile(profileId uuid, payload jsonb)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row profiles;
BEGIN
  UPDATE public.profiles
  SET
    fullName = COALESCE(payload->>'fullName', fullName),
    avatarUrl = COALESCE(payload->>'avatarUrl', avatarUrl),
    email = COALESCE(payload->>'email', email)
  WHERE id = profileId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getprofilebyid(profileid uuid)
RETURNS public.profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.profiles
  WHERE id = profileid;
$$;

GRANT EXECUTE ON FUNCTION public.getprofilebyid(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.deleteProfile(profileId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.profiles
  WHERE id = profileId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createProfile(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateProfile(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getprofilebyid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteProfile(uuid) TO authenticated;

-- =====================================================================
-- USER SEARCH
-- =====================================================================

CREATE OR REPLACE FUNCTION public.searchUsersByEmail(emailquery text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_q text := trim(emailquery);
  v_users jsonb;
BEGIN
  IF v_q IS NULL OR length(v_q) < 3 THEN
    RETURN jsonb_build_object('users', '[]'::jsonb);
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'fullname', p.fullname,
        'avatarurl', p.avatarurl
      )
      ORDER BY p.email ASC
    ),
    '[]'::jsonb
  )
  INTO v_users
  FROM public.profiles p
  WHERE p.email ILIKE '%' || v_q || '%'
  LIMIT 10;

  RETURN jsonb_build_object('users', v_users);
END;
$$;

GRANT EXECUTE ON FUNCTION public.searchUsersByEmail(text) TO authenticated;

-- =====================================================================
-- GROUPS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.updateGroup(groupId uuid, payload jsonb)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row groups;
BEGIN
  UPDATE public.groups
  SET
    name = COALESCE(payload->>'name', name),
    description = COALESCE(payload->>'description', description),
    imageUrl = COALESCE(payload->>'imageUrl', imageUrl),
    archivedAt = COALESCE((payload->>'archivedAt')::timestamptz, archivedAt)
  WHERE id = groupId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getGroupById(groupId uuid)
RETURNS public.groups
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.groups
  WHERE id = groupId;
$$;

CREATE OR REPLACE FUNCTION public.deleteGroup(groupId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.groups
  WHERE id = groupId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.updateGroup(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getGroupById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteGroup(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.removeGroupImage(groupId uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.isGroupMember(groupId) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;
  UPDATE public.groups
  SET imageurl = NULL
  WHERE id = groupId;
END;
$$;

GRANT EXECUTE ON FUNCTION public.removeGroupImage(uuid) TO authenticated;
-- =====================================================================
-- CREATE GROUP
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createGroup(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id uuid := COALESCE((payload->>'id')::uuid, gen_random_uuid());
  v_name text := NULLIF(trim(payload->>'name'), '');
  v_description text := NULLIF(trim(payload->>'description'), '');
  v_imageurl text := NULLIF(trim(payload->>'imageurl'), '');
  v_memberids jsonb := COALESCE(payload->'memberids', '[]'::jsonb);
  v_invite_emails jsonb := COALESCE(payload->'inviteemails', '[]'::jsonb);
  v_member_id uuid;
  v_invite_email text;
  v_image_ext text;
  v_ts bigint;
  v_group jsonb;
BEGIN
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'name is required';
  END IF;

  -- If an image path was provided, normalize it to groups/{groupId}/cover-{timestamp}.ext
  IF v_imageurl IS NOT NULL THEN
    -- Try to infer extension from the provided path; default to jpg
    v_image_ext := COALESCE(NULLIF(split_part(v_imageurl, '.', 2), ''), 'jpg');
    -- Millisecond timestamp
    v_ts := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
    v_imageurl := format('groups/%s/cover-%s.%s', v_group_id::text, v_ts::text, v_image_ext);
  END IF;

  INSERT INTO public.groups (id, name, description, createdby, imageurl, archivedat, invitecode)
  VALUES (
    v_group_id,
    v_name,
    v_description,
    auth.uid(),
    v_imageurl,
    NULL,
    NULL
  );

  FOR v_member_id IN
    SELECT (value)::uuid
    FROM jsonb_array_elements_text(v_memberids)
  LOOP
    INSERT INTO public.groupmembers (groupid, userid, role, status, joinedat)
    VALUES (v_group_id, v_member_id, 'member', 'active', now());
  END LOOP;

  FOR v_invite_email IN
    SELECT trim(value)::text
    FROM jsonb_array_elements_text(v_invite_emails)
  LOOP
    IF v_invite_email IS NULL OR v_invite_email = '' THEN
      CONTINUE;
    END IF;

    INSERT INTO public.groupinvites (groupid, invitedby, inviteduserid, invitedemail, status, invitetoken)
    VALUES (
      v_group_id,
      auth.uid(),
      NULL,
      lower(v_invite_email),
      'pending',
      encode(gen_random_bytes(32), 'hex')
    );
  END LOOP;

  SELECT jsonb_build_object(
    'id', g.id,
    'name', g.name,
    'description', g.description,
    'invitecode', g.invitecode,
    'imageurl', g.imageurl,
    'createdat', g.createdat,
    'archivedat', g.archivedat,
    'createdbyid', g.createdby,
    'role', gm.role::text,
    'membercount', stats.member_count,
    'pendingjoinrequestcount', stats.pending_join_count,
    'pendinginvitationcount', stats.pending_invite_count,
    'totalexpenses', stats.total_expenses,
    'totalsettlements', stats.total_settlements,
    'createdby', jsonb_build_object(
      'id', creator.id,
      'fullname', creator.fullname,
      'avatarurl', creator.avatarurl
    )
  )
  INTO v_group
  FROM public.groupmembers gm
  JOIN public.groups g ON g.id = gm.groupid
  LEFT JOIN public.profiles creator ON creator.id = g.createdby
  LEFT JOIN LATERAL (
    SELECT
      (SELECT COUNT(*)::int FROM public.groupmembers gm2 WHERE gm2.groupid = g.id AND (gm2.removedat IS NULL)) AS member_count,
      (SELECT COUNT(*)::int FROM public.groupjoinrequests gjr WHERE gjr.groupid = g.id AND gjr.status = 'pending') AS pending_join_count,
      (SELECT COUNT(*)::int FROM public.groupinvites gi WHERE gi.groupid = g.id AND gi.status = 'pending') AS pending_invite_count,
      (SELECT COALESCE(SUM(e.amount), 0) FROM public.expenses e WHERE e.groupid = g.id) AS total_expenses,
      (SELECT COALESCE(SUM(s.amount), 0) FROM public.settlements s WHERE s.groupid = g.id) AS total_settlements
  ) stats ON true
  WHERE gm.groupid = v_group_id
    AND gm.userid = auth.uid()
    AND (gm.removedat IS NULL)
  LIMIT 1;

  RETURN jsonb_build_object('group', v_group, 'autoapproved', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.createGroup(jsonb) TO authenticated;

-- =====================================================================
-- GROUP MEMBERS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createGroupMember(payload jsonb)
RETURNS public.groupmembers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row public.groupmembers;
BEGIN
  INSERT INTO public.groupmembers (groupid, userid, role, status, joinedat, removedat)
  VALUES (
    (payload->>'groupid')::uuid,
    COALESCE((payload->>'userid')::uuid, auth.uid()),
    COALESCE((payload->>'role')::groupRole, 'member'),
    COALESCE(payload->>'status', 'active'),
    COALESCE((payload->>'joinedat')::timestamptz, NOW()),
    (payload->>'removedat')::timestamptz
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.updateGroupMember(memberId uuid, payload jsonb)
RETURNS public.groupmembers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row public.groupmembers;
BEGIN
  UPDATE public.groupmembers
  SET
    role = COALESCE((payload->>'role')::groupRole, role),
    status = COALESCE(payload->>'status', status),
    removedat = COALESCE((payload->>'removedat')::timestamptz, removedat)
  WHERE id = memberId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getGroupMemberById(memberId uuid)
RETURNS public.groupmembers
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.groupmembers
  WHERE id = memberId;
$$;

CREATE OR REPLACE FUNCTION public.deleteGroupMember(memberId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.groupmembers
  WHERE id = memberId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createGroupMember(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateGroupMember(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getGroupMemberById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteGroupMember(uuid) TO authenticated;

-- =====================================================================
-- EXPENSES
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createExpense(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row expenses;
  image_upload jsonb;
  use_id uuid := (payload->>'id')::uuid;
  use_receipt_url text := NULLIF(trim(payload->>'receiptUrl'), '');
BEGIN
  INSERT INTO public.expenses (id, groupId, createdBy, name, amount, splitType, notes, expenseDate, receiptUrl)
  VALUES (
    COALESCE(use_id, gen_random_uuid()),
    (payload->>'groupId')::uuid,
    COALESCE((payload->>'createdBy')::uuid, auth.uid()),
    payload->>'name',
    (payload->>'amount')::numeric,
    payload->>'splitType',
    payload->>'notes',
    COALESCE((payload->>'expenseDate')::timestamptz, NOW()),
    use_receipt_url
  )
  RETURNING * INTO new_row;

  image_upload := public.getImageUploadPath(
    jsonb_build_object('entityType', 'expense', 'entityId', new_row.id, 'groupId', new_row.groupId, 'fileName', COALESCE(payload->>'receiptFileName', 'receipt.jpg'))
  );
  RETURN jsonb_build_object(
    'expense', to_jsonb(new_row),
    'imageUpload', image_upload
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.updateExpense(expenseId uuid, payload jsonb)
RETURNS public.expenses
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row expenses;
BEGIN
  UPDATE public.expenses
  SET
    name = COALESCE(payload->>'name', name),
    amount = COALESCE((payload->>'amount')::numeric, amount),
    splitType = COALESCE(payload->>'splitType', splitType),
    notes = COALESCE(payload->>'notes', notes),
    expenseDate = COALESCE((payload->>'expenseDate')::timestamptz, expenseDate),
    receiptUrl = COALESCE(payload->>'receiptUrl', receiptUrl)
  WHERE id = expenseId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getExpenseById(expenseId uuid)
RETURNS public.expenses
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.expenses
  WHERE id = expenseId;
$$;

CREATE OR REPLACE FUNCTION public.deleteExpense(expenseId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.expenses
  WHERE id = expenseId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createExpense(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateExpense(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getExpenseById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteExpense(uuid) TO authenticated;

-- =====================================================================
-- EXPENSE PAYERS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createExpensePayer(payload jsonb)
RETURNS public.expensePayers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row public.expensePayers;
BEGIN
  INSERT INTO public."expensePayers" (expenseId, userId, amountPaid)
  VALUES (
    (payload->>'expenseId')::uuid,
    (payload->>'userId')::uuid,
    (payload->>'amountPaid')::numeric
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.updateExpensePayer(expensePayerId uuid, payload jsonb)
RETURNS public.expensePayers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row public.expensePayers;
BEGIN
  UPDATE public."expensePayers"
  SET
    amountPaid = COALESCE((payload->>'amountPaid')::numeric, amountPaid)
  WHERE id = expensePayerId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getExpensePayerById(expensePayerId uuid)
RETURNS public.expensePayers
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.expensePayers
  WHERE id = expensePayerId;
$$;

CREATE OR REPLACE FUNCTION public.deleteExpensePayer(expensePayerId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public."expensePayers"
  WHERE id = expensePayerId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createExpensePayer(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateExpensePayer(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getExpensePayerById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteExpensePayer(uuid) TO authenticated;

-- =====================================================================
-- EXPENSE PARTICIPANTS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createExpenseParticipant(payload jsonb)
RETURNS public.expenseParticipants
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row public.expenseParticipants;
BEGIN
  INSERT INTO public."expenseParticipants" (expenseId, userId)
  VALUES (
    (payload->>'expenseId')::uuid,
    (payload->>'userId')::uuid
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.updateExpenseParticipant(expenseParticipantId uuid, payload jsonb)
RETURNS public.expenseParticipants
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row public.expenseParticipants;
BEGIN
  UPDATE public."expenseParticipants"
  SET
    expenseId = COALESCE((payload->>'expenseId')::uuid, expenseId),
    userId = COALESCE((payload->>'userId')::uuid, userId)
  WHERE id = expenseParticipantId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getExpenseParticipantById(expenseParticipantId uuid)
RETURNS public.expenseParticipants
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.expenseParticipants
  WHERE id = expenseParticipantId;
$$;

CREATE OR REPLACE FUNCTION public.deleteExpenseParticipant(expenseParticipantId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.expenseParticipants
  WHERE id = expenseParticipantId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createExpenseParticipant(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateExpenseParticipant(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getExpenseParticipantById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteExpenseParticipant(uuid) TO authenticated;

-- =====================================================================
-- EXPENSE SPLITS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createExpenseSplit(payload jsonb)
RETURNS public.expenseSplits
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row public.expenseSplits;
BEGIN
  INSERT INTO public."expenseSplits" (expenseId, userId, amountOwed, percent, shares)
  VALUES (
    (payload->>'expenseId')::uuid,
    (payload->>'userId')::uuid,
    (payload->>'amountOwed')::numeric,
    (payload->>'percent')::numeric,
    (payload->>'shares')::numeric
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.updateExpenseSplit(expenseSplitId uuid, payload jsonb)
RETURNS public.expenseSplits
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row public.expenseSplits;
BEGIN
  UPDATE public."expenseSplits"
  SET
    amountOwed = COALESCE((payload->>'amountOwed')::numeric, amountOwed),
    percent = COALESCE((payload->>'percent')::numeric, percent),
    shares = COALESCE((payload->>'shares')::numeric, shares)
  WHERE id = expenseSplitId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getExpenseSplitById(expenseSplitId uuid)
RETURNS public.expenseSplits
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.expenseSplits
  WHERE id = expenseSplitId;
$$;

CREATE OR REPLACE FUNCTION public.deleteExpenseSplit(expenseSplitId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public."expenseSplits"
  WHERE id = expenseSplitId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createExpenseSplit(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateExpenseSplit(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getExpenseSplitById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteExpenseSplit(uuid) TO authenticated;

-- =====================================================================
-- PAYMENT METHODS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createPaymentMethod(payload jsonb)
RETURNS public.paymentMethods
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row public.paymentMethods;
BEGIN
  INSERT INTO public."paymentMethods" (userId, type, accountName, accountNumber, bankType, qrCodeUrl)
  VALUES (
    COALESCE((payload->>'userId')::uuid, auth.uid()),
    payload->>'type',
    payload->>'accountName',
    payload->>'accountNumber',
    payload->>'bankType',
    payload->>'qrCodeUrl'
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.updatePaymentMethod(paymentMethodId uuid, payload jsonb)
RETURNS public.paymentMethods
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row public.paymentMethods;
BEGIN
  UPDATE public.paymentMethods
  SET
    type = COALESCE(payload->>'type', type),
    accountName = COALESCE(payload->>'accountName', accountName),
    accountNumber = COALESCE(payload->>'accountNumber', accountNumber),
    bankType = COALESCE(payload->>'bankType', bankType),
    qrCodeUrl = COALESCE(payload->>'qrCodeUrl', qrCodeUrl)
  WHERE id = paymentMethodId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getPaymentMethodById(paymentMethodId uuid)
RETURNS public.paymentMethods
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.paymentMethods
  WHERE id = paymentMethodId;
$$;

CREATE OR REPLACE FUNCTION public.deletePaymentMethod(paymentMethodId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.paymentMethods
  WHERE id = paymentMethodId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createPaymentMethod(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updatePaymentMethod(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getPaymentMethodById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deletePaymentMethod(uuid) TO authenticated;

-- =====================================================================
-- SETTLEMENTS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createSettlement(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row settlements;
  image_upload jsonb;
  use_id uuid := (payload->>'id')::uuid;
  use_receipt_url text := NULLIF(trim(payload->>'receiptUrl'), '');
BEGIN
  INSERT INTO public.settlements (id, groupId, payerId, receiverId, amount, paymentMethodId, receiptUrl)
  VALUES (
    COALESCE(use_id, gen_random_uuid()),
    (payload->>'groupId')::uuid,
    (payload->>'payerId')::uuid,
    (payload->>'receiverId')::uuid,
    (payload->>'amount')::numeric,
    (payload->>'paymentMethodId')::uuid,
    use_receipt_url
  )
  RETURNING * INTO new_row;

  image_upload := public.getImageUploadPath(
    jsonb_build_object('entityType', 'settlement', 'entityId', new_row.id, 'groupId', new_row.groupId, 'fileName', COALESCE(payload->>'receiptFileName', 'receipt.jpg'))
  );
  RETURN jsonb_build_object(
    'settlement', to_jsonb(new_row),
    'imageUpload', image_upload
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.updateSettlement(settlementId uuid, payload jsonb)
RETURNS public.settlements
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row settlements;
BEGIN
  UPDATE public.settlements
  SET
    amount = COALESCE((payload->>'amount')::numeric, amount),
    paymentMethodId = COALESCE((payload->>'paymentMethodId')::uuid, paymentMethodId),
    receiptUrl = COALESCE(payload->>'receiptUrl', receiptUrl),
    deletedAt = COALESCE((payload->>'deletedAt')::timestamptz, deletedAt)
  WHERE id = settlementId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getSettlementById(settlementId uuid)
RETURNS public.settlements
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.settlements
  WHERE id = settlementId;
$$;

CREATE OR REPLACE FUNCTION public.deleteSettlement(settlementId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.settlements
  WHERE id = settlementId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createSettlement(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateSettlement(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getSettlementById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteSettlement(uuid) TO authenticated;

-- =====================================================================
-- NOTIFICATIONS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createNotificationRpc(payload jsonb)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row notifications;
BEGIN
  INSERT INTO public.notifications (userId, groupId, type, referenceId, message, isRead)
  VALUES (
    (payload->>'userId')::uuid,
    (payload->>'groupId')::uuid,
    payload->>'type',
    (payload->>'referenceId')::uuid,
    payload->>'message',
    COALESCE((payload->>'isRead')::boolean, FALSE)
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.updateNotificationRpc(notificationId uuid, payload jsonb)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row notifications;
BEGIN
  UPDATE public.notifications
  SET
    message = COALESCE(payload->>'message', message),
    isRead = COALESCE((payload->>'isRead')::boolean, isRead)
  WHERE id = notificationId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getNotificationById(notificationId uuid)
RETURNS public.notifications
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.notifications
  WHERE id = notificationId;
$$;

CREATE OR REPLACE FUNCTION public.deleteNotification(notificationId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.notifications
  WHERE id = notificationId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createNotificationRpc(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateNotificationRpc(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getNotificationById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteNotification(uuid) TO authenticated;

-- =====================================================================
-- GROUP INVITES
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createGroupInvite(payload jsonb)
RETURNS public.groupInvites
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row public.groupInvites;
BEGIN
  INSERT INTO public.groupInvites (groupId, invitedBy, invitedUserId, invitedEmail, status, inviteToken)
  VALUES (
    (payload->>'groupId')::uuid,
    COALESCE((payload->>'invitedBy')::uuid, auth.uid()),
    (payload->>'invitedUserId')::uuid,
    payload->>'invitedEmail',
    COALESCE(payload->>'status', 'pending'),
    payload->>'inviteToken'
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.updateGroupInvite(groupInviteId uuid, payload jsonb)
RETURNS public.groupInvites
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row public.groupInvites;
BEGIN
  UPDATE public.groupInvites
  SET
    status = COALESCE(payload->>'status', status),
    respondedAt = COALESCE((payload->>'respondedAt')::timestamptz, respondedAt)
  WHERE id = groupInviteId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getGroupInviteById(groupInviteId uuid)
RETURNS public.groupInvites
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.groupInvites
  WHERE id = groupInviteId;
$$;

CREATE OR REPLACE FUNCTION public.deleteGroupInvite(groupInviteId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.groupInvites
  WHERE id = groupInviteId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createGroupInvite(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateGroupInvite(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getGroupInviteById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteGroupInvite(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.acceptInviteByToken(inviteToken text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  -- Require an authenticated user; we need a userId to add to groupMembers
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Find the pending invite for this token
  SELECT groupId
  INTO v_group_id
  FROM public.groupInvites
  WHERE inviteToken = acceptInviteByToken.inviteToken
    AND status = 'pending'
  LIMIT 1;

  IF v_group_id IS NULL THEN
    RETURN false;
  END IF;

  -- Upsert membership for the current user into the group
  INSERT INTO public.groupMembers (groupId, userId, role, status, joinedAt)
  VALUES (v_group_id, auth.uid(), 'member', 'active', NOW())
  ON CONFLICT (groupId, userId) DO UPDATE
  SET
    status = 'active',
    removedAt = NULL;

  -- Remove the invite row so the token cannot be reused
  DELETE FROM public.groupInvites
  WHERE inviteToken = acceptInviteByToken.inviteToken;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.acceptInviteByToken(text) TO anon;

-- =====================================================================
-- GROUP JOIN REQUESTS
-- =====================================================================

-- =====================================================================
-- JOIN GROUP BY INVITE CODE
-- =====================================================================
-- Invite code is treated as an access key: caller is immediately added as a member.

CREATE OR REPLACE FUNCTION public.joinGroupByInviteCode(invitecode text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text := upper(trim(invitecode));
  v_group_id uuid;
  v_member_id uuid;
  v_group jsonb;
  v_user_email text;
BEGIN
  SELECT g.id
  INTO v_group_id
  FROM public.groups g
  WHERE g.invitecode = v_code;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  SELECT gm.id
  INTO v_member_id
  FROM public.groupmembers gm
  WHERE gm.groupid = v_group_id
    AND gm.userid = auth.uid()
  LIMIT 1;

  IF v_member_id IS NOT NULL THEN
    UPDATE public.groupmembers
    SET removedat = NULL, status = 'active', joinedat = now()
    WHERE id = v_member_id;
  ELSE
    INSERT INTO public.groupmembers (groupid, userid, role, status, joinedat)
    VALUES (v_group_id, auth.uid(), 'member', 'active', now())
    RETURNING id INTO v_member_id;
  END IF;

  -- If this user was previously invited by email (pending invitation), delete the invitation
  -- record; they are already a member (inserted above).
  SELECT p.email INTO v_user_email FROM public.profiles p WHERE p.id = auth.uid();
  IF v_user_email IS NOT NULL AND trim(v_user_email) <> '' THEN
    DELETE FROM public.groupinvites
    WHERE groupid = v_group_id
      AND status = 'pending'
      AND lower(trim(invitedemail)) = lower(trim(v_user_email));
  END IF;

  -- Return the same group summary object shape as getUserGroupsSummary items (lowercase keys).
  SELECT jsonb_build_object(
    'id', g.id,
    'name', g.name,
    'description', g.description,
    'invitecode', g.invitecode,
    'imageurl', g.imageurl,
    'createdat', g.createdat,
    'archivedat', g.archivedat,
    'createdbyid', g.createdby,
    'role', gm.role::text,
    'membercount', stats.member_count,
    'pendingjoinrequestcount', stats.pending_join_count,
    'pendinginvitationcount', stats.pending_invite_count,
    'totalexpenses', stats.total_expenses,
    'totalsettlements', stats.total_settlements,
    'createdby', jsonb_build_object(
      'id', creator.id,
      'fullname', creator.fullname,
      'avatarurl', creator.avatarurl
    )
  )
  INTO v_group
  FROM public.groupmembers gm
  JOIN public.groups g ON g.id = gm.groupid
  LEFT JOIN public.profiles creator ON creator.id = g.createdby
  LEFT JOIN LATERAL (
    SELECT
      (SELECT COUNT(*)::int FROM public.groupmembers gm2 WHERE gm2.groupid = g.id AND (gm2.removedat IS NULL)) AS member_count,
      (SELECT COUNT(*)::int FROM public.groupjoinrequests gjr WHERE gjr.groupid = g.id AND gjr.status = 'pending') AS pending_join_count,
      (SELECT COUNT(*)::int FROM public.groupinvites gi WHERE gi.groupid = g.id AND gi.status = 'pending') AS pending_invite_count,
      (SELECT COALESCE(SUM(e.amount), 0) FROM public.expenses e WHERE e.groupid = g.id) AS total_expenses,
      (SELECT COALESCE(SUM(s.amount), 0) FROM public.settlements s WHERE s.groupid = g.id) AS total_settlements
  ) stats ON true
  WHERE gm.groupid = v_group_id
    AND gm.userid = auth.uid()
    AND (gm.removedat IS NULL)
  LIMIT 1;

  RETURN jsonb_build_object('group', v_group, 'autoapproved', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.joinGroupByInviteCode(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.joinGroupByInviteCode(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.createGroupJoinRequest(payload jsonb)
RETURNS public.groupJoinRequests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row public.groupJoinRequests;
BEGIN
  INSERT INTO public.groupJoinRequests (groupId, userId, status, requestedAt)
  VALUES (
    (payload->>'groupId')::uuid,
    COALESCE((payload->>'userId')::uuid, auth.uid()),
    COALESCE(payload->>'status', 'pending'),
    COALESCE((payload->>'requestedAt')::timestamptz, NOW())
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.updateGroupJoinRequest(groupJoinRequestId uuid, payload jsonb)
RETURNS public.groupJoinRequests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row public.groupJoinRequests;
BEGIN
  UPDATE public.groupJoinRequests
  SET
    status = COALESCE(payload->>'status', status),
    respondedAt = COALESCE((payload->>'respondedAt')::timestamptz, respondedAt)
  WHERE id = groupJoinRequestId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getGroupJoinRequestById(groupJoinRequestId uuid)
RETURNS public.groupJoinRequests
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.groupJoinRequests
  WHERE id = groupJoinRequestId;
$$;

CREATE OR REPLACE FUNCTION public.deleteGroupJoinRequest(groupJoinRequestId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.groupJoinRequests
  WHERE id = groupJoinRequestId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createGroupJoinRequest(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateGroupJoinRequest(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getGroupJoinRequestById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteGroupJoinRequest(uuid) TO authenticated;

-- =====================================================================
-- EXPENSE HISTORY (READ-ONLY)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.getExpenseHistoryByExpenseId(expenseId uuid)
RETURNS SETOF public.expenseHistory
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.expenseHistory
  WHERE expenseHistory.expenseId = expenseId
  ORDER BY expenseHistory.createdAt DESC;
$$;

GRANT EXECUTE ON FUNCTION public.getExpenseHistoryByExpenseId(uuid) TO authenticated;

-- =====================================================================
-- EXPENSE ITEMS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createExpenseItem(payload jsonb)
RETURNS public.expenseItems
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row public.expenseItems;
BEGIN
  INSERT INTO public.expenseItems (expenseId, name, amount)
  VALUES (
    (payload->>'expenseId')::uuid,
    payload->>'name',
    (payload->>'amount')::numeric
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.updateExpenseItem(expenseItemId uuid, payload jsonb)
RETURNS public.expenseItems
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row public.expenseItems;
BEGIN
  UPDATE public.expenseItems
  SET
    name = COALESCE(payload->>'name', name),
    amount = COALESCE((payload->>'amount')::numeric, amount)
  WHERE id = expenseItemId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getExpenseItemById(expenseItemId uuid)
RETURNS public.expenseItems
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.expenseItems
  WHERE id = expenseItemId;
$$;

CREATE OR REPLACE FUNCTION public.deleteExpenseItem(expenseItemId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.expenseItems
  WHERE id = expenseItemId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createExpenseItem(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateExpenseItem(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getExpenseItemById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteExpenseItem(uuid) TO authenticated;

-- =====================================================================
-- EXPENSE ITEM PARTICIPANTS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.createExpenseItemParticipant(payload jsonb)
RETURNS public.expenseItemParticipants
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_row public.expenseItemParticipants;
BEGIN
  INSERT INTO public.expenseItemParticipants (itemId, userId, share)
  VALUES (
    (payload->>'itemId')::uuid,
    (payload->>'userId')::uuid,
    (payload->>'share')::numeric
  )
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.updateExpenseItemParticipant(expenseItemParticipantId uuid, payload jsonb)
RETURNS public.expenseItemParticipants
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row public.expenseItemParticipants;
BEGIN
  UPDATE public.expenseItemParticipants
  SET
    share = COALESCE((payload->>'share')::numeric, share)
  WHERE id = expenseItemParticipantId
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.getExpenseItemParticipantById(expenseItemParticipantId uuid)
RETURNS public.expenseItemParticipants
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.expenseItemParticipants
  WHERE id = expenseItemParticipantId;
$$;

CREATE OR REPLACE FUNCTION public.deleteExpenseItemParticipant(expenseItemParticipantId uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.expenseItemParticipants
  WHERE id = expenseItemParticipantId;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.createExpenseItemParticipant(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.updateExpenseItemParticipant(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.getExpenseItemParticipantById(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deleteExpenseItemParticipant(uuid) TO authenticated;

-- =====================================================================
-- IMAGE UPLOADS
-- =====================================================================
-- Use getImageUploadPath to get bucket + path, then upload via Storage API,
-- then call saveImageUrl to persist the URL on the correct table.

CREATE OR REPLACE FUNCTION public.getImageUploadPath(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entity_type text := COALESCE(payload->>'entitytype', payload->>'entityType');
  v_entity_id uuid := (COALESCE(payload->>'entityid', payload->>'entityId'))::uuid;
  v_file_name text := COALESCE(payload->>'filename', payload->>'fileName', 'image');
  v_bucket text;
  v_path text;
  v_uid uuid := auth.uid();
BEGIN
  -- Ensure we have a file extension or default to .jpg
  IF v_file_name !~ '\.' THEN
    v_file_name := v_file_name || '.jpg';
  END IF;

  CASE v_entity_type
    WHEN 'profile' THEN
      IF v_entity_id IS NULL THEN
        v_entity_id := v_uid;
      END IF;
      IF v_entity_id != v_uid THEN
        RAISE EXCEPTION 'Can only upload avatar for own profile';
      END IF;
      v_bucket := 'avatars';
      v_path := v_entity_id::text || '/' || v_file_name;

    WHEN 'group' THEN
      IF v_entity_id IS NULL THEN
        RAISE EXCEPTION 'entityId (groupId) required for group image. Use a client-generated UUID for new groups.';
      END IF;
      -- Allow if existing group and member, OR if group does not exist yet (upload-first for new group)
      IF EXISTS (SELECT 1 FROM public.groups WHERE id = v_entity_id) AND NOT public.isGroupMember(v_entity_id) THEN
        RAISE EXCEPTION 'Not a member of this group';
      END IF;
      v_bucket := 'group-images';
      v_path := v_entity_id::text || '/' || v_file_name;

    WHEN 'expense' THEN
      IF v_entity_id IS NULL THEN
        RAISE EXCEPTION 'entityId (expenseId) required for expense receipt. Use a client-generated UUID for new expenses.';
      END IF;
      IF EXISTS (SELECT 1 FROM public.expenses e WHERE e.id = v_entity_id) THEN
        IF NOT EXISTS (SELECT 1 FROM public.expenses e WHERE e.id = v_entity_id AND public.isGroupMember(e.groupid)) THEN
          RAISE EXCEPTION 'No access to this expense';
        END IF;
      ELSE
        -- Pending expense: require groupId and membership (upload-first flow)
        IF NOT public.isGroupMember((COALESCE(payload->>'groupid', payload->>'groupId'))::uuid) THEN
          RAISE EXCEPTION 'groupId required and you must be a member for new expense receipt';
        END IF;
      END IF;
      v_bucket := 'expense-receipts';
      v_path := v_entity_id::text || '/' || v_file_name;

    WHEN 'settlement' THEN
      IF v_entity_id IS NULL THEN
        RAISE EXCEPTION 'entityId (settlementId) required for settlement receipt. Use a client-generated UUID for new settlements.';
      END IF;
      IF EXISTS (SELECT 1 FROM public.settlements s WHERE s.id = v_entity_id) THEN
        IF NOT EXISTS (SELECT 1 FROM public.settlements s WHERE s.id = v_entity_id AND public.isGroupMember(s.groupid)) THEN
          RAISE EXCEPTION 'No access to this settlement';
        END IF;
      ELSE
        IF NOT public.isGroupMember((COALESCE(payload->>'groupid', payload->>'groupId'))::uuid) THEN
          RAISE EXCEPTION 'groupId required and you must be a member for new settlement receipt';
        END IF;
      END IF;
      v_bucket := 'settlement-receipts';
      v_path := v_entity_id::text || '/' || v_file_name;

    ELSE
      RAISE EXCEPTION 'Invalid entityType. Use: profile, group, expense, settlement';
  END CASE;

  RETURN jsonb_build_object(
    'bucket', v_bucket,
    'path', v_path,
    'filename', v_file_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.saveImageUrl(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entity_type text := COALESCE(payload->>'entitytype', payload->>'entityType');
  v_entity_id uuid := (COALESCE(payload->>'entityid', payload->>'entityId'))::uuid;
  v_image_url text := COALESCE(payload->>'imageurl', payload->>'imageUrl');
  v_uid uuid := auth.uid();
BEGIN
  IF v_image_url IS NULL OR trim(v_image_url) = '' THEN
    RAISE EXCEPTION 'imageUrl is required';
  END IF;

  CASE v_entity_type
    WHEN 'profile' THEN
      IF v_entity_id IS NULL THEN
        v_entity_id := v_uid;
      END IF;
      IF v_entity_id != v_uid THEN
        RAISE EXCEPTION 'Can only update own profile avatar';
      END IF;
      UPDATE public.profiles
      SET avatarurl = v_image_url
      WHERE id = v_entity_id;
      RETURN jsonb_build_object('entitytype', 'profile', 'entityid', v_entity_id, 'imageurl', v_image_url);

    WHEN 'group' THEN
      IF v_entity_id IS NULL THEN
        RAISE EXCEPTION 'entityId (groupId) required';
      END IF;
      IF NOT public.isGroupMember(v_entity_id) THEN
        RAISE EXCEPTION 'Not a member of this group';
      END IF;
      UPDATE public.groups
      SET imageurl = v_image_url
      WHERE id = v_entity_id;
      RETURN jsonb_build_object('entitytype', 'group', 'entityid', v_entity_id, 'imageurl', v_image_url);

    WHEN 'expense' THEN
      IF v_entity_id IS NULL THEN
        RAISE EXCEPTION 'entityId (expenseId) required';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.id = v_entity_id AND public.isGroupMember(e.groupid)
      ) THEN
        RAISE EXCEPTION 'No access to this expense';
      END IF;
      UPDATE public.expenses
      SET receipturl = v_image_url
      WHERE id = v_entity_id;
      RETURN jsonb_build_object('entitytype', 'expense', 'entityid', v_entity_id, 'imageurl', v_image_url);

    WHEN 'settlement' THEN
      IF v_entity_id IS NULL THEN
        RAISE EXCEPTION 'entityId (settlementId) required';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM public.settlements s
        WHERE s.id = v_entity_id AND public.isGroupMember(s.groupid)
      ) THEN
        RAISE EXCEPTION 'No access to this settlement';
      END IF;
      UPDATE public.settlements
      SET receipturl = v_image_url
      WHERE id = v_entity_id;
      RETURN jsonb_build_object('entitytype', 'settlement', 'entityid', v_entity_id, 'imageurl', v_image_url);

    ELSE
      RAISE EXCEPTION 'Invalid entityType. Use: profile, group, expense, settlement';
  END CASE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.getImageUploadPath(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saveImageUrl(jsonb) TO authenticated;

-- =====================================================================
-- USER GROUPS SUMMARY
-- =====================================================================
-- Returns all groups for the current user with role, counts, totals, and creator.

CREATE OR REPLACE FUNCTION public.getUserGroupsSummary(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'description', g.description,
        'invitecode', g.invitecode,
        'imageurl', g.imageurl,
        'createdat', g.createdat,
        'archivedat', g.archivedat,
        'createdbyid', g.createdby,
        'role', gm.role::text,
        'membercount', stats.member_count,
        'pendingjoinrequestcount', stats.pending_join_count,
        'pendinginvitationcount', stats.pending_invite_count,
        'totalexpenses', stats.total_expenses,
        'totalsettlements', stats.total_settlements,
        'createdby', jsonb_build_object(
          'id', creator.id,
          'fullname', creator.fullname,
          'avatarurl', creator.avatarurl
        )
      )
      ORDER BY gm.joinedat DESC
    ),
    '[]'::jsonb
  ) INTO v_result
  FROM public.groupmembers gm
  JOIN public.groups g ON g.id = gm.groupid
  LEFT JOIN public.profiles creator ON creator.id = g.createdby
  LEFT JOIN LATERAL (
    SELECT
      (SELECT COUNT(*)::int FROM public.groupmembers gm2 WHERE gm2.groupid = g.id AND (gm2.removedat IS NULL)) AS member_count,
      (SELECT COUNT(*)::int FROM public.groupjoinrequests gjr WHERE gjr.groupid = g.id AND gjr.status = 'pending') AS pending_join_count,
      (SELECT COUNT(*)::int FROM public.groupinvites gi WHERE gi.groupid = g.id AND gi.status = 'pending') AS pending_invite_count,
      (SELECT COALESCE(SUM(e.amount), 0) FROM public.expenses e WHERE e.groupid = g.id) AS total_expenses,
      (SELECT COALESCE(SUM(s.amount), 0) FROM public.settlements s WHERE s.groupid = g.id) AS total_settlements
  ) stats ON true
  WHERE gm.userid = p_user_id
    AND (gm.removedat IS NULL);

  RETURN jsonb_build_object('groups', COALESCE(v_result, '[]'::jsonb));
END;
$$;

COMMENT ON FUNCTION public.getUserGroupsSummary(uuid) IS
  'Returns all groups for a user with role, memberCount, pendingJoinRequestCount, pendingInvitationCount, totalExpenses, totalSettlements, and createdBy (name, avatar).';

GRANT EXECUTE ON FUNCTION public.getUserGroupsSummary(uuid) TO authenticated;

-- =====================================================================
-- GROUP DETAILS (single group + combined members list)
-- =====================================================================
-- Returns group details and a single members array combining groupmembers
-- and pending invites, each item with a type indicator: 'member' | 'pending_invite'.

CREATE OR REPLACE FUNCTION public.getGroupDetails(p_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_group jsonb;
  v_members jsonb;
BEGIN
  IF NOT public.isGroupMember(p_group_id) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  -- Single group object (same shape as one item from getUserGroupsSummary).
  SELECT jsonb_build_object(
    'id', g.id,
    'name', g.name,
    'description', g.description,
    'invitecode', g.invitecode,
    'imageurl', g.imageurl,
    'createdat', g.createdat,
    'archivedat', g.archivedat,
    'createdbyid', g.createdby,
    'membercount', stats.member_count,
    'pendingjoinrequestcount', stats.pending_join_count,
    'pendinginvitationcount', stats.pending_invite_count,
    'totalexpenses', stats.total_expenses,
    'totalsettlements', stats.total_settlements,
    'createdby', jsonb_build_object(
      'id', creator.id,
      'fullname', creator.fullname,
      'avatarurl', creator.avatarurl
    )
  )
  INTO v_group
  FROM public.groups g
  LEFT JOIN public.profiles creator ON creator.id = g.createdby
  LEFT JOIN LATERAL (
    SELECT
      (SELECT COUNT(*)::int FROM public.groupmembers gm2 WHERE gm2.groupid = g.id AND (gm2.removedat IS NULL)) AS member_count,
      (SELECT COUNT(*)::int FROM public.groupjoinrequests gjr WHERE gjr.groupid = g.id AND gjr.status = 'pending') AS pending_join_count,
      (SELECT COUNT(*)::int FROM public.groupinvites gi WHERE gi.groupid = g.id AND gi.status = 'pending') AS pending_invite_count,
      (SELECT COALESCE(SUM(e.amount), 0) FROM public.expenses e WHERE e.groupid = g.id) AS total_expenses,
      (SELECT COALESCE(SUM(s.amount), 0) FROM public.settlements s WHERE s.groupid = g.id) AS total_settlements
  ) stats ON true
  WHERE g.id = p_group_id;

  IF v_group IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  -- Combined members: groupmembers (type 'member') + groupinvites (type 'pending_invite').
  SELECT COALESCE(
    (
      SELECT jsonb_agg(row ORDER BY sort_key)
      FROM (
        -- Active members
        SELECT
          1 AS sort_key,
          'member'::text AS type,
          gm.id,
          gm.role::text AS role,
          gm.joinedat AS joined_at,
          jsonb_build_object(
            'id', p.id,
            'email', p.email,
            'fullname', p.fullname,
            'avatarurl', p.avatarurl
          ) AS user,
          NULL::text AS email,
          NULL::timestamptz AS invited_at
        FROM public.groupmembers gm
        JOIN public.profiles p ON p.id = gm.userid
        WHERE gm.groupid = p_group_id
          AND (gm.removedat IS NULL)
          AND gm.status = 'active'

        UNION ALL

        -- Pending invites (no user; use email and type)
        SELECT
          2 AS sort_key,
          'pending_invite'::text AS type,
          gi.id,
          'member'::text AS role,
          NULL::timestamptz AS joined_at,
          NULL::jsonb AS user,
          gi.invitedemail AS email,
          gi.createdat AS invited_at
        FROM public.groupinvites gi
        WHERE gi.groupid = p_group_id
          AND gi.status = 'pending'
      ) row
    ),
    '[]'::jsonb
  ) INTO v_members;

  RETURN jsonb_build_object(
    'group', v_group,
    'members', COALESCE(v_members, '[]'::jsonb)
  );
END;
$$;

COMMENT ON FUNCTION public.getGroupDetails(uuid) IS
  'Returns group details and a combined members array (groupmembers + pending invites) with type indicator: member | pending_invite.';

GRANT EXECUTE ON FUNCTION public.getGroupDetails(uuid) TO authenticated;

-- =====================================================================
-- GROUP TRANSACTIONS FEED
-- =====================================================================
-- Unified list of expenses and settlements for a group, sorted by date.
-- Each item has type "expense" | "settlement" and relevant details.

CREATE OR REPLACE FUNCTION public.getGroupTransactionsFeed(p_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_items jsonb;
BEGIN
  IF NOT public.isGroupMember(p_group_id) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  WITH expense_rows AS (
    SELECT
      'expense'::text AS type,
      e.id,
      e.groupid,
      e.amount,
      e.name,
      e.notes,
      e.expensedate AS expense_date,
      e.createdat,
      COALESCE(e.expensedate, e.createdat) AS sort_date,
      e.splittype AS split_type,
      e.receipturl,
      jsonb_build_object(
        'id', creator.id,
        'name', creator.fullname,
        'avatar', creator.avatarurl
      ) AS created_by_user,
      (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', p.id,
              'name', p.fullname,
              'avatar', p.avatarurl
            )
          ),
          '[]'::jsonb
        )
        FROM public.expensepayers ep
        JOIN public.profiles p ON p.id = ep.userid
        WHERE ep.expenseid = e.id
      ) AS payors,
      (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', p.id,
              'name', p.fullname,
              'avatar', p.avatarurl
            )
          ),
          '[]'::jsonb
        )
        FROM public.expenseparticipants ep
        JOIN public.profiles p ON p.id = ep.userid
        WHERE ep.expenseid = e.id
      ) AS participants
    FROM public.expenses e
    LEFT JOIN public.profiles creator ON creator.id = e.createdby
    WHERE e.groupid = p_group_id
  ),
  settlement_rows AS (
    SELECT
      'settlement'::text AS type,
      s.id,
      s.groupid,
      s.amount,
      NULL::text AS name,
      NULL::text AS notes,
      NULL::timestamptz AS expense_date,
      s.createdat,
      s.createdat AS sort_date,
      NULL::text AS split_type,
      s.receipturl,
      NULL::jsonb AS created_by_user,
      '[]'::jsonb AS payors,
      '[]'::jsonb AS participants,
      s.payerid AS payer_id,
      s.receiverid AS receiver_id,
      jsonb_build_object(
        'id', payer.id,
        'name', payer.fullname,
        'avatar', payer.avatarurl
      ) AS payer_user,
      jsonb_build_object(
        'id', receiver.id,
        'name', receiver.fullname,
        'avatar', receiver.avatarurl
      ) AS receiver_user
    FROM public.settlements s
    LEFT JOIN public.profiles payer ON payer.id = s.payerid
    LEFT JOIN public.profiles receiver ON receiver.id = s.receiverid
    WHERE s.groupid = p_group_id
      AND s.deletedat IS NULL
  ),
  combined AS (
    SELECT
      type,
      id,
      groupid,
      amount,
      name,
      notes,
      expense_date,
      createdat,
      sort_date,
      split_type,
      receipturl,
      created_by_user,
      payors,
      participants,
      NULL::uuid AS payer_id,
      NULL::uuid AS receiver_id,
      NULL::jsonb AS payer_user,
      NULL::jsonb AS receiver_user
    FROM expense_rows
    UNION ALL
    SELECT
      type,
      id,
      groupid,
      amount,
      name,
      notes,
      expense_date,
      createdat,
      sort_date,
      split_type,
      receipturl,
      created_by_user,
      payors,
      participants,
      payer_id,
      receiver_id,
      payer_user,
      receiver_user
    FROM settlement_rows
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'type', type,
        'id', id,
        'groupid', groupid,
        'amount', amount,
        'name', name,
        'notes', notes,
        'expensedate', expense_date,
        'createdat', createdat,
        'date', sort_date,
        'splittype', split_type,
        'receipturl', receipturl,
        'createdby', created_by_user,
        'payors', payors,
        'participants', participants,
        'payerid', payer_id,
        'receiverid', receiver_id,
        'payer', payer_user,
        'receiver', receiver_user
      )
      ORDER BY sort_date DESC, createdat DESC
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM combined;

  RETURN jsonb_build_object('items', COALESCE(v_items, '[]'::jsonb));
END;
$$;

COMMENT ON FUNCTION public.getGroupTransactionsFeed(uuid) IS
  'Returns a unified, date-sorted feed of expenses and settlements for a group. Each item has type expense | settlement and details (lowercase keys: groupid, createdat, expensedate, receipturl, splittype, createdby, payors, participants, payerid, receiverid, payer, receiver).';

GRANT EXECUTE ON FUNCTION public.getGroupTransactionsFeed(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.updateGroupWithImage(groupId uuid, payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_row groups;
  v_image_url text := NULLIF(trim(payload->>'imageUrl'), '');
BEGIN
  UPDATE public.groups
  SET
    name = COALESCE(payload->>'name', name),
    description = COALESCE(payload->>'description', description),
    imageUrl = COALESCE(v_image_url, imageUrl),
    archivedAt = COALESCE((payload->>'archivedAt')::timestamptz, archivedAt)
  WHERE id = groupId
  RETURNING * INTO v_updated_row;

  RETURN jsonb_build_object(
    'group', to_jsonb(v_updated_row)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.updateGroupWithImage(uuid, jsonb) TO authenticated;