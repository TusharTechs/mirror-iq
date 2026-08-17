"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export function PrimaryButton({
  children,
  className,
  fullWidthOnMobile = true,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidthOnMobile?: boolean;
}) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-zinc-950",
        "transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
        fullWidthOnMobile ? "w-full sm:w-auto" : "",
        FOCUS_RING,
        className
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-zinc-700 px-5 text-sm font-medium text-zinc-200",
        "transition-colors duration-150 hover:border-zinc-500 hover:text-white",
        "disabled:cursor-not-allowed disabled:opacity-40",
        FOCUS_RING,
        className
      )}
    >
      {children}
    </button>
  );
}

// Brand mark: a geometric "M" split into two mirrored halves by a vertical
// mirror line — the self on the left, the chosen reflection (emerald) on the
// right. Source: public/brand/mirroriq-symbol.svg. Inlined (not <img>) so its
// "self" half can inherit surrounding text color via currentColor.
// Always paired with a visible "MirrorIQ" text label at every call site, so
// it's marked decorative here to avoid double-announcing the name to
// screen readers.
export function MirrorMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cx("shrink-0", className)}
    >
      <path
        fill="currentColor"
        d="M6 40 L6 8 L13 8 L22.8 23.1 L22.8 31 L20.5 31 L13 19.5 L13 40 Z"
      />
      <path
        fill="#34D399"
        d="M42 40 L42 8 L35 8 L25.2 23.1 L25.2 31 L27.5 31 L35 19.5 L35 40 Z"
      />
    </svg>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-zinc-50 sm:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="text-[15px] leading-relaxed text-zinc-400">{subtitle}</p>}
    </div>
  );
}

export function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[15px] leading-relaxed text-zinc-300">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-[10px] font-bold text-emerald-400"
      >
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

const FLOW_STEPS = [
  { key: "upload", label: "Photo" },
  { key: "occasion", label: "Occasion" },
  { key: "style", label: "Style" },
  { key: "garments", label: "Garments" },
  { key: "results", label: "Looks" },
] as const;

export type FlowStepKey = (typeof FLOW_STEPS)[number]["key"];

export function ProgressTrail({ current }: { current: FlowStepKey }) {
  const currentIndex = FLOW_STEPS.findIndex((step) => step.key === current);

  return (
    <ol
      aria-label="Progress"
      className="flex items-center gap-1.5 sm:gap-2"
    >
      {FLOW_STEPS.map((step, index) => {
        const state =
          index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";

        return (
          <li key={step.key} className="flex items-center gap-1.5 sm:gap-2">
            <span
              aria-current={state === "current" ? "step" : undefined}
              className={cx(
                "h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                state === "current" && "w-6 bg-emerald-400 sm:w-8",
                state === "done" && "w-3 bg-emerald-400/50",
                state === "upcoming" && "w-3 bg-zinc-800"
              )}
            />
            <span className="sr-only">
              {step.label}
              {state === "current" ? " (current step)" : state === "done" ? " (completed)" : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ScreenShell({
  step,
  children,
}: {
  step?: FlowStepKey;
  children: ReactNode;
}) {
  return (
    <section
      key={step}
      className="motion-safe:animate-fade-up space-y-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-8"
    >
      {step && <ProgressTrail current={step} />}
      {children}
    </section>
  );
}

export function ChoiceCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        "group relative flex min-h-16 w-full flex-col items-start justify-center gap-0.5 rounded-2xl border px-5 py-3.5 text-left transition-all duration-200 motion-reduce:transition-none",
        "active:scale-[0.98] motion-reduce:active:scale-100",
        selected
          ? "border-emerald-400 bg-emerald-400/10"
          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600",
        FOCUS_RING
      )}
    >
      <span
        className={cx(
          "text-base font-medium",
          selected ? "text-emerald-300" : "text-zinc-100"
        )}
      >
        {label}
      </span>
      {description && (
        <span className="text-xs text-zinc-500">{description}</span>
      )}
      {selected && (
        <span
          aria-hidden="true"
          className="motion-safe:animate-pop absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[11px] font-bold text-zinc-950"
        >
          ✓
        </span>
      )}
    </button>
  );
}

export function ScorePill({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl sm:text-5xl",
  } as const;

  return (
    <span className={cx("font-[family-name:var(--font-display)] font-semibold text-emerald-400", sizes[size])}>
      {score}
      <span className="ml-1 text-[0.4em] font-semibold uppercase tracking-wider text-emerald-400/70">
        match
      </span>
    </span>
  );
}
