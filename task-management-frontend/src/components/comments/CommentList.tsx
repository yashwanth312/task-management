import { format } from "date-fns";
import { Comment } from "@/types/comment";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

interface CommentListProps {
  comments: Comment[];
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function CommentList({ comments, onDelete, isDeleting }: CommentListProps) {
  const { user } = useAuth();

  if (comments.length === 0) {
    return <p className="text-sm text-gray-500">No comments yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c.id} className="flex gap-3">
          <div className="flex-1 rounded-lg bg-gray-50 border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">{c.author?.full_name ?? "Unknown"}</span>
              <span className="text-xs text-gray-400">{format(new Date(c.created_at), "MMM d, yyyy HH:mm")}</span>
            </div>
            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{c.body}</p>
          </div>
          {(user?.role === "admin" || user?.id === c.author_id) && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => onDelete(c.id)}
              className="text-red-500 hover:text-red-700 self-start mt-1"
            >
              ✕
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
