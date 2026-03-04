import { User } from "./user";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  members: User[];
}

export interface GroupCreate {
  name: string;
  description?: string;
  member_ids: string[];
}

export interface GroupUpdate {
  name?: string;
  description?: string;
}

export interface GroupMembersUpdate {
  member_ids: string[];
}
