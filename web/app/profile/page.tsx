import { ArrowLeft, LogOut, Mail, Sparkles, UserRound } from 'lucide-react';

import { chatGPTSignOutPath, requireChatGPTUser } from '../chatgpt-auth';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireChatGPTUser('/profile');

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 py-16 text-foreground">
      <div className="cosmic-orbit" aria-hidden="true" />
      <section className="relative z-10 w-full max-w-xl rounded-[2rem] border border-primary/25 bg-card/95 p-7 shadow-[0_28px_90px_rgb(0_0_0/32%)] backdrop-blur md:p-10">
        <div className="flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to your map
          </a>
          <span className="grid size-10 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
        </div>

        <div className="mt-12 grid size-20 place-items-center rounded-full border border-primary/35 bg-primary/10 text-primary">
          <UserRound className="size-9" />
        </div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Personal space</p>
        <h1 className="mt-2 font-heading text-4xl leading-none md:text-5xl">Welcome, {user.displayName}.</h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">Your Holyarted account is securely connected through ChatGPT. We do not keep a separate password.</p>

        <div className="mt-8 rounded-2xl border border-border bg-background/60 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Signed-in email</p>
          <p className="mt-2 flex items-center gap-2 break-all text-sm"><Mail className="size-4 shrink-0 text-primary" /> {user.email}</p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a href="/" className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground">Open my map</a>
          <a href={chatGPTSignOutPath('/')} target="_top" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border px-5 font-semibold transition-colors hover:border-primary/40 hover:text-primary">
            <LogOut className="size-4" /> Sign out
          </a>
        </div>
      </section>
    </main>
  );
}
