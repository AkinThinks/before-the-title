"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const PW_KEY = "btt_admin_pw";

type AdminTab =
  | "all"
  | "live"
  | "review"
  | "approved"
  | "rejected"
  | "recovery";
type ModerationStatus = "pending" | "approved" | "rejected";
type SafetyStatus = "unchecked" | "safe" | "review" | "rejected" | "error";

interface Submission {
  id: string;
  created_at: string;
  source: string;
  reflection: string;
  artwork_url: string | null;
  download_url: string | null;
  name: string | null;
  social_handle: string | null;
  email: string | null;
  context: string | null;
  short_film_opt_in: boolean;
  website_social_opt_in: boolean;
  safety_status: SafetyStatus | null;
  moderation_flagged: boolean | null;
  moderation_categories: Record<string, boolean> | null;
  moderation_scores: Record<string, number> | null;
  moderation_model: string | null;
  moderation_reason: string | null;
  moderation_checked_at: string | null;
  moderation_status: ModerationStatus;
  curator_notes: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inPerson: number;
  online: number;
  shortFilm: number;
  safe: number;
  flagged: number;
  archiveLive: number;
}

interface RecoveryStorageArtwork {
  id: string;
  file: string | null;
  original_file: string | null;
  artwork_url: string;
  original_url: string | null;
  created_at: string | null;
  size: number | null;
}

interface RecoveryData {
  privateSubmissions: Submission[];
  reviewSubmissions: Submission[];
  storageOnlyArtworks: RecoveryStorageArtwork[];
  storageError: string | null;
}

function hasPublicArtworkUrl(url: string | null) {
  return Boolean(url && !url.startsWith("data:"));
}

function isLive(submission: Submission) {
  return (
    submission.moderation_status === "approved" &&
    submission.website_social_opt_in &&
    hasPublicArtworkUrl(submission.artwork_url)
  );
}

function safetyCopy(status: SafetyStatus | null) {
  if (status === "safe") return "Safety: Safe";
  if (status === "review") return "Safety: Review";
  if (status === "rejected") return "Safety: Rejected";
  if (status === "error") return "Safety: Error";
  return "Safety: Unchecked";
}

function safetyClass(status: SafetyStatus | null) {
  if (status === "safe") return "bg-green-100 text-green-700";
  if (status === "review" || status === "error") return "bg-yellow-100 text-yellow-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-surface-warm text-muted";
}

function formatDate(value: string | null) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleDateString();
}

function formatFileSize(size: number | null) {
  if (!size) return "Unknown size";
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("all");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [recovery, setRecovery] = useState<RecoveryData>({
    privateSubmissions: [],
    reviewSubmissions: [],
    storageOnlyArtworks: [],
    storageError: null,
  });
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inPerson: 0,
    online: 0,
    shortFilm: 0,
    safe: 0,
    flagged: 0,
    archiveLive: 0,
  });
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [updateError, setUpdateError] = useState("");

  // Simple password gate (enforced by the API when ADMIN_PASSWORD is set).
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const fetchData = useCallback(async () => {
    const pw =
      typeof window !== "undefined" ? sessionStorage.getItem(PW_KEY) || "" : "";
    try {
      const [listRes, statsRes, recoveryRes] = await Promise.all([
        fetch("/api/admin?action=list", { headers: { "x-admin-password": pw } }),
        fetch("/api/admin?action=stats", { headers: { "x-admin-password": pw } }),
        fetch("/api/admin?action=recovery", {
          headers: { "x-admin-password": pw },
        }),
      ]);
      if (
        listRes.status === 401 ||
        statsRes.status === 401 ||
        recoveryRes.status === 401
      ) {
        sessionStorage.removeItem(PW_KEY);
        setAuthed(false);
        setAuthError(true);
        setLoading(false);
        return;
      }
      const listData = await listRes.json();
      const statsData = await statsRes.json();
      const recoveryData = await recoveryRes.json();
      if (!listRes.ok || !statsRes.ok || !recoveryRes.ok) {
        throw new Error(
          listData.error ||
            statsData.error ||
            recoveryData.error ||
            "Could not load admin data."
        );
      }
      setSubmissions(listData.submissions || []);
      setStats(statsData);
      setRecovery({
        privateSubmissions: recoveryData.privateSubmissions || [],
        reviewSubmissions: recoveryData.reviewSubmissions || [],
        storageOnlyArtworks: recoveryData.storageOnlyArtworks || [],
        storageError: recoveryData.storageError || null,
      });
      setLoadError("");
      setAuthed(true);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      if (pw) setAuthed(true);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Could not load admin data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let timeout: number | undefined;

    if (typeof window !== "undefined" && sessionStorage.getItem(PW_KEY)) {
      timeout = window.setTimeout(() => {
        setLoading(true);
        fetchData();
      }, 0);
    }
    const interval = window.setInterval(() => {
      if (sessionStorage.getItem(PW_KEY)) fetchData();
    }, 30000); // Refresh every 30s
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [fetchData]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!pwInput.trim()) return;
    sessionStorage.setItem(PW_KEY, pwInput.trim());
    setAuthError(false);
    setLoading(true);
    fetchData();
  };

  const updateSubmission = async (id: string, field: string, value: unknown) => {
    setUpdating(id);
    setUpdateError("");
    try {
      const pw = sessionStorage.getItem(PW_KEY) || "";
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ action: "update", id, field, value }),
      });

      if (response.status === 401) {
        sessionStorage.removeItem(PW_KEY);
        setAuthed(false);
        setAuthError(true);
        throw new Error("Admin password was rejected.");
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Update failed.");
      }

      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      );
      // Refresh stats after the database confirms the row update.
      const statsRes = await fetch("/api/admin?action=stats", {
        headers: { "x-admin-password": pw },
      });
      const statsData = await statsRes.json().catch(() => ({}));
      if (!statsRes.ok) {
        throw new Error(statsData.error || "Stats refresh failed.");
      }
      setStats(statsData);
    } catch (error) {
      console.error("Update failed:", error);
      setUpdateError(
        error instanceof Error ? error.message : "Update failed."
      );
    } finally {
      setUpdating(null);
    }
  };

  const recheckSubmission = async (id: string) => {
    setUpdating(id);
    setUpdateError("");
    try {
      const pw = sessionStorage.getItem(PW_KEY) || "";
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ action: "moderate", id }),
      });

      if (response.status === 401) {
        sessionStorage.removeItem(PW_KEY);
        setAuthed(false);
        setAuthError(true);
        throw new Error("Admin password was rejected.");
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Moderation recheck failed.");
      }

      await fetchData();
    } catch (error) {
      console.error("Moderation recheck failed:", error);
      setUpdateError(
        error instanceof Error ? error.message : "Moderation recheck failed."
      );
    } finally {
      setUpdating(null);
    }
  };

  const filtered = submissions.filter((s) => {
    if (activeTab === "recovery") return false;
    if (activeTab === "all") return true;
    if (activeTab === "live") return isLive(s);
    if (activeTab === "review") return s.moderation_status === "pending";
    return s.moderation_status === activeTab;
  });

  const recoveryCount =
    recovery.privateSubmissions.length +
    recovery.reviewSubmissions.length +
    recovery.storageOnlyArtworks.length;

  const exportCSV = () => {
    const csvCell = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const headers = [
      "ID",
      "Date",
      "Source",
      "Reflection",
      "Public Page",
      "Artwork URL",
      "Original URL",
      "Name",
      "Social Handle",
      "Email",
      "Context",
      "Short Film",
      "Web/Social",
      "Safety Status",
      "Moderation Flagged",
      "Moderation Reason",
      "Status",
    ];
    const rows = submissions.map((s) => [
      s.id,
      new Date(s.created_at).toISOString(),
      s.source,
      s.reflection,
      `${window.location.origin}/gallery/${s.id}`,
      s.artwork_url || "",
      s.download_url || "",
      s.name || "",
      s.social_handle || "",
      s.email,
      s.context || "",
      s.short_film_opt_in ? "Yes" : "No",
      s.website_social_opt_in ? "Yes" : "No",
      s.safety_status || "unchecked",
      s.moderation_flagged ? "Yes" : "No",
      s.moderation_reason || "",
      s.moderation_status,
    ]);
    const csv = [
      headers.map(csvCell).join(","),
      ...rows.map((r) => r.map(csvCell).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `before-the-title-submissions-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderRecoverySubmission = (submission: Submission) => (
    <div
      key={submission.id}
      className="bg-surface rounded-tl-[18px] rounded-tr-[6px] rounded-br-[18px] rounded-bl-[6px] border border-border p-5"
    >
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-light">
            <span className="px-2 py-0.5 rounded-full bg-surface-warm text-muted">
              {formatDate(submission.created_at)}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-medium ${
                submission.website_social_opt_in
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {submission.website_social_opt_in
                ? "Public permission: Yes"
                : "Public permission: No"}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-medium ${safetyClass(
                submission.safety_status
              )}`}
            >
              {safetyCopy(submission.safety_status)}
            </span>
          </div>

          <p className="text-lg leading-relaxed">
            &ldquo;{submission.reflection}&rdquo;
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-muted-light">
            <span>ID: {submission.id}</span>
            {submission.name && <span>Name: {submission.name}</span>}
            {submission.social_handle && (
              <span>Social: {submission.social_handle}</span>
            )}
            {submission.email && <span>Email: {submission.email}</span>}
          </div>

          <p className="text-xs text-muted-light font-light leading-relaxed">
            Keep private unless permission is confirmed. Use this row to inspect
            the recovered artwork, rerun safety, or add curator notes.
          </p>
        </div>

        <div className="w-full lg:w-36 shrink-0">
          {submission.artwork_url && (
            <a
              href={submission.artwork_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="relative aspect-square overflow-hidden rounded-tl-[14px] rounded-tr-[4px] rounded-br-[14px] rounded-bl-[4px] border border-border bg-background">
                <Image
                  src={submission.artwork_url}
                  alt="Recovered artwork"
                  fill
                  sizes="144px"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  unoptimized
                />
              </div>
              <span className="mt-2 block text-center text-xs text-muted-light group-hover:text-muted">
                Open image
              </span>
            </a>
          )}
        </div>

        <div className="flex flex-row lg:flex-col gap-2">
          <button
            onClick={() => recheckSubmission(submission.id)}
            disabled={updating === submission.id}
            className="px-3 py-1.5 rounded-tl-[3px] rounded-tr-[10px] rounded-br-[10px] rounded-bl-[3px] bg-surface-warm text-muted text-xs font-medium hover:bg-border-light transition-colors disabled:opacity-50"
          >
            Recheck
          </button>
          <button
            onClick={() => {
              const notes = prompt("Curator notes:", submission.curator_notes);
              if (notes !== null) {
                updateSubmission(submission.id, "curator_notes", notes);
              }
            }}
            className="px-3 py-1.5 rounded-tl-[6px] rounded-tr-[6px] rounded-br-[14px] rounded-bl-[3px] bg-surface-warm text-muted text-xs font-medium hover:bg-border-light transition-colors"
          >
            Notes
          </button>
        </div>
      </div>
    </div>
  );

  const renderRecovery = () => (
    <div className="space-y-8">
      <div className="bg-surface rounded-tl-[20px] rounded-tr-[6px] rounded-br-[20px] rounded-bl-[6px] border border-border p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-display text-2xl tracking-tight">
              Recovery Bin
            </h2>
            <p className="text-sm text-muted font-light leading-relaxed max-w-2xl">
              Private admin review for pieces created before the archive flow
              was fully stable. Nothing here is published automatically; public
              placement still requires permission and safety clearance.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-surface-warm px-3 py-2">
              <p className="text-xl font-semibold text-foreground">
                {recovery.privateSubmissions.length}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-light">
                Private
              </p>
            </div>
            <div className="rounded-xl bg-surface-warm px-3 py-2">
              <p className="text-xl font-semibold text-foreground">
                {recovery.reviewSubmissions.length}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-light">
                Review
              </p>
            </div>
            <div className="rounded-xl bg-surface-warm px-3 py-2">
              <p className="text-xl font-semibold text-foreground">
                {recovery.storageOnlyArtworks.length}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-light">
                Storage
              </p>
            </div>
          </div>
        </div>

        {recovery.storageError && (
          <p className="text-sm text-yellow-700 font-light">
            Storage scan warning: {recovery.storageError}
          </p>
        )}
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-xl tracking-tight">
              Database-backed, private
            </h3>
            <p className="text-sm text-muted-light font-light">
              These have rows, reflections, and images, but no public archive
              permission.
            </p>
          </div>
          <span className="text-sm text-muted-light">
            {recovery.privateSubmissions.length}
          </span>
        </div>

        {recovery.privateSubmissions.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface/70 p-5 text-sm text-muted-light">
            No private recoverable submissions found.
          </div>
        ) : (
          <div className="space-y-3">
            {recovery.privateSubmissions.map(renderRecoverySubmission)}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-xl tracking-tight">
              Database-backed, needs review
            </h3>
            <p className="text-sm text-muted-light font-light">
              These have images but are pending or rejected, so they stay hidden.
            </p>
          </div>
          <span className="text-sm text-muted-light">
            {recovery.reviewSubmissions.length}
          </span>
        </div>

        {recovery.reviewSubmissions.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface/70 p-5 text-sm text-muted-light">
            No image-backed submissions currently need review.
          </div>
        ) : (
          <div className="space-y-3">
            {recovery.reviewSubmissions.map(renderRecoverySubmission)}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-xl tracking-tight">
              Storage-only artworks
            </h3>
            <p className="text-sm text-muted-light font-light">
              Images found in Supabase Storage with no matching submission row.
              Treat these as visual recovery references only.
            </p>
          </div>
          <span className="text-sm text-muted-light">
            {recovery.storageOnlyArtworks.length}
          </span>
        </div>

        {recovery.storageOnlyArtworks.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface/70 p-5 text-sm text-muted-light">
            No storage-only artworks found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recovery.storageOnlyArtworks.map((artwork) => (
              <div
                key={artwork.id}
                className="overflow-hidden rounded-tl-[18px] rounded-tr-[6px] rounded-br-[18px] rounded-bl-[6px] border border-border bg-surface"
              >
                <a
                  href={artwork.artwork_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="relative aspect-square bg-background">
                    <Image
                      src={artwork.artwork_url}
                      alt="Storage-only recovered artwork"
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      unoptimized
                    />
                  </div>
                </a>
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-light">
                    <span className="rounded-full bg-surface-warm px-2 py-0.5">
                      {formatDate(artwork.created_at)}
                    </span>
                    <span className="rounded-full bg-surface-warm px-2 py-0.5">
                      {formatFileSize(artwork.size)}
                    </span>
                  </div>
                  <p className="break-all text-xs text-muted-light">
                    {artwork.id}
                  </p>
                  <p className="text-sm text-muted font-light leading-relaxed">
                    No reflection, contact, or consent row was found. Do not add
                    to the public archive without manual confirmation.
                  </p>
                  {artwork.original_url && (
                    <a
                      href={artwork.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-xs font-medium text-primary hover:text-primary-light"
                    >
                      Open original file
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-surface border border-border rounded-tl-[20px] rounded-tr-[6px] rounded-br-[20px] rounded-bl-[6px] p-8 space-y-5"
        >
          <div className="text-center space-y-1">
            <h1 className="font-display text-2xl tracking-tight">Before the Title</h1>
            <p className="text-sm text-muted font-light">Admin access</p>
          </div>
          <input
            type="password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
          {authError && (
            <p className="text-sm text-red-600 font-light text-center">
              Incorrect password.
            </p>
          )}
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors"
          >
            Enter
          </button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <h1
              className="font-display text-3xl sm:text-4xl tracking-tight mb-2"
            >
              Before the Title
            </h1>
            <p className="text-muted font-light">Admin &amp; Curation Dashboard</p>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-tl-[6px] rounded-tr-[14px] rounded-br-[6px] rounded-bl-[14px] bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors"
          >
            Export CSV
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 gap-3 mb-8"
        >
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Review", value: stats.pending, color: "text-yellow-600" },
            { label: "Approved", value: stats.approved, color: "text-green-600" },
            { label: "Rejected", value: stats.rejected, color: "text-red-600" },
            { label: "In-Person", value: stats.inPerson, color: "text-primary" },
            { label: "Online", value: stats.online, color: "text-secondary" },
            { label: "Short Film", value: stats.shortFilm, color: "text-accent-teal" },
            { label: "Safe", value: stats.safe, color: "text-green-700" },
            { label: "Flagged", value: stats.flagged, color: "text-yellow-700" },
            { label: "Archive Live", value: stats.archiveLive, color: "text-green-700" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-surface rounded-tl-[14px] rounded-tr-[4px] rounded-br-[14px] rounded-bl-[4px] border border-border p-4 text-center"
            >
              <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-light font-light mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(
            [
              "all",
              "live",
              "review",
              "approved",
              "rejected",
              "recovery",
            ] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-tl-[14px] rounded-tr-[6px] rounded-br-[14px] rounded-bl-[6px] text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-muted hover:border-primary/30"
              }`}
            >
              {tab === "review"
                ? "Review"
                : tab === "recovery"
                ? `Recovery (${recoveryCount})`
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-light">
            <p className="font-light">Loading submissions...</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-red-600 font-light">{loadError}</p>
            <p className="text-sm text-muted-light font-light">
              Check the production environment variables, then redeploy.
            </p>
          </div>
        ) : activeTab === "recovery" ? (
          renderRecovery()
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-light">
            <p className="font-light">No submissions in this category yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((submission, index) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface rounded-tl-[20px] rounded-tr-[6px] rounded-br-[20px] rounded-bl-[6px] border border-border p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-light flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          submission.source === "in-person"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        {submission.source}
                      </span>
                      <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          submission.moderation_status === "approved"
                            ? "bg-green-100 text-green-700"
                            : submission.moderation_status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {submission.moderation_status}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${safetyClass(
                          submission.safety_status
                        )}`}
                      >
                        {safetyCopy(submission.safety_status)}
                      </span>
                    </div>

                    <p className="text-lg leading-relaxed">&ldquo;{submission.reflection}&rdquo;</p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-light">
                      {submission.name && <span>Name: {submission.name}</span>}
                      {submission.social_handle && (
                        <span>Social: {submission.social_handle}</span>
                      )}
                      {submission.email && <span>Email: {submission.email}</span>}
                      {submission.context && <span>Context: {submission.context}</span>}
                    </div>

                    <div className="flex gap-3 text-xs text-muted-light">
                      <span className={submission.short_film_opt_in ? "text-primary font-medium" : ""}>
                        {submission.short_film_opt_in ? "Short film: Yes" : "Short film: No"}
                      </span>
                      <span className={submission.website_social_opt_in ? "text-primary font-medium" : ""}>
                        {submission.website_social_opt_in ? "Web/Social: Yes" : "Web/Social: No"}
                      </span>
                      <span
                        className={
                          isLive(submission)
                            ? "text-green-700 font-medium"
                            : ""
                        }
                      >
                        {isLive(submission)
                          ? "Archive: Live"
                          : submission.moderation_status === "approved"
                          ? "Archive: No permission"
                          : submission.moderation_status === "pending"
                          ? "Archive: In review"
                          : "Archive: Hidden"}
                      </span>
                    </div>

                    {(submission.moderation_reason ||
                      submission.moderation_flagged ||
                      submission.safety_status === "unchecked") && (
                      <div className="space-y-1 text-xs text-muted-light">
                        {submission.moderation_reason && (
                          <p>{submission.moderation_reason}</p>
                        )}
                        {submission.safety_status === "unchecked" && (
                          <p>Run a safety recheck for older submissions.</p>
                        )}
                        {submission.moderation_categories &&
                          Object.entries(submission.moderation_categories).some(
                            ([, active]) => active
                          ) && (
                            <p>
                              Categories:{" "}
                              {Object.entries(submission.moderation_categories)
                                .filter(([, active]) => active)
                                .map(([category]) => category)
                                .join(", ")}
                            </p>
                          )}
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-40 shrink-0">
                    {submission.artwork_url ? (
                      <a
                        href={submission.artwork_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <div className="relative w-full aspect-square overflow-hidden rounded-tl-[14px] rounded-tr-[4px] rounded-br-[14px] rounded-bl-[4px] bg-background border border-border">
                          <Image
                            src={submission.artwork_url}
                            alt={`Artwork submitted by ${submission.name || submission.email || "a participant"}`}
                            fill
                            sizes="(max-width: 1024px) 100vw, 160px"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            unoptimized
                          />
                        </div>
                        <span className="mt-2 block text-center text-xs text-muted-light group-hover:text-muted transition-colors">
                          Open image
                        </span>
                      </a>
                    ) : (
                      <div className="w-full aspect-square rounded-tl-[14px] rounded-tr-[4px] rounded-br-[14px] rounded-bl-[4px] bg-background border border-border flex items-center justify-center text-xs text-muted-light text-center px-4">
                        No image yet
                      </div>
                    )}
                    {isLive(submission) ? (
                      <a
                        href={`/gallery/${submission.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block text-center text-xs text-muted-light hover:text-muted transition-colors"
                      >
                        Open public page
                      </a>
                    ) : (
                      <span className="mt-2 block text-center text-xs text-muted-light">
                        Public page hidden
                      </span>
                    )}
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2">
                    <button
                      onClick={() => updateSubmission(submission.id, "moderation_status", "approved")}
                      disabled={updating === submission.id}
                      className="px-3 py-1.5 rounded-tl-[10px] rounded-tr-[3px] rounded-br-[10px] rounded-bl-[3px] bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => updateSubmission(submission.id, "moderation_status", "pending")}
                      disabled={updating === submission.id}
                      className="px-3 py-1.5 rounded-tl-[6px] rounded-tr-[6px] rounded-br-[14px] rounded-bl-[3px] bg-yellow-100 text-yellow-700 text-xs font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => updateSubmission(submission.id, "moderation_status", "rejected")}
                      disabled={updating === submission.id}
                      className="px-3 py-1.5 rounded-tl-[3px] rounded-tr-[10px] rounded-br-[3px] rounded-bl-[10px] bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => recheckSubmission(submission.id)}
                      disabled={updating === submission.id}
                      className="px-3 py-1.5 rounded-tl-[3px] rounded-tr-[10px] rounded-br-[10px] rounded-bl-[3px] bg-surface-warm text-muted text-xs font-medium hover:bg-border-light transition-colors disabled:opacity-50"
                    >
                      Recheck
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt("Curator notes:", submission.curator_notes);
                        if (notes !== null) updateSubmission(submission.id, "curator_notes", notes);
                      }}
                      className="px-3 py-1.5 rounded-tl-[6px] rounded-tr-[6px] rounded-br-[14px] rounded-bl-[3px] bg-surface-warm text-muted text-xs font-medium hover:bg-border-light transition-colors"
                    >
                      Notes
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {updateError && (
          <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-red-200 bg-white px-4 py-3 text-center text-sm text-red-700 shadow-lg">
            {updateError}
          </div>
        )}
      </div>
    </div>
  );
}
