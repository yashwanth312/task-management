import apiClient from "./client";
import { Group, GroupCreate, GroupMembersUpdate, GroupUpdate } from "@/types/group";

export const listGroups = async (): Promise<Group[]> => {
  const res = await apiClient.get<Group[]>("/groups");
  return res.data;
};

export const getGroup = async (id: string): Promise<Group> => {
  const res = await apiClient.get<Group>(`/groups/${id}`);
  return res.data;
};

export const createGroup = async (data: GroupCreate): Promise<Group> => {
  const res = await apiClient.post<Group>("/groups", data);
  return res.data;
};

export const updateGroup = async (id: string, data: GroupUpdate): Promise<Group> => {
  const res = await apiClient.patch<Group>(`/groups/${id}`, data);
  return res.data;
};

export const deleteGroup = async (id: string): Promise<void> => {
  await apiClient.delete(`/groups/${id}`);
};

export const updateGroupMembers = async (id: string, data: GroupMembersUpdate): Promise<Group> => {
  const res = await apiClient.put<Group>(`/groups/${id}/members`, data);
  return res.data;
};
