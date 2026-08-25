import React, { useState, useEffect } from "react";
import {
  Search, X, Eye, Trash2, ChevronLeft, ChevronRight,
  ShieldCheck, Flag, AlertTriangle, Clock,
} from "lucide-react";
import { db } from "../Config/firebaseConfig";
import {
  collection, getDocs, doc, updateDoc, deleteDoc, getDoc,
} from "firebase/firestore";
import { useAuth } from "../Auth/AuthContext";

// ── Constants ─────────────────────────────────────────────────────
const STATUSES = [
  { key: "pending",  label: "Pending Review",      color: "bg-yellow-100 text-yellow-700", icon: <Clock size={13} /> },
  { key: "verified", label: "Verified",             color: "bg-green-100 text-green-700",  icon: <ShieldCheck size={13} /> },
  { key: "flagged",  label: "Flagged",              color: "bg-orange-100 text-orange-700",icon: <Flag size={13} /> },
  { key: "rejected", label: "Rejected / Fraudulent",color: "bg-red-100 text-red-700",     icon: <AlertTriangle size={13} /> },
];

const statusMeta = (key) => STATUSES.find((s) => s.key === key) || STATUSES[0];
const formatPrice = (p) => p != null ? `K${Number(p).toLocaleString()}` : "N/A";
const formatDate = (ts) => {
  if (!ts) return "N/A";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// ── Lightbox ──────────────────────────────────────────────────────
const Lightbox = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <img src={images[idx]} alt="" className="w-full max-h-[80vh] object-contain rounded-xl" />
        <div className="absolute top-3 right-3 flex gap-2">
          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">{idx + 1} / {images.length}</span>
          <button onClick={onClose} className="bg-black/50 text-white rounded-full p-1 hover:bg-black"><X size={16} /></button>
        </div>
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black"><ChevronLeft size={20} /></button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black"><ChevronRight size={20} /></button>
          </>
        )}
      </div>
    </div>
  );
};

// ── Detail Modal ──────────────────────────────────────────────────
const ProductDetailModal = ({ product, seller, onClose, onStatusChange, onDelete, isOfficer }) => {
  const [lightbox, setLightbox] = useState(null);
  const [saving, setSaving] = useState(false);
  const meta = statusMeta(product.status);
  const images = product.images || [];

  const changeStatus = async (newStatus) => {
    setSaving(true);
    await onStatusChange(product.id, newStatus);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      {lightbox !== null && <Lightbox images={images} startIndex={lightbox} onClose={() => setLightbox(null)} />}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-t-4 border-green-500">
        <div className="flex justify-between items-start px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{product.name || "Untitled Product"}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{product.category} · {product.location}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Images */}
          {images.length > 0 && (
            <div>
              <img
                src={images[0]} alt="main"
                onClick={() => setLightbox(0)}
                className="w-full h-52 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
              />
              {images.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {images.slice(1).map((img, i) => (
                    <img key={i} src={img} alt="" onClick={() => setLightbox(i + 1)}
                      className="w-16 h-16 object-cover rounded-lg cursor-pointer flex-shrink-0 hover:opacity-80 transition border-2 border-transparent hover:border-green-400" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Price" value={formatPrice(product.price)} />
            <Detail label="Category" value={product.category} />
            <Detail label="Available" value={product.isAvailable ? "Yes" : "No"} />
            <Detail label="Listed On" value={formatDate(product.createdAt)} />
            <Detail label="Status" value={
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${meta.color}`}>
                {meta.icon}{meta.label}
              </span>
            } />
          </div>

          {/* Description / Details */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-700">{product.description || "N/A"}</p>
          </div>
          {product.details && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Additional Details</p>
              <p className="text-sm text-gray-700">{product.details}</p>
            </div>
          )}

          {/* Seller info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sold By</p>
            {seller ? (
              <div className="text-sm text-gray-700 space-y-0.5">
                <p><span className="font-semibold">Name:</span> {seller.username || "N/A"}</p>
                <p><span className="font-semibold">Email:</span> {seller.email}</p>
                <p><span className="font-semibold">Phone:</span> {seller.phoneNumber || "N/A"}</p>
                <p><span className="font-semibold">NRC:</span> {seller.nrcNumber || "N/A"}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Could not load seller details.</p>
            )}
          </div>

          {/* Status actions */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  disabled={product.status === s.key || saving}
                  onClick={() => changeStatus(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                    ${product.status === s.key ? `${s.color} border-transparent cursor-default opacity-80` : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"}
                    disabled:opacity-50`}
                >
                  {s.icon}{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delete — admin only */}
          {!isOfficer && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => onDelete(product.id)}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-semibold transition-colors"
              >
                <Trash2 size={15} /> Delete Product
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
    <div className="text-sm text-gray-700 mt-0.5">{value ?? "N/A"}</div>
  </div>
);

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
const MarketplaceManager = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState("manager");
  const perPage = 20;

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, "users", currentUser.uid))
      .then((d) => { if (d.exists()) setUserRole(d.data().role); })
      .catch(console.error);
  }, [currentUser]);

  const isOfficer = userRole === "officer";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const data = snap.docs.map((d) => ({ id: d.id, status: "pending", ...d.data() }));
      setProducts(data);

      const uids = [...new Set(data.map((p) => p.userId).filter(Boolean))];
      const profiles = {};
      await Promise.all(uids.map(async (uid) => {
        try {
          const u = await getDoc(doc(db, "users", uid));
          if (u.exists()) profiles[uid] = u.data();
        } catch (_) {}
      }));
      setSellers(profiles);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "products", id), { status: newStatus });
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p));
      setSelected((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelected(null);
    } catch (err) { console.error(err); }
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const counts = products.reduce((acc, p) => {
    acc[p.status || "pending"] = (acc[p.status || "pending"] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-t-4 border-green-500">
      {selected && (
        <ProductDetailModal
          product={selected}
          seller={sellers[selected.userId]}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          isOfficer={isOfficer}
        />
      )}

      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Marketplace QA</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {products.length} total · {counts.pending || 0} pending review
          </p>
        </div>
        <div className="relative">
          <input
            type="text" placeholder="Search name, category, location…"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-green-400 w-64"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <FilterPill label="All" count={products.length} active={filterStatus === "all"} onClick={() => setFilterStatus("all")} color="bg-gray-800 text-white" inactiveColor="bg-gray-100 text-gray-600" />
        {STATUSES.map((s) => (
          <FilterPill key={s.key} label={s.label} count={counts[s.key] || 0} active={filterStatus === s.key} onClick={() => setFilterStatus(s.key)} color={s.color} inactiveColor="bg-gray-100 text-gray-600" />
        ))}
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-400 animate-pulse">Loading products…</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <th className="p-4 font-semibold">Image</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Location</th>
                  <th className="p-4 font-semibold">Seller</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Review</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((product) => {
                  const meta = statusMeta(product.status);
                  const seller = sellers[product.userId];
                  return (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-14 h-14 object-cover rounded-xl border border-gray-200" onError={(e) => { e.target.style.display = "none"; }} />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">No img</div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-gray-800 max-w-[140px] truncate">{product.name || "Untitled"}</td>
                      <td className="p-4 text-gray-500">{product.category || "N/A"}</td>
                      <td className="p-4 font-semibold text-gray-700">{formatPrice(product.price)}</td>
                      <td className="p-4 text-gray-500 max-w-[140px] truncate">{product.location || "N/A"}</td>
                      <td className="p-4 text-gray-600">{seller?.username || seller?.email || product.userId?.slice(0, 8) + "…"}</td>
                      <td className="p-4 text-gray-500">{formatDate(product.createdAt)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${meta.color}`}>
                          {meta.icon}{meta.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setSelected(product)} className="text-gray-400 hover:text-green-500 transition-colors" title="Review product">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan="9" className="p-10 text-center text-gray-400">No products match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

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
                  <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 rounded-full transition-all ${currentPage === p ? "bg-green-500 text-white font-bold" : "bg-gray-100 hover:bg-gray-200"}`}>{p}</button>
                ))}
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MarketplaceManager;
