import React, { useState } from 'react';
import { Users, ShieldCheck } from 'lucide-react';
import UsersManager from './UsersManager'; // your existing UsersManager logic, renamed
import BackOfficersManager from './BackOfficeManager';

const TABS = [
  { key: 'customers', label: 'All Users', icon: <Users size={16} /> },
  { key: 'officers',  label: 'Back Officers', icon: <ShieldCheck size={16} /> },
];

const UserManagerComponent = () => {
  const [activeTab, setActiveTab] = useState('customers');

  return (
    <div className="space-y-6">

      {/* Tab bar */}
      <div className="flex gap-2 bg-white rounded-2xl shadow-sm p-2 border border-gray-100 w-fit">
        {TABS.map((tab) => (
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

      {/* Tab content */}
      {activeTab === 'customers' && <UsersManager />}
      {activeTab === 'officers'  && <BackOfficersManager />}

    </div>
  );
};

export default UserManagerComponent;
