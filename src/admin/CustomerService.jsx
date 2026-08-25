import React, { useState, useEffect } from "react";
import {
  Search, X, Send, CheckCircle,
  AlertCircle, Bug, Flag, HelpCircle, Clock, Inbox, Image as ImageIcon,
} from "lucide-react";
import { db } from "../Config/firebaseConfig";
import {
  collection, getDocs, doc, updateDoc, getDoc,
  addDoc, setDoc, serverTimestamp, query, orderBy, onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../Auth/AuthContext";
import { UserDetailView } from "./UsersManager";

// ── Constants ─────────────────────────────────────────────────────
const QUERY_TYPES = [
  { key: "bug",     label: "Bug Report",  icon: <Bug size={14} />,        color: "bg-red-100 text-red-700"    },
  { key: "report",  label: "User Report", icon: <Flag size={14} />,       color: "bg-orange-100 text-orange-700"},
  { key: "inquiry", label: "Inquiry",     icon: <HelpCircle size={14} />, color: "bg-blue-100 text-blue-700"  },
  { key: "other",   label: "Other",       icon: <AlertCircle size={14} />,color: "bg-gray-100 text-gray-700"  },
];

const STATUSES = [
  { key: "open",        label: "Open",        color: "bg-yellow-100 text-yellow-700", icon: <Inbox size={13} />       },
  { key: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700",    icon: <Clock size={13} />       },
  { key: "resolved",    label: "Resolved",    color: "bg-green-100 text-green-700",  icon: <CheckCircle size={13} /> },
];

const typeMeta  = (k) => QUERY_TYPES.find((t) => t.key === k) || QUERY_TYPES[3];
const statusMeta = (k) => STATUSES.find((s) => s.key === k)   || STATUSES[0];

const fmtDate = (ts) => {
  if (!ts) return "N/A";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// ── Message Bubble (admin thread view) ───────────────────────────
const MsgBubble = ({ msg, isAdmin }) => (
  <div className={`flex ${isAdmin ? "justify-end" : "justify-start"} mb-3`}>
    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm
      ${isAdmin
        ? "bg-indigo-500 text-white rounded-br-sm"
        : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
      {msg.imageUrls?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {msg.imageUrls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="attachment" className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-90" />
            </a>
          ))}
        </div>
      )}
      {msg.text && <p className="leading-relaxed">{msg.text}</p>}
      <p className={`text-xs mt-1 ${isAdmin ? "text-indigo-200" : "text-gray-400"} text-right`}>
        {fmtDate(msg.createdAt)}
        {msg.senderRole === "admin" && <span className="ml-1">· You</span>}
      </p>
    </div>
  </div>
);

// ── Thread Modal ──────────────────────────────────────────────────
const ThreadModal = ({
  ticket, submitter, onClose, onStatusChange, adminUser,
  onSubmitterBlacklisted, onSubmitterDeleted,
}) => {
  const [messages, setMessages] = useState([]);
  const [reply, setReply]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [status, setStatus]     = useState(ticket.status || "open");
  const [viewingUser, setViewingUser] = useState(false);
  const bottomRef = React.useRef(null);
  const tM = typeMeta(ticket.type);
  const sM = statusMeta(status);

  // Real-time thread
  useEffect(() => {
    const q = query(
      collection(db, "queries", ticket.id, "messages"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    });
  }, [ticket.id]);

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      // Write message to subcollection
      await addDoc(collection(db, "queries", ticket.id, "messages"), {
        text:       reply.trim(),
        imageUrls:  [],
        senderId:   adminUser.uid,
        senderRole: "admin",
        createdAt:  serverTimestamp(),
      });

      // Update ticket metadata
      const updates = {
        status,
        adminReply:  reply.trim(),
        repliedBy:   adminUser.uid,
        repliedAt:   serverTimestamp(),
        lastMessage: reply.trim(),
        updatedAt:   serverTimestamp(),
        ...(status === "resolved" ? { resolvedAt: serverTimestamp() } : {}),
      };
      await updateDoc(doc(db, "queries", ticket.id), updates);
      onStatusChange(ticket.id, updates);

      // Upsert notification — same queryId = same doc, no duplicates
      if (ticket.userId) {
        await setDoc(
          doc(db, "users", ticket.userId, "notifications", ticket.id),
          {
            type:     "reply",
            subject:  ticket.subject || "Your query",
            message:  reply.trim(),
            queryId:  ticket.id,
            read:     false,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      setReply("");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    setSaving(true);
    try {
      const updates = { status: "resolved", resolvedAt: serverTimestamp(), updatedAt: serverTimestamp() };
      await updateDoc(doc(db, "queries", ticket.id), updates);
      onStatusChange(ticket.id, updates);
      onClose();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col border-t-4 border-indigo-500">

          {/* Header */}
          <div className="flex justify-between items-start px-5 py-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${tM.color}`}>
                  {tM.icon}{tM.label}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${sM.color}`}>
                  {sM.icon}{sM.label}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-800">{ticket.subject || "No Subject"}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Opened {fmtDate(ticket.createdAt)}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>

          {/* Submitter — click to open full user details */}
          {submitter && (
            <button
              onClick={() => setViewingUser(true)}
              className="w-full px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-3 text-sm hover:bg-gray-100 transition-colors text-left"
              title="View user details"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                {(submitter.username || submitter.email || "U")[0].toUpperCase()}
              </div>
              <span className="text-gray-600">
                <span className="font-semibold">{submitter.username || "User"}</span>
                {" · "}{submitter.email}
                {submitter.phoneNumber && ` · ${submitter.phoneNumber}`}
              </span>
            </button>
          )}

          {/* Thread */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* Original message card */}
            {ticket.message && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Original Message</p>
                <p className="whitespace-pre-line">{ticket.message}</p>
              </div>
            )}
            {messages.map(msg => (
              <MsgBubble key={msg.id} msg={msg} isAdmin={msg.senderRole === "admin"} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Status selector */}
          <div className="px-5 py-2 border-t border-gray-100 flex gap-2">
            {STATUSES.map(s => (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all
                  ${status === s.key ? `${s.color} border-transparent` : "bg-white border-gray-300 text-gray-500 hover:border-gray-400"}`}
              >
                {s.icon}{s.label}
              </button>
            ))}
            {ticket.status !== "resolved" && (
              <button
                onClick={handleClose}
                disabled={saving}
                className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-all disabled:opacity-50"
              >
                <CheckCircle size={12} /> Close Ticket
              </button>
            )}
          </div>

          {/* Reply input */}
          {ticket.status !== "resolved" && (
            <div className="px-5 pb-4 pt-2 border-t border-gray-100">
              <div className="flex gap-2 items-end">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  rows={2}
                  placeholder="Type a reply… (Enter to send, Shift+Enter for new line)"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={saving || !reply.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition-all disabled:opacity-50"
                >
                  <Send size={15} />{saving ? "…" : "Send"}
                </button>
              </div>
            </div>
          )}
          {ticket.status === "resolved" && (
            <div className="px-5 pb-4 pt-2 text-center text-sm text-gray-400">
              This ticket is resolved. No further replies can be sent.
            </div>
          )}
        </div>
      </div>

      {/* Full user detail view — renders on top of the thread modal (z-50 > z-40) */}
      {viewingUser && submitter && (
        <UserDetailView
          user={submitter}
          onBack={() => setViewingUser(false)}
          onBlacklisted={(uid, reason) => onSubmitterBlacklisted?.(uid, reason)}
          onDeleted={(uid) => {
            onSubmitterDeleted?.(uid);
            setViewingUser(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

const FilterPill = ({ label, count, active, onClick, color, inactiveColor }) => (
  <button onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? color : `${inactiveColor} hover:bg-gray-200`}`}>
    {label}
    <span className={`px-1.5 py-0.5 rounded-full text-xs ${active ? "bg-white/30" : "bg-gray-200 text-gray-500"}`}>{count}</span>
  </button>
);

// ── Main Component ────────────────────────────────────────────────
const CustomerService = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets]         = useState([]);
  const [submitters, setSubmitters]   = useState({});
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType]   = useState("all");
  const [selected, setSelected]       = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "queries"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, status: "open", ...d.data() }));
      setTickets(data);

      const uids = [...new Set(data.map(q => q.userId).filter(Boolean))];
      const profiles = {};
      await Promise.all(uids.map(async uid => {
        try {
          const u = await getDoc(doc(db, "users", uid));
          // Include `id` here — UserDetailView's blacklist/delete actions
          // both call doc(db, 'users', user.id), and without it those
          // writes would silently target an undefined doc.
          if (u.exists()) profiles[uid] = { id: uid, ...u.data() };
        } catch (_) {}
      }));
      setSubmitters(profiles);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterType]);

  const handleStatusChange = (id, updates) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    setSelected(prev => prev?.id === id ? { ...prev, ...updates } : prev);
  };

  // Keeps the cached submitter profile in sync after actions taken from
  // inside the embedded UserDetailView, so reopening it in the same
  // session doesn't show stale blacklist status.
  const handleSubmitterBlacklisted = (uid, reason) => {
    setSubmitters(prev => prev[uid]
      ? { ...prev, [uid]: { ...prev[uid], blacklisted: true, blacklistReason: reason } }
      : prev
    );
  };

  const handleSubmitterDeleted = (uid) => {
    setSubmitters(prev => {
      if (!prev[uid]) return prev;
      const next = { ...prev };
      delete next[uid];
      return next;
    });
  };

  const filtered = tickets.filter(t => {
    const matchSearch = t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchType   = filterType === "all"   || t.type   === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const statusCounts = tickets.reduce((a, t) => { a[t.status || "open"] = (a[t.status || "open"] || 0) + 1; return a; }, {});
  const typeCounts   = tickets.reduce((a, t) => { a[t.type   || "other"]= (a[t.type   || "other"] || 0) + 1; return a; }, {});

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-t-4 border-indigo-500">

      {selected && (
        <ThreadModal
          ticket={selected}
          submitter={submitters[selected.userId]}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          adminUser={currentUser}
          onSubmitterBlacklisted={handleSubmitterBlacklisted}
          onSubmitterDeleted={handleSubmitterDeleted}
        />
      )}

      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customer Service</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {tickets.length} total · {statusCounts.open || 0} open · {statusCounts.in_progress || 0} in progress
          </p>
        </div>
        <div className="relative">
          <input type="text" placeholder="Search subject or message…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-indigo-400 w-64" />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <FilterPill label="All Statuses" count={tickets.length} active={filterStatus === "all"} onClick={() => setFilterStatus("all")} color="bg-gray-800 text-white" inactiveColor="bg-gray-100 text-gray-600" />
        {STATUSES.map(s => <FilterPill key={s.key} label={s.label} count={statusCounts[s.key] || 0} active={filterStatus === s.key} onClick={() => setFilterStatus(s.key)} color={s.color} inactiveColor="bg-gray-100 text-gray-600" />)}
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterPill label="All Types" count={tickets.length} active={filterType === "all"} onClick={() => setFilterType("all")} color="bg-indigo-500 text-white" inactiveColor="bg-gray-100 text-gray-600" />
        {QUERY_TYPES.map(t => <FilterPill key={t.key} label={t.label} count={typeCounts[t.key] || 0} active={filterType === t.key} onClick={() => setFilterType(t.key)} color={t.color} inactiveColor="bg-gray-100 text-gray-600" />)}
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-400 animate-pulse">Loading tickets…</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Subject</th>
                  <th className="p-4 font-semibold">From</th>
                  <th className="p-4 font-semibold">Last Update</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Images</th>
                  <th className="p-4 font-semibold text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => {
                  const tM = typeMeta(t.type);
                  const sM = statusMeta(t.status);
                  const sub = submitters[t.userId];
                  return (
                    <tr key={t.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${t.status === "open" ? "font-medium" : ""}`}>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${tM.color}`}>
                          {tM.icon}{tM.label}
                        </span>
                      </td>
                      <td className="p-4 text-gray-800 max-w-[180px] truncate">{t.subject || "No subject"}</td>
                      <td className="p-4 text-gray-600">{sub?.username || sub?.email || t.userId?.slice(0, 8) + "…"}</td>
                      <td className="p-4 text-gray-500 whitespace-nowrap">{fmtDate(t.updatedAt || t.createdAt)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${sM.color}`}>
                          {sM.icon}{sM.label}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">
                        {t.hasImages && <ImageIcon size={15} className="text-indigo-400" />}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setSelected(t)} className="text-gray-400 hover:text-indigo-500 transition-colors" title="Open thread">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan="7" className="p-10 text-center text-gray-400">No tickets match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
            <span>{filtered.length === 0 ? "0" : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                .map((p, idx) => p === "..." ? <span key={`e-${idx}`} className="px-2 py-1 text-gray-400">…</span> :
                  <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 rounded-full transition-all ${currentPage === p ? "bg-indigo-500 text-white font-bold" : "bg-gray-100 hover:bg-gray-200"}`}>{p}</button>
                )}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerService;
