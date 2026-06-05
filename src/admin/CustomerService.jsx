import React, { useState, useEffect } from "react";
import {
  Search, X, Send, ChevronDown, MessageSquare,
  AlertCircle, Bug, Flag, HelpCircle, CheckCircle, Clock, Inbox,
} from "lucide-react";
import { db } from "../Config/firebaseConfig";
import {
  collection, getDocs, doc, updateDoc, getDoc,
  addDoc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { useAuth } from "../Auth/AuthContext";

// ── Constants ─────────────────────────────────────────────────────

/**
 * Firestore collection: "queries"
 * Fields per document:
 *   userId        string   — UID of submitting user
 *   type          string   — "bug" | "report" | "inquiry" | "other"
 *   subject       string
 *   message       string
 *   status        string   — "open" | "in_progress" | "resolved"
 *   createdAt     timestamp
 *   resolvedAt    timestamp | null
 *   adminReply    string | null
 *   repliedBy     string | null  — admin UID
 *   repliedAt     timestamp | null
 */

const QUERY_TYPES = [
  { key: "bug",     label: "Bug Report",    icon: <Bug size={14} />,         color: "bg-red-100 text-red-700" },
  { key: "report",  label: "User Report",   icon: <Flag size={14} />,        color: "bg-orange-100 text-orange-700" },
  { key: "inquiry", label: "Inquiry",       icon: <HelpCircle size={14} />,  color: "bg-blue-100 text-blue-700" },
  { key: "other",   label: "Other",         icon: <MessageSquare size={14} />,color: "bg-gray-100 text-gray-700" },
];

const STATUSES = [
  { key: "open",        label: "Open",        color: "bg-yellow-100 text-yellow-700", icon: <Inbox size={13} /> },
  { key: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700",    icon: <Clock size={13} /> },
  { key: "resolved",    label: "Resolved",    color: "bg-green-100 text-green-700",  icon: <CheckCircle size={13} /> },
];

const typeMeta  = (k) => QUERY_TYPES.find((t) => t.key === k) || QUERY_TYPES[3];
const statusMeta = (k) => STATUSES.find((s) => s.key === k) || STATUSES[0];

const formatDate = (ts) => {
  if (!ts) return "N/A";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

// ── Query Detail / Reply Modal ────────────────────────────────────
const QueryDetailModal = ({ queryDoc, submitter, onClose, onUpdate, adminUser }) => {
  const [reply, setReply] = useState(queryDoc.adminReply || "");
  const [status, setStatus] = useState(queryDoc.status || "open");
  const [saving, setSaving] = useState(false);
  const tMeta = typeMeta(queryDoc.type);
  const sMeta = statusMeta(status);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      status,
      adminReply: reply,
      repliedBy: adminUser.uid,
      repliedAt: serverTimestamp(),
      ...(status === "resolved" ? { resolvedAt: serverTimestamp() } : {}),
    };
    await onUpdate(queryDoc.id, updates);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border-t-4 border-indigo-500">

        {/* Header */}
        <div className="flex justify-between items-start px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${tMeta.color}`}>
                {tMeta.icon}{tMeta.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${sMeta.color}`}>
                {sMeta.icon}{sMeta.label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800">{queryDoc.subject || "No Subject"}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Submitted {formatDate(queryDoc.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Submitter */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Submitted By</p>
            {submitter ? (
              <div className="text-sm text-gray-700 space-y-0.5">
                <p><span className="font-semibold">Name:</span> {submitter.username || "N/A"}</p>
                <p><span className="font-semibold">Email:</span> {submitter.email}</p>
                <p><span className="font-semibold">Phone:</span> {submitter.phoneNumber || "N/A"}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">User details unavailable.</p>
            )}
          </div>

          {/* Message */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Message</p>
            <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-xl p-4">
              {queryDoc.message || "No message body."}
            </p>
          </div>

          {/* Change status */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                    ${status === s.key ? `${s.color} border-transparent` : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"}`}
                >
                  {s.icon}{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Admin reply */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Reply to User</p>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              placeholder="Type your response here… The user will see this in the app."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
            {queryDoc.repliedAt && (
              <p className="text-xs text-gray-400 mt-1">
                Last replied {formatDate(queryDoc.repliedAt)}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Send size={15} />{saving ? "Saving…" : "Save & Reply"}
          </button>
        </div>
      </div>
    </div>
  );
};

const FilterPill = ({ label, count, active, onClick, color, inactiveColor }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? color : `${inactiveColor} hover:bg-gray-200`}`}
  >
    {label}
    <span className={`px-1.5 py-0.5 rounded-full text-xs ${active ? "bg-white/30" : "bg-gray-200 text-gray-500"}`}>{count}</span>
  </button>
);

// ── Main Component ────────────────────────────────────────────────
const CustomerService = () => {
  const { currentUser } = useAuth();
  const [queries, setQueries] = useState([]);
  const [submitters, setSubmitters] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "queries"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, status: "open", ...d.data() }));
      setQueries(data);

      const uids = [...new Set(data.map((q) => q.userId).filter(Boolean))];
      const profiles = {};
      await Promise.all(uids.map(async (uid) => {
        try {
          const u = await getDoc(doc(db, "users", uid));
          if (u.exists()) profiles[uid] = u.data();
        } catch (_) {}
      }));
      setSubmitters(profiles);
    } catch (err) {
      console.error("Error fetching queries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterType]);

  const handleUpdate = async (id, updates) => {
    try {
      await updateDoc(doc(db, "queries", id), updates);
      setQueries((prev) => prev.map((q) => q.id === id ? { ...q, ...updates } : q));
    } catch (err) { console.error(err); }
  };

  const filtered = queries.filter((q) => {
    const matchSearch =
      q.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || q.status === filterStatus;
    const matchType   = filterType === "all"   || q.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const statusCounts = queries.reduce((acc, q) => {
    acc[q.status || "open"] = (acc[q.status || "open"] || 0) + 1;
    return acc;
  }, {});
  const typeCounts = queries.reduce((acc, q) => {
    acc[q.type || "other"] = (acc[q.type || "other"] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-t-4 border-indigo-500">

      {selected && (
        <QueryDetailModal
          queryDoc={selected}
          submitter={submitters[selected.userId]}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          adminUser={currentUser}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customer Service</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {queries.length} total · {statusCounts.open || 0} open · {statusCounts.in_progress || 0} in progress
          </p>
        </div>
        <div className="relative">
          <input
            type="text" placeholder="Search subject or message…"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-indigo-400 w-64"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        <FilterPill label="All Statuses" count={queries.length} active={filterStatus === "all"} onClick={() => setFilterStatus("all")} color="bg-gray-800 text-white" inactiveColor="bg-gray-100 text-gray-600" />
        {STATUSES.map((s) => (
          <FilterPill key={s.key} label={s.label} count={statusCounts[s.key] || 0} active={filterStatus === s.key} onClick={() => setFilterStatus(s.key)} color={s.color} inactiveColor="bg-gray-100 text-gray-600" />
        ))}
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterPill label="All Types" count={queries.length} active={filterType === "all"} onClick={() => setFilterType("all")} color="bg-indigo-500 text-white" inactiveColor="bg-gray-100 text-gray-600" />
        {QUERY_TYPES.map((t) => (
          <FilterPill key={t.key} label={t.label} count={typeCounts[t.key] || 0} active={filterType === t.key} onClick={() => setFilterType(t.key)} color={t.color} inactiveColor="bg-gray-100 text-gray-600" />
        ))}
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-400 animate-pulse">Loading queries…</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Subject</th>
                  <th className="p-4 font-semibold">From</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Replied</th>
                  <th className="p-4 font-semibold text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((q) => {
                  const tM = typeMeta(q.type);
                  const sM = statusMeta(q.status);
                  const sub = submitters[q.userId];
                  return (
                    <tr
                      key={q.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${q.status === "open" ? "font-medium" : ""}`}
                    >
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${tM.color}`}>
                          {tM.icon}{tM.label}
                        </span>
                      </td>
                      <td className="p-4 text-gray-800 max-w-[200px] truncate">{q.subject || "No subject"}</td>
                      <td className="p-4 text-gray-600">{sub?.username || sub?.email || q.userId?.slice(0, 8) + "…"}</td>
                      <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(q.createdAt)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${sM.color}`}>
                          {sM.icon}{sM.label}
                        </span>
                      </td>
                      <td className="p-4">
                        {q.adminReply ? (
                          <span className="text-xs text-green-600 font-semibold">Yes</span>
                        ) : (
                          <span className="text-xs text-gray-400">No</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelected(q)}
                          className="text-gray-400 hover:text-indigo-500 transition-colors"
                          title="View & reply"
                        >
                          <MessageSquare size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan="7" className="p-10 text-center text-gray-400">No queries match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
            <span>
              {filtered.length === 0 ? "0" : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                .map((p, idx) => p === "..." ? (
                  <span key={`e-${idx}`} className="px-2 py-1 text-gray-400">…</span>
                ) : (
                  <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 rounded-full transition-all ${currentPage === p ? "bg-indigo-500 text-white font-bold" : "bg-gray-100 hover:bg-gray-200"}`}>{p}</button>
                ))}
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerService;
