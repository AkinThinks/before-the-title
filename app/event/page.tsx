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
 *    wordmark logos (North to Shore, Newark Arts, SalesParrot).
 *  - "tile": a rounded, edge-to-edge "app-icon" badge, for photo/dark
 *    community logos that look best filling the frame (NJ Code & Coffee,
 *    LaunchBox).
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

const presentedBy: Sponsor[] = [
  { src: "/logos/north2shore.png", name: "North to Shore", href: "https://northtoshore.com" },
  { src: "/logos/newark-arts.png", name: "Newark Arts", href: "https://www.newarkarts.org" },
  {
    src: "/logos/salesparrot.png",
    name: "SalesParrot",
    href: "https://www.salesparrot.com",
    variant: "tile",
  },
];

const supportedBy: Sponsor[] = [
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
    body: "Your reflection is gently transformed into a one-of-a-kind piece of generative artwork, created in the moment, just for you.",
  },
  {
    n: "03",
    title: "Join the gallery",
    body: "Your piece takes its place in a living, collective gallery of strangers, a portrait of who we all are beneath our titles.",
  },
];

const facts = [
  { label: "Admission", value: "Free" },
  { label: "Duration", value: "~3 min" },
  { label: "Location", value: "Newark, NJ" },
  { label: "All ages", value: "Welcome" },
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
          <motion.p
            custom={0}
            variants={fadeUp}
            className="text-xs sm:text-sm tracking-[0.3em] uppercase text-muted-light font-light"
          >
            North&nbsp;to&nbsp;Shore Festival · Newark Arts
          </motion.p>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="font-display text-5xl sm:text-6xl md:text-7xl leading-[1.03] tracking-tight"
          >
            Before
            <br />
            the Title
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted leading-relaxed font-light max-w-md mx-auto"
          >
            Your reflection becomes art.
            <br />
            Your voice becomes story.
          </motion.p>

          <motion.p
            custom={3}
            variants={fadeUp}
            className="text-base text-muted leading-relaxed font-light max-w-lg mx-auto"
          >
            A free, interactive art experience about who we are beyond our
            titles. Step away from the labels you carry, like your job, your role,
            and your résumé, and answer one honest question. In a few quiet moments,
            your words become an original artwork that joins a growing,
            collective gallery of the people who came before you.
          </motion.p>

          <motion.div
            custom={4}
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Button href="/experience?src=online">Begin the Experience</Button>
            <Button href="/gallery" variant="secondary">
              View Gallery
            </Button>
          </motion.div>
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

        {/* Details */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          custom={0}
          variants={fadeUp}
          className="grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-border bg-border"
        >
          {facts.map((f) => (
            <div
              key={f.label}
              className="bg-surface/90 px-4 py-5 text-center space-y-1"
            >
              <p className="font-display text-xl tracking-tight text-foreground">
                {f.value}
              </p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-light font-light">
                {f.label}
              </p>
            </div>
          ))}
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
              Presented by
            </p>
            <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-10">
              {presentedBy.map((s) => (
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
              With support from our communities
            </p>
            <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-10">
              {supportedBy.map((s) => (
                <LogoCard key={s.name} sponsor={s} variant="tile" />
              ))}
            </div>
          </motion.div>
        </section>

        <p className="text-center text-xs text-muted-light font-light leading-relaxed max-w-xs mx-auto">
          An interactive installation about identity, memory, and the selves we
          set aside.
        </p>
      </div>
    </main>
  );
}
