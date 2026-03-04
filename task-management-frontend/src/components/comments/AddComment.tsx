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
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <textarea
        ref={ref}
        rows={2}
        placeholder="Write a comment…"
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <Button type="submit" size="sm" disabled={isAdding}>
        {isAdding ? "…" : "Add"}
      </Button>
    </form>
  );
}
