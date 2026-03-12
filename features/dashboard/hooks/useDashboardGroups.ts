"use client";

import { useCallback, useEffect } from "react";

import { useDashboardGroupsStore } from "../store/groups.store";

export function useDashboardGroups() {
  const groups = useDashboardGroupsStore((s) => s.groups);
  const loading = useDashboardGroupsStore((s) => s.loading);
  const error = useDashboardGroupsStore((s) => s.error);
  const fetchGroups = useDashboardGroupsStore((s) => s.fetchGroups);

  const refetch = useCallback(() => {
    void fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    void fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, error, refetch };
}

