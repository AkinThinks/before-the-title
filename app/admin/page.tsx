"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface Submission {
  id: string;
  created_at: string;
  source: string;
  reflection: string;
  artwork_url: string | null;
  name: string | null;
  email: string;
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
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [listRes, statsRes] = await Promise.all([
        fetch("/api/admin?action=list"),
        fetch("/api/admin?action=stats"),
      ]);
      const listData = await listRes.json();
      const statsData = await statsRes.json();
      setSubmissions(listData.submissions || []);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const updateSubmission = async (id: string, field: string, value: unknown) => {
    setUpdating(id);
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id, field, value }),
      });
      // Update local state
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      );
      // Refresh stats
      const statsRes = await fetch("/api/admin?action=stats");
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
    const headers = ["ID", "Date", "Source", "Reflection", "Name", "Email", "Context", "Short Film", "Web/Social", "Status"];
    const rows = submissions.map((s) => [
      s.id,
      new Date(s.created_at).toISOString(),
      s.source,
      `"${s.reflection.replace(/"/g, '""')}"`,
      s.name || "",
      s.email,
      s.context || "",
      s.short_film_opt_in ? "Yes" : "No",
      s.website_social_opt_in ? "Yes" : "No",
      s.moderation_status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `before-the-title-submissions-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
                      <span>Email: {submission.email}</span>
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
