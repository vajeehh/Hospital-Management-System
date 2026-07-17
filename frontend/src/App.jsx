import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import ContactUs from './pages/ContactUs';
import { Bell, Clock } from 'lucide-react';

function App() {
  const [view, setView] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [role, setRole] = useState('patient'); // Default role: 'patient' (can switch to 'admin')

  // Notification center state
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingList, setPendingList] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  const fetchPendingAppointments = async () => {
    try {
      const res = await fetch('/api/appointments/?status=Scheduled');
      if (res.ok) {
        const data = await res.json();
        setPendingList(data);
        setPendingCount(data.length);
      }
    } catch (err) {
      console.error('Error fetching pending appointments:', err);
    }
  };

  useEffect(() => {
    fetchPendingAppointments();
    
    // Poll every 6 seconds to capture patient bookings in real-time
    const interval = setInterval(() => {
      fetchPendingAppointments();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Fetch immediately when role changes
  useEffect(() => {
    fetchPendingAppointments();
  }, [role]);

  const clearDetailViews = () => {
    setSelectedPatientId(null);
    setSelectedDoctorId(null);
  };

  const renderActiveView = () => {
    // If a detailed entity profile is requested, override normal views
    if (selectedPatientId !== null) {
      return (
        <Patients 
          selectedPatientId={selectedPatientId} 
          setSelectedPatientId={setSelectedPatientId} 
          setView={setView} 
          setSelectedDoctorId={setSelectedDoctorId} 
          role={role}
        />
      );
    }

    if (selectedDoctorId !== null) {
      return (
        <Doctors 
          selectedDoctorId={selectedDoctorId} 
          setSelectedDoctorId={setSelectedDoctorId} 
          setView={setView} 
          setSelectedPatientId={setSelectedPatientId} 
          role={role}
        />
      );
    }

    switch (view) {
      case 'dashboard':
        return (
          <Dashboard 
            setView={setView} 
            setSelectedPatientId={setSelectedPatientId} 
            setSelectedDoctorId={setSelectedDoctorId} 
            role={role}
          />
        );
      case 'patients':
        return (
          <Patients 
            selectedPatientId={null} 
            setSelectedPatientId={setSelectedPatientId} 
            setView={setView} 
            setSelectedDoctorId={setSelectedDoctorId} 
            role={role}
          />
        );
      case 'doctors':
        return (
          <Doctors 
            selectedDoctorId={null} 
            setSelectedDoctorId={setSelectedDoctorId} 
            setView={setView} 
            setSelectedPatientId={setSelectedPatientId} 
            role={role}
          />
        );
      case 'appointments':
        return (
          <Appointments 
            setView={setView} 
            setSelectedPatientId={setSelectedPatientId} 
            setSelectedDoctorId={setSelectedDoctorId} 
            role={role}
          />
        );
      case 'contact':
        return (
          <ContactUs />
        );
      default:
        return (
          <Dashboard 
            setView={setView} 
            setSelectedPatientId={setSelectedPatientId} 
            setSelectedDoctorId={setSelectedDoctorId} 
            role={role}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        clearDetailViews={clearDetailViews} 
        role={role}
        setRole={setRole}
      />
      <main className="main-content">
        {/* Top Header Bar for Notifications */}
        <div className="top-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto', fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: role === 'admin' ? 'var(--color-warning)' : 'var(--color-primary)', display: 'inline-block' }}></span>
            <span>Active Session: <strong>{role === 'admin' ? 'Administrator' : 'Patient Portal'}</strong></span>
          </div>

          {role === 'admin' && (
            <div className="notification-container">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="notification-bell-btn"
                title="Notifications Center"
              >
                <Bell size={20} />
                {pendingCount > 0 && (
                  <span className="notification-badge">{pendingCount}</span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>Pending Approvals</h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold', backgroundColor: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                      {pendingCount} new
                    </span>
                  </div>
                  
                  <div className="notification-list">
                    {pendingList.length === 0 ? (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        All caught up! No pending bookings.
                      </div>
                    ) : (
                      pendingList.map(appt => (
                        <div 
                          key={appt.id} 
                          className="notification-item"
                          onClick={() => {
                            setView('appointments');
                            clearDetailViews();
                            setShowNotificationDropdown(false);
                          }}
                        >
                          <div className="notification-item-title">New Consultation Request</div>
                          <div className="notification-item-desc">
                            Patient <strong>{appt.patient_name}</strong> booked Dr. {appt.doctor_name} for {appt.reason}.
                          </div>
                          <div className="notification-item-time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} /> {appt.appointment_date} @ {appt.appointment_time}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
