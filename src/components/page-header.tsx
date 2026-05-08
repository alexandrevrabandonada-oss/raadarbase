import { RadarPageHeader } from "./radar/radar-page-header";

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
    <RadarPageHeader 
      title={title}
      description={description}
      actions={action}
      eyebrow="VR Abandonada"
    />
  );
}

