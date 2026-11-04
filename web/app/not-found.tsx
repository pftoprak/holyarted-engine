export const metadata = { title: 'Sayfa bulunamadı — Holyarted' };

// The visitor's language is not known here, so both are shown.
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f3ec] px-5 py-16 text-[#514b46]">
      <div className="max-w-xl text-center">
        <a href="/" className="font-heading text-2xl tracking-[-0.03em]">Holyarted</a>
        <p className="eyebrow mt-14 text-[#8f705e]">404</p>
        <h1 lang="tr" className="mt-6 font-heading text-5xl leading-[0.95] tracking-[-0.045em] md:text-6xl">Bu sayfa bulunamadı.</h1>
        <p lang="en" className="mt-4 text-base text-[#514b46]/60">This page could not be found.</p>
        <a href="/" className="mt-10 inline-flex h-12 items-center bg-[#625b55] px-6 text-xs font-bold text-[#f7f3ec]">
          <span lang="tr">Ana sayfaya dön</span><span aria-hidden="true" className="mx-2">·</span><span lang="en">Return home</span>
        </a>
      </div>
    </main>
  );
}
