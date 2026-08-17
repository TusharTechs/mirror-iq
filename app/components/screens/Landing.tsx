import { MirrorMark, PrimaryButton } from "../ui";

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <section className="motion-safe:animate-fade-up space-y-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 py-10 text-center sm:p-12">
      <div className="motion-safe:animate-fade-in mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] border border-zinc-800 bg-zinc-950 text-zinc-50 sm:h-24 sm:w-24">
        <MirrorMark className="h-10 w-10 sm:h-12 sm:w-12" />
      </div>

      <div className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-medium tracking-tight text-zinc-50 sm:text-5xl">
          MirrorIQ
        </h1>
        <p className="font-[family-name:var(--font-display)] text-xl italic text-zinc-300 sm:text-2xl">
          Stop guessing. See what works.
        </p>
        <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-zinc-400">
          See clothes on yourself before you decide — compare the looks
          you&apos;re considering before you commit.
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
