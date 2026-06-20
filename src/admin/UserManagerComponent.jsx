import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck } from 'lucide-react';
import UsersManager from './UsersManager';
import BackOfficersManager from './BackOfficeManager';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { useAuth } from '../Auth/AuthContext';

const TABS = [
  { key: 'customers', label: 'All Users', icon: <Users size={16} />, access: ['manager','admin', 'registration_officer', 'customer_care'] },
  { key: 'officers',  label: 'Back Officers', icon: <ShieldCheck size={16} />, access: ['manager', 'admin', 'registration_officer'] },
];

// Maps each tab key to the component that renders it. Adding a tab here
// automatically gets the same access checks as every other tab — there's
// no separate per-tab conditional left to remember (and forget) later.
const TAB_CONTENT = {
  customers: UsersManager,
  officers: BackOfficersManager,
};

const UserManagerComponent = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('customers');
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  // A tab is visible if it has no `access` list (public to all roles)
  // or if the current role is explicitly in that list.
  const visibleTabs = TABS.filter(tab => !tab.access || tab.access.includes(userRole));

  // If the user's role changes (or on first load, before role resolves)
  // and they land on a tab they're not allowed to see, snap to the first
  // tab they DO have access to — not a hardcoded 'customers' default,
  // since a given role might not have access to that one either.
  useEffect(() => {
    if (!visibleTabs.some(t => t.key === activeTab)) {
      setActiveTab(visibleTabs[0]?.key ?? null);
    }
  }, [userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // The single source of truth for what gets rendered: a component only
  // ever shows up here if its tab key is BOTH the active tab AND present
  // in visibleTabs. No screen can render for a role it isn't listed under.
  const ActiveComponent = visibleTabs.some(t => t.key === activeTab) ? TAB_CONTENT[activeTab] : null;

  return (
    <div className="space-y-6">
      {/* Tab bar — only renders tabs this role is allowed to see */}
      {visibleTabs.length > 0 && (
        <div className="flex gap-2 bg-white rounded-2xl shadow-sm p-2 border border-gray-100 w-fit">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-purple-500 text-white shadow'
                  : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content — driven entirely by ActiveComponent above */}
      {ActiveComponent ? (
        <ActiveComponent />
      ) : (
        <p className="text-sm text-gray-500">You don't have access to this section.</p>
      )}
    </div>
  );
};

export default UserManagerComponent;
