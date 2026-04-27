export function DashboardChart({
  data,
}: {
  data: { day: string; interacoes: number }[];
}) {
  const max = Math.max(...data.map((item) => item.interacoes), 1);

  return (
    <div className="grid h-72 grid-cols-6 items-end gap-3">
      {data.map((item) => (
        <div key={item.day} className="flex h-full flex-col justify-end gap-2">
          <div className="relative flex-1 rounded-md border bg-muted/25">
            <div
              className="absolute inset-x-2 bottom-2 rounded-md bg-[#b33a2b]"
              style={{ height: `${Math.max((item.interacoes / max) * 100, 8)}%` }}
            />
          </div>
          <div className="text-center text-sm font-medium">{item.day}</div>
          <div className="text-center text-xs text-muted-foreground">{item.interacoes}</div>
        </div>
      ))}
    </div>
  );
}
