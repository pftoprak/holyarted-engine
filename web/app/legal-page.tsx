import Link from 'next/link';

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updated: string;
  sections: Array<{ heading: string; body: string }>;
};

export function LegalPage({ eyebrow, title, updated, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-5 py-10 text-[#514b46] md:px-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <nav className="flex items-center justify-between border-b border-[#625b55]/12 pb-7">
          <Link href="/" className="font-heading text-2xl tracking-[-0.03em]">Holyarted</Link>
          <Link href="/" className="nav-link">Return home</Link>
        </nav>
        <header className="border-b border-[#625b55]/12 py-16 md:py-24">
          <p className="eyebrow text-[#8f705e]">{eyebrow}</p>
          <h1 className="mt-6 max-w-3xl font-heading text-5xl leading-[0.95] tracking-[-0.045em] md:text-7xl">{title}</h1>
          <p className="mt-7 text-sm text-[#514b46]/55">Last updated: {updated}</p>
        </header>
        <div className="grid gap-10 py-14 md:py-20">
          {sections.map((section) => (
            <section key={section.heading} className="grid gap-4 md:grid-cols-[13rem_1fr] md:gap-10">
              <h2 className="font-heading text-2xl">{section.heading}</h2>
              <p className="whitespace-pre-line text-base leading-8 text-[#514b46]/68">{section.body}</p>
            </section>
          ))}
        </div>
        <footer className="border-t border-[#625b55]/12 py-8 text-sm text-[#514b46]/55">
          Questions? Contact <a className="underline underline-offset-4" href="mailto:support@holyarted.com">support@holyarted.com</a>.
        </footer>
      </div>
    </main>
  );
}
