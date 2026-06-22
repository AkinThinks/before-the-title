"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

type Sponsor = {
  src: string;
  name: string;
  href?: string;
  variant?: "card" | "tile";
};

/**
 * A sponsor logo. Two looks, chosen per logo:
 *  - "card": white card with the logo contained inside, for clean, transparent
 *    wordmark logos (North to Shore, Newark Arts).
 *  - "tile": a rounded, edge-to-edge "app-icon" badge, for photo/dark
 *    support logos that look best filling the frame.
 * If a file is missing from /public/logos/ we fall back to the name.
 */
function LogoCard({
  sponsor,
  variant = "card",
}: {
  sponsor: Sponsor;
  variant?: "card" | "tile";
}) {
  const [failed, setFailed] = useState(false);
  const { src, name, href } = sponsor;
  const isTile = variant === "tile";

  const box = isTile ? "h-24 w-24" : "h-28 w-44";

  const card = (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`relative ${box} flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md`}
    >
      {failed ? (
        <span className="font-display text-base tracking-tight text-foreground/80 px-3 text-center">
          {name}
        </span>
      ) : (
        <Image
          src={src}
          alt={name}
          fill
          sizes="200px"
          onError={() => setFailed(true)}
          className={isTile ? "object-cover" : "object-contain p-3.5"}
          unoptimized
        />
      )}
    </motion.div>
  );

  return (
    <div className="flex flex-col items-center gap-2.5">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${name}`}
        >
          {card}
        </a>
      ) : (
        card
      )}
      <span className="text-[11px] tracking-[0.12em] uppercase text-muted-light font-light">
        {name}
      </span>
    </div>
  );
}

const firstPresentedWith: Sponsor[] = [
  { src: "/logos/north2shore.png", name: "North to Shore", href: "https://northtoshore.com" },
  { src: "/logos/newark-arts.png", name: "Newark Arts", href: "https://www.newarkarts.org" },
];

const builtWith: Sponsor[] = [
  {
    src: "/logos/salesparrot.png",
    name: "SalesParrot",
    href: "https://www.salesparrot.com",
    variant: "tile",
  },
];

const platformAndCommunitySupport: Sponsor[] = [
  { src: "/logos/njcodecoffee.png", name: "NJ Code & Coffee", href: "https://luma.com/njcodecoffee" },
  { src: "/logos/launchbox.png", name: "LaunchBox", href: "https://www.launchbox.live/agency" },
];

const steps = [
  {
    n: "01",
    title: "Reflect",
    body: "Answer one quiet question: who were you before the title? A word, a memory, a feeling. There are no wrong answers.",
  },
  {
    n: "02",
    title: "Become art",
    body: "Your reflection becomes a one-of-a-kind visual artwork, shaped in the moment from your words.",
  },
  {
    n: "03",
    title: "Join the archive",
    body: "With permission, safe submissions enter a living archive of strangers, memory, and who we are beneath our titles.",
  },
];

const rhythm = [
  { label: "Current prompt", value: "Who were you before the title?" },
  { label: "Participation", value: "Open online, with in-person chapters" },
  { label: "Archive", value: "Safety-reviewed public gallery" },
  { label: "Cadence", value: "New prompts and featured selections over time" },
];

const origins = [
  {
    label: "First presentation",
    value: "Newark, with North to Shore Festival and Newark Arts",
  },
  {
    label: "Current form",
    value: "An ongoing online archive with future in-person chapters",
  },
  {
    label: "Curatorial role",
    value: "Featured selections, project chapters, film, and community activations",
  },
];

export default function EventLanding() {
  return (
    <main className="min-h-full px-6 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-2xl space-y-20">
        {/* Hero */}
        <motion.section
          initial="hidden"
          animate="visible"
          className="text-center space-y-7"
        >
          <motion.h1
            custom={0}
            variants={fadeUp}
            className="font-display text-5xl sm:text-6xl md:text-7xl leading-[1.03] tracking-tight"
          >
            Before
            <br />
            the Title
          </motion.h1>

          <motion.p
            custom={1}
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted leading-relaxed font-light max-w-md mx-auto"
          >
            Your reflection becomes art.
            <br />
            Your voice becomes story.
          </motion.p>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-base text-muted leading-relaxed font-light max-w-lg mx-auto"
          >
            An ongoing participatory art project about who we are beyond our
            titles. Step away from the labels you carry, like your job, your role,
            and your resume, and answer one honest question. In a few quiet moments,
            your words become personal artwork that joins a living archive of the
            people who came before you.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Button href="/experience?src=online">Add Your Reflection</Button>
            <Button href="/gallery" variant="secondary">
              View Archive
            </Button>
          </motion.div>
        </motion.section>

        {/* Project origins */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          custom={0}
          variants={fadeUp}
          className="space-y-7"
        >
          <div className="text-center space-y-3">
            <p className="text-xs tracking-[0.28em] uppercase text-muted-light font-light">
              Project origins
            </p>
            <h2 className="font-display text-2xl sm:text-3xl tracking-tight">
              Begun in Newark, built to keep moving
            </h2>
            <p className="text-muted font-light leading-relaxed max-w-xl mx-auto">
              Before the Title was first presented through a Newark activation
              with North to Shore Festival and Newark Arts. That first chapter
              opened the archive in person; the project now continues online
              and through future gatherings.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border">
            {origins.map((item) => (
              <div
                key={item.label}
                className="bg-surface/90 px-5 py-5 text-left space-y-2"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-light font-light">
                  {item.label}
                </p>
                <p className="font-display text-xl tracking-tight text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* How it works */}
        <section className="space-y-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            variants={fadeUp}
            className="font-display text-2xl sm:text-3xl tracking-tight text-center"
          >
            How it works
          </motion.h2>

          <div className="space-y-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i}
                variants={fadeUp}
                className="flex gap-5 bg-surface/80 backdrop-blur-sm border border-border rounded-2xl px-6 py-5"
              >
                <span className="font-display text-2xl text-primary/70 shrink-0 w-10">
                  {s.n}
                </span>
                <div className="space-y-1">
                  <h3 className="font-medium text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted font-light leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Project rhythm */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          custom={0}
          variants={fadeUp}
          className="space-y-7"
        >
          <div className="text-center space-y-3">
            <p className="text-xs tracking-[0.28em] uppercase text-muted-light font-light">
              Project rhythm
            </p>
            <h2 className="font-display text-2xl sm:text-3xl tracking-tight">
              Built to keep unfolding
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {rhythm.map((item) => (
              <div
                key={item.label}
                className="bg-surface/90 px-5 py-5 text-left space-y-2"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-light font-light">
                  {item.label}
                </p>
                <p className="font-display text-xl tracking-tight text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Creator */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          custom={0}
          variants={fadeUp}
          className="grid gap-7 sm:grid-cols-[190px_1fr] sm:items-center"
        >
          <div className="space-y-3">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[170px] overflow-hidden rounded-tl-[22px] rounded-tr-[7px] rounded-br-[22px] rounded-bl-[7px] border border-border bg-surface shadow-lg shadow-primary/5 sm:mx-0 sm:max-w-[180px]">
              <Image
                src="/creator/akin-before-the-title.png"
                alt="Akin as a child"
                fill
                sizes="(max-width: 640px) 170px, 180px"
                className="object-cover"
                priority={false}
                unoptimized
              />
            </div>
            <p className="text-center text-xs text-muted-light font-light sm:text-left">
              Akin, before the title.
            </p>
          </div>

          <div className="space-y-5 text-center sm:text-left">
            <p className="text-xs tracking-[0.28em] uppercase text-muted-light font-light">
              Created by
            </p>
            <div className="space-y-3">
              <h2 className="font-display text-3xl sm:text-4xl tracking-tight">
                Akin Opaleye
              </h2>
              <p className="text-sm tracking-[0.16em] uppercase text-primary font-medium">
                Project and Experience Creator
              </p>
            </div>
            <p className="text-muted font-light leading-relaxed">
              Before the Title was created and curated as an invitation to
              remember the person beneath the role. Its first public chapter
              began in Newark; its next chapters continue wherever people are
              willing to answer honestly.
            </p>
            <a
              href="https://www.instagram.com/akin.bullion/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-primary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
            >
              @akin.bullion
            </a>
          </div>
        </motion.section>

        {/* Sponsors */}
        <section className="space-y-14 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0}
            variants={fadeUp}
            className="space-y-7"
          >
            <p className="text-xs tracking-[0.28em] uppercase text-muted-light font-light">
              First presented with
            </p>
            <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-10">
              {firstPresentedWith.map((s) => (
                <LogoCard key={s.name} sponsor={s} variant={s.variant || "card"} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={1}
            variants={fadeUp}
            className="space-y-7"
          >
            <p className="text-xs tracking-[0.28em] uppercase text-muted-light font-light">
              Built by the team at
            </p>
            <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-10">
              {builtWith.map((s) => (
                <LogoCard key={s.name} sponsor={s} variant={s.variant || "card"} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={2}
            variants={fadeUp}
            className="space-y-7"
          >
            <p className="text-xs tracking-[0.28em] uppercase text-muted-light font-light">
              Community and platform support
            </p>
            <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-10">
              {platformAndCommunitySupport.map((s) => (
                <LogoCard key={s.name} sponsor={s} variant="tile" />
              ))}
            </div>
          </motion.div>
        </section>

        <p className="text-center text-xs text-muted-light font-light leading-relaxed max-w-xs mx-auto">
          First presented in Newark with North to Shore Festival and Newark
          Arts. Continuing as an ongoing art project about identity, memory, and
          the selves we set aside.
        </p>
      </div>
    </main>
  );
}
