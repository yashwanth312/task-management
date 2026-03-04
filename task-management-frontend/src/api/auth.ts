import apiClient from "./client";
import { LoginRequest, TokenResponse } from "@/types/auth";
import { User } from "@/types/user";

export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  const res = await apiClient.post<TokenResponse>("/auth/login", data);
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await apiClient.get<User>("/users/me");
  return res.data;
};
