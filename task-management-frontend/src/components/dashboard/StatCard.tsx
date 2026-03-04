interface StatCardProps {
  label: string;
  value: number;
  color?: string;
}

export function StatCard({ label, value, color = "text-gray-900" }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
