import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  LEGAL_INTRO,
  LEGAL_SECTIONS,
  LEGAL_SUBTITLE,
  LEGAL_TITLE,
  type LegalSection,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions and Privacy Notice — Hero Destini",
  description:
    "Terms & Conditions and Privacy Notice for the Hero Destiny Fantasy World campaign by Hero MotoCorp Limited.",
};

/** The Privacy Notice spans F–M; anchor `privacy` sits on section F. */
const anchorFor = (s: LegalSection) => s.id ?? `sec-${s.letter.toLowerCase()}`;

/** Render body copy, turning any email address into a mailto link. */
function CopyWithEmails({ text }: { text: string }) {
  const parts = text.split(/([\w.+-]+@[\w.-]+\.\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^[\w.+-]+@[\w.-]+\.\w+$/.test(part) ? (
          <a
            key={i}
            href={`mailto:${part}`}
            className="font-medium text-hero-red underline underline-offset-2 hover:text-hero-red-deep"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-white text-ink">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 border-b border-ink/10 pb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-pill border border-ink/10 bg-ink/[0.03] px-3 py-2 text-xs font-semibold text-ink/70 transition-colors hover:bg-ink/[0.06] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-red"
          >
            <ArrowLeft aria-hidden className="size-3.5" strokeWidth={2.5} />
            Back to site
          </Link>
          <Image
            src="/hero-logo-2.png"
            alt="Hero"
            width={536}
            height={197}
            style={{ height: "auto" }}
            className="w-16"
          />
        </header>

        {/* Title */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-hero-red">
            {LEGAL_SUBTITLE}
          </p>
          <h1 className="display mt-1.5 text-4xl leading-none text-ink sm:text-5xl">
            {LEGAL_TITLE}
          </h1>
        </div>

        {/* Intro */}
        <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed text-ink/80">
          {LEGAL_INTRO.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* Table of contents */}
        <nav
          aria-label="Contents"
          className="mt-8 rounded-panel border border-ink/10 bg-ink/[0.02] p-5"
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">
            Contents
          </h2>
          <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {LEGAL_SECTIONS.map((s) => (
              <li key={s.letter}>
                <a
                  href={`#${anchorFor(s)}`}
                  className="group flex gap-2 text-sm text-ink/75 transition-colors hover:text-hero-red"
                >
                  <span className="font-semibold text-ink/40 group-hover:text-hero-red">
                    {s.letter}.
                  </span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="mt-10 space-y-10">
          {LEGAL_SECTIONS.map((s) => (
            <section
              key={s.letter}
              id={anchorFor(s)}
              className="scroll-mt-6"
            >
              <h2 className="flex items-baseline gap-2.5 text-xl font-bold text-ink">
                <span className="text-hero-red">{s.letter}.</span>
                {s.title}
              </h2>

              {s.intro?.length ? (
                <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-ink/80">
                  {s.intro.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : null}

              {s.items?.length ? (
                <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-[0.95rem] leading-relaxed text-ink/80 marker:font-semibold marker:text-ink/40">
                  {s.items.map((item, i) => (
                    <li key={i} className="pl-1">
                      {item.lead ? (
                        <span className="font-semibold text-ink">{item.lead} </span>
                      ) : null}
                      <CopyWithEmails text={item.text} />
                      {item.bullets?.length ? (
                        <ul className="mt-1.5 list-disc space-y-1 pl-5 marker:text-ink/30">
                          {item.bullets.map((b, j) => (
                            <li key={j}>{b}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : null}

              {s.outro?.length ? (
                <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-ink/80">
                  {s.outro.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-ink/10 pt-6 text-xs leading-relaxed text-ink/50">
          <p>© Hero MotoCorp Limited. Data Fiduciary under the DPDP Act, 2023.</p>
          <p className="mt-1">
            Data Processor: HiVoco Content-Tech Studios (Audio First Commerce Pvt. Ltd.).
          </p>
        </footer>
      </div>
    </main>
  );
}
