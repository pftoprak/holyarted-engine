import { ArrowRight } from 'lucide-react';
import { Fragment } from 'react';
import type { MembershipPlan } from '@/lib/plans';
import type { PortraitChapters } from '@/lib/portrait-chapters';
import type { Reading } from '@/lib/reading';
import type { Copy, Locale } from './experience-copy';

export type Served = { plan: MembershipPlan; chapters: Record<Locale, PortraitChapters>; reading: Reading };
export type ReadingState = { status: 'idle' | 'loading' | 'error' } | ({ status: 'ready' } & Served);

type DetailedReadingProps = { text: Copy; locale: Locale; state: ReadingState; onRetry: () => void };

// The full numerology texts are fetched from /api/reading, never bundled here.
export function DetailedReading({ text, locale, state, onRetry }: DetailedReadingProps) {
  if (state.status === 'idle') return null;
  return (
    <div id="reading" className="mt-14 scroll-mt-24 border-t border-[#625b55]/22 pt-14">
      <div className="grid gap-6 lg:grid-cols-[0.65fr_1.35fr]">
        <div><p className="eyebrow">{text.readingLabel}</p><h2 className="mt-5 font-heading text-5xl leading-[0.95] tracking-[-0.04em] md:text-6xl">{text.readingTitle}</h2></div>
        <div><p className="max-w-2xl text-base leading-8 text-[#514b46]/70">{text.readingCopy}</p>{locale !== 'tr' && <p className="mt-3 text-xs font-bold text-[#514b46]/55">{text.readingLocaleNote}</p>}</div>
      </div>
      {state.status === 'loading' && <p className="mt-10 text-sm text-[#514b46]/60" aria-live="polite">{text.readingLoading}</p>}
      {state.status === 'error' && <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-[#514b46]/70" role="alert"><span>{text.readingError}</span><button onClick={onRetry} className="text-xs font-bold uppercase tracking-[0.14em] underline underline-offset-4">{text.readingRetry}</button></div>}
      {state.status === 'ready' && <div className="mt-10 grid gap-4">{state.reading.sections.map((section) => <Fragment key={section.id}>
        <details open={section.id === 'showcase'} className="group rounded-[2rem] bg-[#f7f3ec]/55 p-7 md:p-9">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4"><span className="flex flex-wrap items-center gap-3"><span lang="en" className="rounded-full border border-[#8f705e]/30 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#8f705e]">{text.readingTiers[section.tier]}</span><span lang={state.reading.locale} className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f705e]">{section.title} · {section.key}</span></span><ArrowRight className="size-4 shrink-0 transition group-open:rotate-90" /></summary>
          <div lang={state.reading.locale} className="mt-6 grid max-w-3xl gap-4 text-sm leading-7 text-[#514b46]/75">
            <p className="text-xs leading-6 text-[#514b46]/60"><span className="font-bold">{text.readingWhy}: </span>{section.reason}</p>
            {section.note && <p className="border-l-2 border-[#a7826c]/45 pl-3 text-xs leading-6 text-[#514b46]/60">{section.note}</p>}
            {section.status === 'locked' ? <p className="italic">{text.readingLocked(text.readingTiers[section.tier])}</p> : section.status === 'pending' ? <p className="italic">{text.readingPending}</p> : section.paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}
          </div>
        </details>
        {section.id === 'lifePath' && <RelationshipLines text={text} reading={state.reading} />}
      </Fragment>)}</div>}
    </div>
  );
}

// "İlişkide sen": dataset sentences regrouped by the server, never rewritten.
function RelationshipLines({ text, reading }: { text: Copy; reading: Reading }) {
  return (
    <section className="rounded-[2rem] border border-[#625b55]/14 bg-[#fbf8f2]/70 p-7 md:p-9">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f705e]"><span lang="en" className="mr-3 rounded-full border border-[#8f705e]/30 px-2.5 py-1 text-[9px] tracking-[0.14em]">{text.readingTiers.plus}</span>{text.readingRelationships}</p>
      <p className="mt-4 text-xs leading-6 text-[#514b46]/60">{text.readingRelationshipsCopy}</p>
      {reading.relationshipsLocked ? <p className="mt-6 text-sm italic text-[#514b46]/70">{text.readingLocked(text.readingTiers.plus)}</p> : reading.relationships.length === 0 ? <p className="mt-6 text-sm italic text-[#514b46]/70">{text.readingRelationshipsEmpty}</p> : <ul lang={reading.locale} className="mt-6 grid max-w-3xl gap-4 text-sm leading-7 text-[#514b46]/75">{reading.relationships.map((line) => <li key={line.sentence} className="border-l-2 border-[#a7826c]/45 pl-4">{line.sentence}<span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#514b46]/45">{line.source}</span></li>)}</ul>}
    </section>
  );
}
