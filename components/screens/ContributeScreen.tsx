"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

export default function ContributeScreen() {
  const [name, setName] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [email, setEmail] = useState("");
  const [context, setContext] = useState("");
  const [shortFilm, setShortFilm] = useState(false);
  const [websiteSocial, setWebsiteSocial] = useState(false);
  const [participantType, setParticipantType] = useState<"in-person" | "online">("online");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (sessionStorage.getItem("source") === "in-person") {
        setParticipantType("in-person");
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const reflection = sessionStorage.getItem("reflection") || "";
    const artworkUrl = sessionStorage.getItem("artworkUrl") || "";
    const submissionId = sessionStorage.getItem("submissionId") || "";

    if (!submissionId) {
      setSubmitError("This piece was not saved to the archive. Please try again.");
      setSubmitting(false);
      return;
    }

    try {
      setSubmitError("");
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          reflection,
          artworkUrl,
          name: name || null,
          socialHandle: socialHandle || null,
          email,
          context: context || null,
          shortFilmOptIn: shortFilm,
          websiteSocialOptIn: websiteSocial,
          participantType,
          source: sessionStorage.getItem("source") || "online",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not save your contribution.");
      }

      router.push("/confirmation");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not save that update. Please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="mb-10">
          <ProgressBar current={3} total={3} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <h2
              className="font-display text-3xl sm:text-4xl leading-tight tracking-tight mb-4"
            >
              Submit your piece
              <br />
              for curation
            </h2>
            <p className="text-muted font-light text-sm leading-relaxed">
              Public archive placement requires your permission below and
              curator approval. Approved selections may appear in the archive
              or future project chapters.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Credit name
                <span className="text-muted-light font-light ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How you'd like to be credited, or leave blank"
                className="w-full bg-surface border border-border rounded-tl-[16px] rounded-tr-[4px] rounded-br-[16px] rounded-bl-[4px] px-5 py-3.5 text-base placeholder:text-muted-light/50 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Social profile
                <span className="text-muted-light font-light ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={socialHandle}
                onChange={(e) => setSocialHandle(e.target.value)}
                placeholder="@yourhandle or profile link"
                className="w-full bg-surface border border-border rounded-tl-[4px] rounded-tr-[16px] rounded-br-[4px] rounded-bl-[16px] px-5 py-3.5 text-base placeholder:text-muted-light/50 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email for follow-up
                <span className="text-muted-light font-light ml-1">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-surface border border-border rounded-tl-[16px] rounded-tr-[4px] rounded-br-[16px] rounded-bl-[4px] px-5 py-3.5 text-base placeholder:text-muted-light/50 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                One-sentence context
                <span className="text-muted-light font-light ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="What inspired your reflection?"
                className="w-full bg-surface border border-border rounded-tl-[8px] rounded-tr-[8px] rounded-br-[20px] rounded-bl-[20px] px-5 py-3.5 text-base placeholder:text-muted-light/50 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-300"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <p className="text-sm font-medium text-foreground">Permissions</p>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={shortFilm}
                  onChange={(e) => setShortFilm(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-tl-[4px] rounded-tr-[12px] rounded-br-[4px] rounded-bl-[12px] border-2 border-border peer-checked:border-primary peer-checked:bg-primary transition-all duration-200 flex items-center justify-center">
                  {shortFilm && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted leading-snug">
                My submission may be considered for future film or project chapters
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={websiteSocial}
                  onChange={(e) => setWebsiteSocial(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-tl-[12px] rounded-tr-[4px] rounded-br-[12px] rounded-bl-[4px] border-2 border-border peer-checked:border-primary peer-checked:bg-primary transition-all duration-200 flex items-center justify-center">
                  {websiteSocial && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted leading-snug">
                Consider my artwork for the public archive, website, or social features
              </span>
            </label>
            <p className="pl-8 text-xs text-muted-light font-light leading-relaxed">
              If this stays unchecked, your piece will not appear in the public archive.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <p className="text-sm font-medium text-foreground">How are you participating?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setParticipantType("in-person")}
                className={`flex-1 py-3 rounded-tl-[16px] rounded-tr-[6px] rounded-br-[16px] rounded-bl-[6px] border-2 text-sm font-medium transition-all duration-200 ${
                  participantType === "in-person"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted hover:border-primary/30"
                }`}
              >
                In-Person
              </button>
              <button
                type="button"
                onClick={() => setParticipantType("online")}
                className={`flex-1 py-3 rounded-tl-[6px] rounded-tr-[16px] rounded-br-[6px] rounded-bl-[16px] border-2 text-sm font-medium transition-all duration-200 ${
                  participantType === "online"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted hover:border-primary/30"
                }`}
              >
                Online
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            {submitError && (
              <p className="text-center text-sm text-red-600 font-light">
                {submitError}
              </p>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Submitting..." : "Submit for Curation Review"}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </main>
  );
}
