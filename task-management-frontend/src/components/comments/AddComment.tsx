import { useRef } from "react";
import { Button } from "@/components/ui/Button";

interface AddCommentProps {
  onAdd: (body: string) => Promise<void>;
  isAdding: boolean;
}

export function AddComment({ onAdd, isAdding }: AddCommentProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = ref.current?.value.trim();
    if (!body) return;
    await onAdd(body);
    if (ref.current) ref.current.value = "";
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2"
      style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}
    >
      <textarea
        ref={ref}
        rows={2}
        placeholder="Add a comment…"
        className="block w-full rounded-sm border px-3 py-2.5 text-sm resize-none transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isAdding}>
          {isAdding ? "Posting…" : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}
