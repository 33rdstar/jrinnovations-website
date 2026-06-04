import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Search, X } from 'lucide-react';
import { db } from '../Config/firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// ── Blacklist Modal ───────────────────────────────────────────────
const BLACKLIST_REASONS = ['Suspected Fraud', 'Breaking User Guidelines'];

const BlacklistModal = ({ user, onClose, onConfirm }) => {
  const [reason, setReason] = useState(BLACKLIST_REASONS[0]);
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(user.id, reason, notes);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-t-4 border-red-500">
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Blacklist User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* User summary */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600">
          <p><span className="font-semibold">Username:</span> {user.username || 'N/A'}</p>
          <p><span className="font-semibold">Email:</span> {user.email}</p>
          <p><span className="font-semibold">NRC:</span> {user.nrcNumber || 'N/A'}</p>
        </div>

        {/* Reason dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            {BLACKLIST_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Optional notes */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Multiple fraud reports from different users..."
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 resize-none text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all"
          >
            Confirm Blacklist
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────
const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [blacklistTarget, setBlacklistTarget] = useState(null); // user to blacklist
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleBlacklistConfirm = async (userId, reason, notes) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        blacklisted: true,
        blacklistReason: reason,
        blacklistNotes: notes || '',
        blacklistedAt: new Date().toISOString(),
      });
      // Update local state so UI reflects immediately
      setUsers(users.map(u =>
        u.id === userId ? { ...u, blacklisted: true, blacklistReason: reason } : u
      ));
    } catch (error) {
      console.error("Error blacklisting user:", error);
    } finally {
      setBlacklistTarget(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );


const totalPages = Math.ceil(filteredUsers.length / perPage);
const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);


// Reset to page 1 when search changes
useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-t-4 border-blue-500">

      {/* Blacklist modal */}
      {blacklistTarget && (
        <BlacklistModal
          user={blacklistTarget}
          onClose={() => setBlacklistTarget(null)}
          onConfirm={handleBlacklistConfirm}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading database records...</div>
        ) : (
        <>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Username</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">NRC Number</th>
                <th className="p-4 font-semibold">Mobile Number</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className={`border-b border-gray-100 transition-colors ${user.blacklisted ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'agent'   ? 'bg-blue-100 text-blue-700' :
                                               'bg-green-100 text-green-700'
                    }`}>
                      {user.role || 'customer'}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-800">{user.username || 'N/A'}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4 text-gray-600">{user.nrcNumber || 'N/A'}</td>
                  <td className="p-4 text-gray-600">{user.phoneNumber || 'N/A'}</td>
                  <td className="p-4">
                    {user.blacklisted ? (
                      <span title={user.blacklistReason} className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
                        Blacklisted
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {/* Edit = Blacklist */}
                    <button
                      onClick={() => !user.blacklisted && setBlacklistTarget(user)}
                      title={user.blacklisted ? `Blacklisted: ${user.blacklistReason}` : 'Blacklist user'}
                      className={`mx-2 transition-colors ${
                        user.blacklisted
                          ? 'text-red-300 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-gray-400 hover:text-red-500 mx-2 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* ── Pagination Footer ── */}
     
		<div className="flex items-center justify-between mt-6 text-sm text-gray-600">
		  
		  {/* Per page selector */}
		  <div className="flex items-center gap-2">
			<span>Rows per page:</span>
			{[20, 40, 60].map((n) => (
			  <button
				key={n}
				onClick={() => { setPerPage(n); setCurrentPage(1); }}
				className={`px-3 py-1 rounded-full font-semibold transition-all ${
				  perPage === n
				    ? 'bg-blue-500 text-white'
				    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
				}`}
			  >
				{n}
			  </button>
			))}
		  </div>

		  {/* Page info + controls */}
		  <div className="flex items-center gap-3">
			<span>
			  {filteredUsers.length === 0 ? '0' : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filteredUsers.length)} of {filteredUsers.length}
			</span>
			<div className="flex gap-1">
			  <button
				onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
				disabled={currentPage === 1}
				className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
			  >
				‹
			  </button>
			  {Array.from({ length: totalPages }, (_, i) => i + 1)
				.filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
				.reduce((acc, p, idx, arr) => {
				  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
				  acc.push(p);
				  return acc;
				}, [])
				.map((p, idx) =>
				  p === '...' ? (
				    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400">…</span>
				  ) : (
				    <button
				      key={p}
				      onClick={() => setCurrentPage(p)}
				      className={`px-3 py-1 rounded-full transition-all ${
				        currentPage === p
				          ? 'bg-blue-500 text-white font-bold'
				          : 'bg-gray-100 hover:bg-gray-200'
				      }`}
				    >
				      {p}
				    </button>
				  )
				)}
			  <button
				onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
				disabled={currentPage === totalPages || totalPages === 0}
				className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
			  >
				›
			  </button>
			</div>
		  </div>

		</div>
		</>
        )}
      </div>
    </div>
  );
};

export default UsersManager;
