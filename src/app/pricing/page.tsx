import { Button, Card, Container, Pill } from "@/components/ui";

export default function PricingPage() {
  return (
    <div>
      <header className="border-b border-white/10 bg-zinc-950/60 backdrop-blur">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-cyan-400/20 border border-cyan-300/25" />
              <div className="font-black tracking-tight">DealAI</div>
            </div>
            <Button href="/" variant="ghost">Home</Button>
          </div>
        </Container>
      </header>

      <Container>
        <section className="py-12">
          <div className="flex items-center gap-2">
            <Pill>Simple</Pill>
            <Pill>No Mac needed</Pill>
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight">Pricing</h1>
          <p className="mt-2 text-white/70 max-w-2xl">
            Start free. Upgrade when you want faster analysis, history, and community features.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card>
              <div className="text-lg font-bold">Free</div>
              <div className="mt-1 text-3xl font-black">$0</div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>• Limited analyses/day</li>
                <li>• Basic deal score</li>
                <li>• Basic negotiation message</li>
              </ul>
              <div className="mt-6">
                <Button href="/app/upload">Try Free</Button>
              </div>
            </Card>

            <Card className="border-cyan-300/20">
              <div className="text-lg font-bold text-cyan-100">Pro</div>
              <div className="mt-1 text-3xl font-black">$9<span className="text-sm font-semibold text-white/60">/mo</span></div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>• Higher analysis limits</li>
                <li>• Timeline/history</li>
                <li>• Better counter-offers</li>
              </ul>
              <div className="mt-6">
                <Button href="/app/upload">Start Pro</Button>
              </div>
            </Card>

            <Card>
              <div className="text-lg font-bold">Creator</div>
              <div className="mt-1 text-3xl font-black">$19<span className="text-sm font-semibold text-white/60">/mo</span></div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>• Community posting</li>
                <li>• Deal stats</li>
                <li>• Priority features</li>
              </ul>
              <div className="mt-6">
                <Button href="/app/upload" variant="secondary">Start Creator</Button>
              </div>
            </Card>
          </div>
        </section>
      </Container>
    </div>
  );
}
