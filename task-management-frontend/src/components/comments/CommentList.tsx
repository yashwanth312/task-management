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
    return (
      <p
        className="text-xs font-mono py-4 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        No comments yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {comments.map((c) => (
        <li
          key={c.id}
          className="flex gap-3 group animate-fade-slide"
        >
          {/* Avatar */}
          <div
            className="w-6 h-6 rounded-sm flex items-center justify-center text-[9px] font-mono font-semibold flex-shrink-0 mt-0.5"
            style={{
              background: "var(--surface-3)",
              color: "var(--accent)",
              border: "1px solid var(--border)",
            }}
          >
            {c.author?.full_name?.charAt(0).toUpperCase() ?? "?"}
          </div>

          {/* Comment body */}
          <div
            className="flex-1 rounded-sm p-3 min-w-0"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {c.author?.full_name ?? "Unknown"}
              </span>
              <span
                className="text-[10px] font-mono flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
              >
                {format(new Date(c.created_at), "MMM d, HH:mm")}
              </span>
            </div>
            <p
              className="text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-secondary)" }}
            >
              {c.body}
            </p>
          </div>

          {/* Delete button */}
          {(user?.role === "admin" || user?.id === c.author_id) && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => onDelete(c.id)}
              className="opacity-0 group-hover:opacity-100 self-start mt-0.5 flex-shrink-0"
              style={{ color: "#f87171" }}
            >
              ✕
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
