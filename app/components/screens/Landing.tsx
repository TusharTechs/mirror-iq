import { PrimaryButton } from "../ui";

function HeroMark() {
  return (
    <svg
      viewBox="0 0 280 180"
      className="mx-auto w-full max-w-[280px] motion-safe:animate-fade-in"
      role="img"
      aria-label="Three garment cards, one selected"
    >
      <rect x="8" y="34" width="88" height="128" rx="14" className="fill-zinc-800/70" transform="rotate(-8 52 98)" />
      <rect x="96" y="20" width="88" height="128" rx="14" className="fill-zinc-800" transform="rotate(4 140 84)" />
      <rect
        x="184"
        y="30"
        width="88"
        height="128"
        rx="14"
        className="fill-emerald-400/15 stroke-emerald-400"
        strokeWidth="2"
        transform="rotate(9 228 94)"
      />
      <circle cx="228" cy="30" r="12" className="fill-emerald-400" transform="rotate(9 228 94)" />
      <path
        d="M223 30 l4 4 l7 -8"
        stroke="#09090b"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform="rotate(9 228 94)"
      />
    </svg>
  );
}

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <section className="motion-safe:animate-fade-up space-y-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 py-10 text-center sm:p-12">
      <HeroMark />

      <div className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-medium tracking-tight text-zinc-50 sm:text-5xl">
          MirrorIQ
        </h1>
        <p className="font-[family-name:var(--font-display)] text-xl italic text-zinc-300 sm:text-2xl">
          Stop guessing. See what works.
        </p>
        <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-zinc-400">
          Compare the looks you&apos;re considering before you commit.
        </p>
      </div>

      <div className="space-y-3">
        <PrimaryButton onClick={onStart} className="text-lg" fullWidthOnMobile>
          Try MirrorIQ
          <span aria-hidden="true">→</span>
        </PrimaryButton>
        <p className="text-xs tracking-wide text-zinc-500">
          One photo · 3 looks · 1 decision
        </p>
      </div>
    </section>
  );
}
