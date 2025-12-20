"use client";

import { Button, Card, Pill } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={[
        // Liquid glass look
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_80px_rgba(0,0,0,0.6)]",
        className,
      ].join(" ")}
    >
      {/* glass sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      <div className="relative">{children}</div>
    </Card>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Space / liquid background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* subtle star-ish noise effect (fake via gradients) */}
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_15%,rgba(80,220,255,0.18),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(80,220,255,0.12),transparent_45%),radial-gradient(circle_at_40%_90%,rgba(120,60,255,0.10),transparent_50%)]" />
        {/* horizon fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black to-black" />
        {/* bottom glow */}
        <div className="absolute -bottom-64 left-1/2 h-[520px] w-[1200px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold">
                <span className="text-white">Deal</span>
                <span className="text-cyan-200">AI</span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-5 text-balance text-5xl font-black leading-tight tracking-tight md:text-6xl">
                Confident offers for every marketplace deal.
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mt-4 max-w-2xl text-lg text-white/70">
                Deal AI reads your listing screenshots, scores the offer, flags scams, and drafts a negotiation message you can send immediately.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-6 flex flex-wrap gap-2 text-sm text-white/60">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Secure Firebase auth</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Stripe-protected checkout</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">We never store card details</span>
              </div>
            </Reveal>

            <Reveal delay={0.26}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/app/upload">Try Deal AI</Button>
                <Button href="/pricing" variant="ghost">
                  See pricing →
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 text-sm text-white/80 md:grid-cols-3">
                <Pill>Deal score</Pill>
                <Pill>Scam flags</Pill>
                <Pill>Copy negotiation</Pill>
                <Pill>Timeline saved</Pill>
                <Pill>Free: 3 uploads/day</Pill>
                <Pill>Pro: Unlimited</Pill>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.18}>
            <GlassCard className="relative overflow-hidden border border-white/10 bg-white/5 p-0">
              <img src="/hero.png" alt="Deal AI dashboard" className="h-full w-full rounded-3xl object-cover" />
            </GlassCard>
          </Reveal>
        </div>

        {/* Trust cards */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Reveal delay={0.0}>
            <GlassCard className="p-5">
              <div className="text-sm font-semibold">🔒 Private</div>
              <div className="mt-1 text-sm text-white/70">We don’t message sellers. You control what you send.</div>
            </GlassCard>
          </Reveal>
          <Reveal delay={0.06}>
            <GlassCard className="p-5">
              <div className="text-sm font-semibold">⚡ Fast</div>
              <div className="mt-1 text-sm text-white/70">Upload a screenshot → get comps + a counter-offer.</div>
            </GlassCard>
          </Reveal>
          <Reveal delay={0.12}>
            <GlassCard className="p-5">
              <div className="text-sm font-semibold">🧠 Practical</div>
              <div className="mt-1 text-sm text-white/70">Deal score, scam flags, and negotiation copy that works.</div>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm text-white/60">How it works</div>
              <h2 className="mt-1 text-3xl font-black tracking-tight">
                Upload → Analyze → Win the deal
              </h2>
            </div>
            <Button href="/app/upload" variant="ghost">
              Try it now →
            </Button>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Reveal delay={0.0}>
            <GlassCard className="p-6">
              <div className="text-xs text-white/60">Step 1</div>
              <div className="mt-1 text-lg font-bold">Upload a screenshot</div>
              <div className="mt-2 text-sm text-white/70">
                Listing screenshot from Marketplace / Craigslist (title + price
                is enough).
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.08}>
            <GlassCard className="p-6">
              <div className="text-xs text-white/60">Step 2</div>
              <div className="mt-1 text-lg font-bold">AI runs comps</div>
              <div className="mt-2 text-sm text-white/70">
                Market value, deal score, condition guess, scam signals.
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.16}>
            <GlassCard className="p-6">
              <div className="text-xs text-white/60">Step 3</div>
              <div className="mt-1 text-lg font-bold">Copy-paste negotiation</div>
              <div className="mt-2 text-sm text-white/70">
                A respectful message with a fair offer you can send instantly.
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      {/* FEATURES / OUTCOMES */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Reveal>
          <div className="text-sm text-white/60">What you get</div>
          <h2 className="mt-1 text-3xl font-black tracking-tight">
            Practical outputs, not AI fluff
          </h2>
        </Reveal>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Reveal delay={0.0}>
            <GlassCard className="p-6">
              <div className="text-lg font-bold">Deal Score</div>
              <div className="mt-2 text-sm text-white/70">
                Know instantly if it’s overpriced, fair, or a steal — scored 0–100.
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.08}>
            <GlassCard className="p-6">
              <div className="text-lg font-bold">Scam & Red Flags</div>
              <div className="mt-2 text-sm text-white/70">
                Spot urgency tricks, missing info, weird patterns, and risk factors.
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.16}>
            <GlassCard className="p-6">
              <div className="text-lg font-bold">Negotiation Copy</div>
              <div className="mt-2 text-sm text-white/70">
                Clean, respectful message templates sellers respond to.
              </div>
            </GlassCard>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/app/upload">Analyze a listing</Button>
            <Button href="/pricing" variant="ghost">
              View pricing →
            </Button>
          </div>
        </Reveal>
      </section>

      {/* WHO IT'S FOR */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Reveal>
          <div className="text-sm text-white/60">Perfect for</div>
          <h2 className="mt-1 text-3xl font-black tracking-tight">
            People who buy second-hand
          </h2>
        </Reveal>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            {
              title: "🚗 Car buyers",
              body: "Check sketchy listings before you waste time driving out.",
            },
            {
              title: "📦 Flippers",
              body: "Spot margin opportunities fast and offer with confidence.",
            },
            {
              title: "💻 Electronics",
              body: "Avoid scams, compare value, negotiate smarter.",
            },
            {
              title: "🎓 Budget buyers",
              body: "Make sure you’re not overpaying when money’s tight.",
            },
          ].map((x, i) => (
            <Reveal key={x.title} delay={i * 0.06}>
              <GlassCard className="p-6">
                <div className="font-bold">{x.title}</div>
                <div className="mt-2 text-sm text-white/70">{x.body}</div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <Reveal>
          <div className="text-sm text-white/60">Beta feedback</div>
          <h2 className="mt-1 text-3xl font-black tracking-tight">
            Early users love the speed
          </h2>
        </Reveal>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            "“The counter-offer message is exactly what I would say — just cleaner.”",
            "“Saved me from driving out for a sketchy listing. Worth it.”",
            "“Deal score is addictive. I check everything now.”",
          ].map((q, i) => (
            <Reveal key={q} delay={i * 0.08}>
              <GlassCard className="p-6">
                <div className="text-sm text-white/75">{q}</div>
                <div className="mt-3 text-xs text-white/50">— Beta user</div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <Reveal>
          <GlassCard className="p-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="text-2xl font-black tracking-tight">
                  Ready to check your next listing?
                </div>
                <div className="mt-2 text-white/70 text-sm">
                  Upload a screenshot and get deal score + market value + a counter-offer.
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button href="/app/upload">Analyze now</Button>
                <Button href="/app" variant="ghost">
                  Open app →
                </Button>
              </div>
            </div>
          </GlassCard>
        </Reveal>

        <Reveal delay={0.08}>
          <footer className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300/80 shadow-[0_0_18px_rgba(80,220,255,0.25)]" />
              <span>Deal AI</span>
              <span className="text-white/30">•</span>
              <span>Private marketplace assistant</span>
            </div>

            <div className="flex flex-wrap gap-4">
              <a className="hover:text-white/80" href="/pricing">Pricing</a>
              <a className="hover:text-white/80" href="/privacy">Privacy</a>
              <a className="hover:text-white/80" href="/terms">Terms</a>
              <a className="hover:text-white/80" href="/contact">Contact</a>
            </div>
          </footer>
        </Reveal>
      </section>
    </main>
  );
}
