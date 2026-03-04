import { Select } from "@/components/ui/Select";

interface TaskFiltersProps {
  status: string;
  priority: string;
  onStatusChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
}

export function TaskFilters({ status, priority, onStatusChange, onPriorityChange }: TaskFiltersProps) {
  return (
    <div className="flex gap-3">
      <Select value={status} onChange={(e) => onStatusChange(e.target.value)} className="w-40">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </Select>
      <Select value={priority} onChange={(e) => onPriorityChange(e.target.value)} className="w-40">
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </Select>
    </div>
  );
}
