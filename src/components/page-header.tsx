import { PageHeader as BasePageHeader } from "@/components/ui/page-header";

export function PageHeader(props: React.ComponentProps<typeof BasePageHeader>) {
  return <BasePageHeader {...props} eyebrow={props.eyebrow ?? "SEMEAR Territorios"} />;
}
