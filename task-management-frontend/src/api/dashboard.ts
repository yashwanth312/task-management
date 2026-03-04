import apiClient from "./client";
import { DashboardStats } from "@/types/dashboard";

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await apiClient.get<DashboardStats>("/dashboard/stats");
  return res.data;
};
