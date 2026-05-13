"use client";

import { JourneyBar, JourneyBarProps } from "@/components/radar/journey-bar";

export type JourneyProgressProps = JourneyBarProps;

export function JourneyProgress(props: JourneyProgressProps) {
  return <JourneyBar {...props} />;
}
