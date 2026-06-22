import React, { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, X, Trash2, ShieldCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { db } from '../Config/firebaseConfig';
import {
  collection, getDocs, doc, deleteDoc,
  setDoc, query, where
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// ── Helpers ───────────────────────────────────────────────────────

/** Generates a readable 8-char OTP code e.g. "A3F-92KX" */
const generateOTP = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 3) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const GENDERS = ['Male', 'Female', 'Prefer not to say'];

// Single source of truth for assignable back-office roles. Both the
// create-officer dropdown AND the query that lists existing officers
// below read from this same array, so adding a role here updates both
// places instead of risking them silently drifting apart.
const OFFICER_ROLES = [
  { value: 'registration_officer', label: 'Registration Officer' },
  { value: 'customer_care',        label: 'Customer Care' },
  { value: 'auditor',              label: 'Auditor' },

//  { value: 'admin',                label: 'Admin' },
//  { value: 'manager',              label: 'Manager' },
];

const roleLabel = (value) => OFFICER_ROLES.find((r) => r.value === value)?.label || value || 'N/A';

// ── Create Officer Modal ──────────────────────────────────────────
const CreateOfficerModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    nrcNumber: '',
    zieaNumber: '',
    role: '',
    gender: GENDERS[0],
  });
  const [otp, setOtp] = useState(generateOTP());
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(true);

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const copyOtp = () => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    const { name, email, phoneNumber, nrcNumber, role } = form;
    if (!name || !email || !phoneNumber || !nrcNumber || !role) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      /**
       * We call a Firebase Cloud Function `createBackOfficer` that:
       *  1. Creates a Firebase Auth user with a temp password = the OTP
       *  2. Writes the Firestore doc under /users/{uid}
       *
       * See the companion Cloud Function code below this component.
       *
       * Why a Cloud Function?  Creating Auth users server-side keeps
       * your admin SDK credentials off the client and lets you set a
       * custom password (the OTP) at creation time.
       */
      const functions = getFunctions();
      const createOfficer = httpsCallable(functions, 'createBackOfficer');

      const result = await createOfficer({
        name,
        email,
        phoneNumber,
        nrcNumber,
        role,
        gender: form.gender,
        otp,          // Cloud Function sets this as the initial password
      });

      onCreated(result.data.officer); // { id, name, email, … }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create officer. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border-t-4 border-purple-500">

        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck size={20} className="text-purple-500" />
            New Back Officer
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* OTP Banner */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wide">
              Generated One-Time Password
            </p>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-2xl font-bold tracking-widest text-purple-800 flex-1 ${!showOtp ? 'blur-sm select-none' : ''}`}>
                {otp}
              </span>
              <button onClick={() => setShowOtp((v) => !v)} className="text-purple-400 hover:text-purple-600">
                {showOtp ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button onClick={() => setOtp(generateOTP())} title="Regenerate" className="text-purple-400 hover:text-purple-600">
                <RefreshCw size={18} />
              </button>
              <button onClick={copyOtp} className="text-purple-400 hover:text-purple-600">
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
            <p className="text-xs text-purple-500 mt-2">
              Share this privately with the officer. They will use it as their first-time login password and will be prompted to change it.
            </p>
          </div>

          {/* Form grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input {...field('name')} placeholder="e.g. Mwansa Banda"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input {...field('email')} type="email" placeholder="officer@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
              <input {...field('phoneNumber')} placeholder="09XXXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">NRC Number</label>
              <input {...field('nrcNumber')} placeholder="000000/00/0"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">ZIEA Number</label>
              <input {...field('zieaNumber')} placeholder="e.g. ZIEA/2024/0042"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Officer Role</label>
              <select {...field('role')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm">
                <option value="" disabled>Select a role…</option>
                {OFFICER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
              <select {...field('gender')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm">
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all text-sm">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-all text-sm disabled:opacity-60">
            {loading ? 'Creating…' : 'Create Officer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────
const BackOfficersManager = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchOfficers = async () => {
    try {
      // Matches whatever roles are assignable in the dropdown above.
      // Previously this filtered for the literal string 'officer', which
      // none of these actual role values ever equal — so nothing created
      // through this form would ever have shown up here.
      const roleValues = OFFICER_ROLES.map((r) => r.value);
      const q = query(collection(db, 'users'), where('role', 'in', roleValues));
      const snap = await getDocs(q);
      setOfficers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching officers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOfficers(); }, []);

  const handleDelete = async (officerId) => {
    if (!window.confirm('Remove this back officer? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'users', officerId));
      setOfficers((prev) => prev.filter((o) => o.id !== officerId));
    } catch (err) {
      console.error('Error deleting officer:', err);
    }
  };

  const handleCreated = (newOfficer) => {
    setOfficers((prev) => [newOfficer, ...prev]);
    setShowCreate(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-t-4 border-purple-500">

      {showCreate && (
        <CreateOfficerModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Back Officers</h2>
          <p className="text-sm text-gray-500 mt-0.5">Accounts with restricted access to the Listings QA page</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all text-sm shadow"
        >
          <UserPlus size={16} />
          New Officer
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-gray-400 animate-pulse">Loading officers…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-sm">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">NRC</th>
                <th className="p-4 font-semibold">Mobile</th>
                <th className="p-4 font-semibold">Position</th>
                <th className="p-4 font-semibold">Gender</th>
                <th className="p-4 font-semibold">First Login</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.map((o) => (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm">
                  <td className="p-4 font-medium text-gray-800">{o.name || o.username || 'N/A'}</td>
                  <td className="p-4 text-gray-600">{o.email}</td>
                  <td className="p-4 text-gray-600">{o.nrcNumber || 'N/A'}</td>
                  <td className="p-4 text-gray-600">{o.phoneNumber || 'N/A'}</td>
                  <td className="p-4 text-gray-600">{roleLabel(o.role)}</td>
                  <td className="p-4 text-gray-600">{o.gender || 'N/A'}</td>
                  <td className="p-4">
                    {o.hasLoggedIn ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">
                        Completed
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-600">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove officer"
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {officers.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    No back officers yet. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BackOfficersManager;
