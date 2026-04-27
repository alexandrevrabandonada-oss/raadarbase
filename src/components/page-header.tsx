export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="mb-2 text-sm font-bold uppercase tracking-normal text-red-900">
          VR Abandonada
        </p>
        <h1 className="text-3xl font-black tracking-normal text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">{description}</p>
      </div>
      {action}
    </header>
  );
}
