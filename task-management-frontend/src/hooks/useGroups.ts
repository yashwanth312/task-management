import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listGroups, createGroup, updateGroup, deleteGroup, updateGroupMembers } from "@/api/groups";
import { GroupCreate, GroupMembersUpdate, GroupUpdate } from "@/types/group";

export const GROUPS_KEY = ["groups"] as const;

export function useGroups(enabled = true) {
  return useQuery({
    queryKey: GROUPS_KEY,
    queryFn: listGroups,
    enabled,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GroupCreate) => createGroup(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUPS_KEY }),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GroupUpdate }) => updateGroup(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUPS_KEY }),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUPS_KEY }),
  });
}

export function useUpdateGroupMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GroupMembersUpdate }) => updateGroupMembers(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUPS_KEY }),
  });
}
