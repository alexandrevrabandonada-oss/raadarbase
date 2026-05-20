import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricTone = "neutral" | "hot" | "warning" | "success" | "danger" | "info" | string;

interface RadarMetricCardProps {
  label: string;
  value: string | number;
  tone?: MetricTone;
  icon?: LucideIcon;
  helper?: string;
  href?: string;
  className?: string;
}

export function RadarMetricCard({
  label,
  value,
  tone = "neutral",
  icon: Icon,
  helper,
  href,
  className
}: RadarMetricCardProps) {
  
  const getToneClasses = () => {
    switch (tone) {
      case "hot":
        return {
          bg: "bg-rust/5",
          text: "text-rust",
          iconColor: "text-rust",
          border: "border-rust"
        };
      case "warning":
        return {
          bg: "bg-burnt-yellow/5",
          text: "text-charcoal",
          iconColor: "text-burnt-yellow",
          border: "border-burnt-yellow"
        };
      case "success":
        return {
          bg: "bg-moss/5",
          text: "text-moss",
          iconColor: "text-moss",
          border: "border-moss"
        };
      case "danger":
        return {
          bg: "bg-rust/10",
          text: "text-rust",
          iconColor: "text-rust",
          border: "border-rust"
        };
      case "info":
        return {
          bg: "bg-charcoal/5",
          text: "text-charcoal",
          iconColor: "text-cement",
          border: "border-charcoal/30"
        };
      case "neutral":
      default:
        return {
          bg: "bg-white",
          text: "text-charcoal",
          iconColor: "text-cement",
          border: "border-black/20"
        };
    }
  };

  const { bg, text, iconColor, border } = getToneClasses();

  const CardBody = (
    <Card className={cn("bloco-concreto relative overflow-hidden py-0 shadow-sm transition-all h-full bg-white", bg, text, border, href && "hover:shadow-md hover:-translate-y-0.5", className)}>
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between mb-2">
          {Icon && <Icon className={cn("h-5 w-5", iconColor)} />}
          <span className="text-2xl font-black leading-none">{value}</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-auto line-clamp-1">
          {label}
        </p>
        {helper && (
          <p className="text-[10px] opacity-65 mt-1 leading-tight line-clamp-2">
            {helper}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full outline-none rounded-[2px]">
        {CardBody}
      </Link>
    );
  }

  return CardBody;
}
