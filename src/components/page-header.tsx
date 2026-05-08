import { RadarPageHeader } from "./radar/radar-page-header";

export function PageHeader({
  title,
  description,
  action,
  eyebrow = "VR Abandonada",
  compact = false,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  eyebrow?: string;
  compact?: boolean;
}) {
  return (
    <RadarPageHeader 
      title={title}
      description={description}
      actions={action}
      eyebrow={eyebrow}
      compact={compact}
    />
  );
}

