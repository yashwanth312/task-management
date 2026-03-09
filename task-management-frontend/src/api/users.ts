import apiClient from "./client";
import { User, UserCreate, UserUpdate } from "@/types/user";

export const listUsers = async (): Promise<User[]> => {
  const res = await apiClient.get<User[]>("/users");
  return res.data;
};

export const createUser = async (data: UserCreate): Promise<User> => {
  const res = await apiClient.post<User>("/users", data);
  return res.data;
};

export const updateUser = async (id: string, data: UserUpdate): Promise<User> => {
  const res = await apiClient.patch<User>(`/users/${id}`, data);
  return res.data;
};

export const terminateUser = async (id: string): Promise<User> => {
  const res = await apiClient.post<User>(`/users/${id}/terminate`);
  return res.data;
};
