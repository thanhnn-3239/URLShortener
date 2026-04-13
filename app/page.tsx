import { ShortenForm } from "@/components/ShortenForm";

const exampleLinks = [
  {
    label: "Launch campaign",
    href: "http://localhost:3000/summer24",
    destination: "https://example.com/campaign/summer-24"
  },
  {
    label: "Product update",
    href: "http://localhost:3000/release",
    destination: "https://example.com/blog/release-notes"
  },
  {
    label: "Support article",
    href: "http://localhost:3000/helpdesk",
    destination: "https://example.com/help/short-links"
  }
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_26%)]" />
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-700">URL Shortener</p>
              <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Create compact links with room to grow into analytics.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Ship shareable short URLs now, keep redirect flow reliable, and leave space for click analytics and dashboard work in the next milestones.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-semibold text-slate-950">6 chars</p>
                <p className="mt-1 text-sm text-slate-600">Default short code length</p>
              </article>
              <article className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-semibold text-slate-950">302</p>
                <p className="mt-1 text-sm text-slate-600">Redirect behavior for active links</p>
              </article>
              <article className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-semibold text-slate-950">MVP</p>
                <p className="mt-1 text-sm text-slate-600">Creation, copy, and redirect flow ready</p>
              </article>
            </div>
          </div>

          <ShortenForm />
        </div>

        <section className="grid gap-4 rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur lg:grid-cols-[0.7fr_1.3fr] lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Example links</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Typical short URLs your team can share immediately.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              These examples mirror the output format users will get after creating a short URL from the form above.
            </p>
          </div>
          <div className="grid gap-3">
            {exampleLinks.map((link) => (
              <article key={link.href} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{link.label}</p>
                    <p className="mt-1 text-sm text-sky-700">{link.href}</p>
                  </div>
                  <p className="max-w-md text-sm text-slate-500">{link.destination}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
