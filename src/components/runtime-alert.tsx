import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function RuntimeAlert({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Alert className="border-red-800/20 bg-red-50 text-red-950">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
