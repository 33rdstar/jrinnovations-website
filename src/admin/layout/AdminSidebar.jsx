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
    { path: 'users',       icon: <Users size={18} />,       label: 'Manage users',    section: 'Management' },
    { path: 'listings',    icon: <Home size={18} />,        label: 'Real estate',     section: null },
    { path: 'marketplace', icon: <ShoppingBag size={18} />, label: 'Marketplace',     section: null },
    { path: 'queries',     icon: <MessageSquare size={18} />, label: 'Customer service', section: 'Support' },
  ];

  return (
    <div className="w-60 h-screen flex flex-col fixed"
      style={{ background: '#0D1B2A', borderRight: '0.5px solid rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <img
          src="/yanga google icon.png"
          alt="Yanga"
          className="w-9 h-9 object-contain flex-shrink-0"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        {/* Fallback if image fails */}
        <div className="w-9 h-9 rounded-lg items-center justify-content-center flex-shrink-0 hidden"
          style={{ background: '#F5A623', display: 'none' }}>
          <span style={{ color: '#0D1B2A', fontWeight: 500, fontSize: 14 }}>Y</span>
        </div>
        <div className="flex flex-col">
          <span style={{ color: '#F5A623', fontSize: 17, fontWeight: 500, letterSpacing: 0.3 }}>Yanga</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>Admin Portal</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
        {navItems.map((item, idx) => (
          <React.Fragment key={item.path}>
            {item.section && (
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.9px',
                textTransform: 'uppercase', padding: '10px 12px 4px', margin: 0 }}>
                {item.section}
              </p>
            )}
            <NavLink
              to={`/portal-mgmt-xyz99/${item.path}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm"
              style={({ isActive }) => ({
                background: isActive ? 'rgba(245,166,35,0.15)' : 'transparent',
                color: isActive ? '#F5A623' : 'rgba(255,255,255,0.5)',
                borderLeft: isActive ? '3px solid #F5A623' : '3px solid transparent',
                paddingLeft: '9px',
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          </React.Fragment>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm transition-all duration-200"
          style={{ color: 'rgba(255,100,100,0.65)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.1)'; e.currentTarget.style.color = '#ff6b6b'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,100,100,0.65)'; }}
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;