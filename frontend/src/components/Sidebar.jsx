import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserRound, 
  CalendarCheck2, 
  HeartPulse,
  Crown,
  User,
  X,
  Phone
} from 'lucide-react';

export default function Sidebar({ currentView, setView, clearDetailViews, role, setRole }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'doctors', label: 'Doctors', icon: UserRound },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck2 },
    { id: 'contact', label: 'Contact Us', icon: Phone },
  ];

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const ADMIN_PASSWORD = 'admin123'; // Predefined Admin password

  const handleNavClick = (viewId) => {
    setView(viewId);
    clearDetailViews();
  };

  const handleRoleToggle = () => {
    if (role === 'admin') {
      setRole('patient');
    } else {
      setInputPassword('');
      setPasswordError('');
      setIsPasswordModalOpen(true);
    }
  };

  const handleVerifyPassword = (e) => {
    e.preventDefault();
    if (inputPassword === ADMIN_PASSWORD) {
      setRole('admin');
      setIsPasswordModalOpen(false);
    } else {
      setPasswordError('Incorrect password. Access denied.');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <HeartPulse size={22} strokeWidth={2.5} />
        </div>
        <span className="sidebar-brand-name">Lifeline HMS</span>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}
            >
              <IconComponent size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Role Selection Card */}
      <div style={{ padding: '16px', margin: '0 16px 16px 16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          {role === 'admin' ? (
            <Crown size={14} style={{ color: 'var(--color-warning)' }} />
          ) : (
            <User size={14} style={{ color: 'var(--color-primary)' }} />
          )}
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Active Session
          </span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
          {role === 'admin' ? 'Administrator' : 'Patient / Outpatient'}
        </div>
        <button
          onClick={handleRoleToggle}
          className="btn"
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            padding: '6px 12px', 
            fontSize: '12px',
            background: role === 'admin' ? 'var(--bg-tertiary)' : 'var(--gradient-brand)',
            color: 'var(--text-main)',
            border: role === 'admin' ? '1px solid var(--border-light)' : 'none'
          }}
        >
          Switch to {role === 'admin' ? 'Patient Portal' : 'Admin Mode'}
        </button>
      </div>
      
      {/* Admin Password Prompt Modal */}
      {isPasswordModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', zIndex: '300' }}>
          <div className="modal-content" style={{ maxWidth: '360px', padding: '24px' }}>
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={18} style={{ color: 'var(--color-warning)' }} />
                Admin Authentication
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="modal-close"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleVerifyPassword}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Enter Admin Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="Enter password..."
                  required 
                  autoFocus
                />
                {passwordError && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '6px', fontWeight: '500' }}>
                    {passwordError}
                  </p>
                )}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Verify Password
              </button>
            </form>
          </div>
        </div>
      )}
      
      <div className="sidebar-footer">
        <p>© 2026 Lifeline HMS</p>
        <p style={{ fontSize: '10px', marginTop: '4px' }}>Connected to Django API</p>
      </div>
    </aside>
  );
}
