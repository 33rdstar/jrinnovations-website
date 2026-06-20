import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Home, ShoppingBag, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminSidebar = () => {
const { logout } = useAuth();
const navigate = useNavigate();


const handleLogout = async () => {
  try {
    await logout();
    navigate('/portal-mgmt-xyz99/login');
  } catch (error) {
    console.error("Failed to log out", error);
  }
};


const navItems = [
  { path: 'users', icon: <Users size={20} />, label: 'Manage Users', available: true },
  { path: 'listings', icon: <Home size={20} />, label: 'Real Estate', available: true },
  { path: 'marketplace', icon: <ShoppingBag size={20} />, label: 'Marketplace', available: true },
  { path: 'audits', icon: <wallet size={20} />, label: 'Audits', available: true },
  { path: 'queries', icon: <MessageSquare size={20} />, label: 'Customer Service', available: true },
];
  



  return (
    <div className="w-64 bg-white shadow-xl h-screen flex flex-col fixed">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          JR Admin
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
		{navItems.map((item) => (
		  item.available ? (
			<NavLink
			  key={item.path}
			  to={`/portal-mgmt-xyz99/${item.path}`}
			  className={({ isActive }) =>
				`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
				  isActive
				    ? 'bg-purple-50 text-purple-600 font-bold border-l-4 border-purple-600'
				    : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
				}`
			  }
			>
			  {item.icon}
			  {item.label}
			</NavLink>
		  ) : (
			<div
			  key={item.path}
			  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-gray-300 cursor-not-allowed"
			>
			  <div className="flex items-center gap-3">
				{item.icon}
				{item.label}
			  </div>
			  <span className="text-xs font-semibold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
				Soon
			  </span>
			</div>
		  )
		))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 w-full rounded-xl transition-all duration-300"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
