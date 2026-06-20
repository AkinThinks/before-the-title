"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const PW_KEY = "btt_admin_pw";

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
  moderation_status: string;
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
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, inPerson: 0, online: 0, shortFilm: 0 });
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // Simple password gate (enforced by the API when ADMIN_PASSWORD is set).
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const fetchData = useCallback(async () => {
    const pw =
      typeof window !== "undefined" ? sessionStorage.getItem(PW_KEY) || "" : "";
    try {
      const [listRes, statsRes] = await Promise.all([
        fetch("/api/admin?action=list", { headers: { "x-admin-password": pw } }),
        fetch("/api/admin?action=stats", { headers: { "x-admin-password": pw } }),
      ]);
      if (listRes.status === 401 || statsRes.status === 401) {
        sessionStorage.removeItem(PW_KEY);
        setAuthed(false);
        setAuthError(true);
        setLoading(false);
        return;
      }
      const listData = await listRes.json();
      const statsData = await statsRes.json();
      setSubmissions(listData.submissions || []);
      setStats(statsData);
      setAuthed(true);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
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
    try {
      const pw = sessionStorage.getItem(PW_KEY) || "";
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ action: "update", id, field, value }),
      });
      // Update local state
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      );
      // Refresh stats
      const statsRes = await fetch("/api/admin?action=stats", {
        headers: { "x-admin-password": pw },
      });
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = submissions.filter((s) => {
    if (activeTab === "all") return true;
    return s.moderation_status === activeTab;
  });

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
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8"
        >
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Pending", value: stats.pending, color: "text-yellow-600" },
            { label: "Approved", value: stats.approved, color: "text-green-600" },
            { label: "Rejected", value: stats.rejected, color: "text-red-600" },
            { label: "In-Person", value: stats.inPerson, color: "text-primary" },
            { label: "Online", value: stats.online, color: "text-secondary" },
            { label: "Short Film", value: stats.shortFilm, color: "text-accent-teal" },
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
          {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-tl-[14px] rounded-tr-[6px] rounded-br-[14px] rounded-bl-[6px] text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-muted hover:border-primary/30"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-light">
            <p className="font-light">Loading submissions...</p>
          </div>
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
                    </div>
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
                    <a
                      href={`/gallery/${submission.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-center text-xs text-muted-light hover:text-muted transition-colors"
                    >
                      Open page
                    </a>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2">
                    <button
                      onClick={() => updateSubmission(submission.id, "moderation_status", "approved")}
                      disabled={updating === submission.id}
                      className="px-3 py-1.5 rounded-tl-[10px] rounded-tr-[3px] rounded-br-[10px] rounded-bl-[3px] bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateSubmission(submission.id, "moderation_status", "rejected")}
                      disabled={updating === submission.id}
                      className="px-3 py-1.5 rounded-tl-[3px] rounded-tr-[10px] rounded-br-[3px] rounded-bl-[10px] bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      Reject
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
      </div>
    </div>
  );
}
