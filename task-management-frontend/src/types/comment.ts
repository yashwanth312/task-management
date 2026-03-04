import { User } from "./user";

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: User | null;
}

export interface CommentCreate {
  body: string;
}
