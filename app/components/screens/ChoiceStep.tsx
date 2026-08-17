"use client";

import type { ReactNode } from "react";
import { ChoiceCard, PrimaryButton, ScreenShell, SectionHeading } from "../ui";
import type { FlowStepKey } from "../ui";

export function ChoiceStep<T extends string>({
  step,
  title,
  subtitle,
  options,
  selected,
  onSelect,
  onContinue,
  continueLabel = "Continue",
}: {
  step: FlowStepKey;
  title: ReactNode;
  subtitle?: ReactNode;
  options: readonly T[];
  selected: T | null;
  onSelect: (value: T) => void;
  onContinue: () => void;
  continueLabel?: string;
}) {
  return (
    <ScreenShell step={step}>
      <SectionHeading title={title} subtitle={subtitle} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <ChoiceCard
            key={option}
            label={option}
            selected={selected === option}
            onClick={() => onSelect(option)}
          />
        ))}
      </div>

      <PrimaryButton onClick={onContinue} disabled={!selected}>
        {continueLabel}
        <span aria-hidden="true">→</span>
      </PrimaryButton>
    </ScreenShell>
  );
}
