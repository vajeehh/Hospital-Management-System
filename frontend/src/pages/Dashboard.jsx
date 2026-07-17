import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserRound, 
  CalendarDays, 
  Activity,
  ArrowRight,
  RefreshCw,
  CalendarDays as CalendarIcon,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

export default function Dashboard({ setView, setSelectedPatientId, setSelectedDoctorId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1.5s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard metrics...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--color-danger)', textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--color-danger)', fontSize: '18px', fontWeight: 'bold' }}>Error Loading Dashboard</p>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary" style={{ marginTop: '16px' }}>Retry</button>
      </div>
    );
  }

  const { stats, recent_appointments, upcoming_appointments, charts } = data;

  // SVG Line Chart calculation helpers
  const svgWidth = 500;
  const svgHeight = 150;
  const maxVal = Math.max(...charts.daily_counts, 5); // ensure division is safe
  const padding = 20;
  
  // Calculate points
  const points = charts.daily_counts.map((val, idx) => {
    const x = padding + (idx * (svgWidth - padding * 2)) / (charts.daily_counts.length - 1);
    const y = svgHeight - padding - (val / maxVal) * (svgHeight - padding * 2);
    return { x, y, val, label: charts.days_labels[idx] };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Fill path for background gradient
  const fillD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z` 
    : '';

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Scheduled': return <Clock size={16} style={{ color: 'var(--color-info)' }} />;
      case 'Confirmed': return <Activity size={16} style={{ color: 'var(--color-warning)' }} />;
      case 'Completed': return <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />;
      case 'Cancelled': return <XCircle size={16} style={{ color: 'var(--color-danger)' }} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Scheduled': return 'badge-scheduled';
      case 'Confirmed': return 'badge-confirmed';
      case 'Completed': return 'badge-completed';
      case 'Cancelled': return 'badge-cancelled';
      default: return '';
    }
  };

  // Find max appointment count for department workload progress bar
  const maxDeptCount = Math.max(...charts.dept_values, 1);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="header-container">
        <div>
          <h1 className="header-title">Welcome to Lifeline HMS</h1>
          <p className="header-subtitle">Real-time clinical insights & hospital command center</p>
        </div>
        <button onClick={fetchDashboardData} className="btn btn-secondary">
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Stats Counter Row */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-info">
            <h3>Total Patients</h3>
            <div className="stat-value">{stats.total_patients}</div>
          </div>
          <div className="stat-icon green">
            <Users size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Active Doctors</h3>
            <div className="stat-value">{stats.total_doctors}</div>
          </div>
          <div className="stat-icon cyan">
            <UserRound size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Total Booked</h3>
            <div className="stat-value">{stats.total_appointments}</div>
          </div>
          <div className="stat-icon blue">
            <CalendarDays size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Pending Visits</h3>
            <div className="stat-value">{stats.pending_appointments}</div>
          </div>
          <div className="stat-icon orange">
            <Activity size={24} />
          </div>
        </div>
      </div>

      {/* Charts & Analytical Section */}
      <div className="dashboard-grid">
        
        {/* Weekly Activity Line Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px' }}>Weekly Appointment Trend</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} /> Live tracking
            </span>
          </div>
          
          <div className="chart-container">
            {charts.daily_counts.length === 0 || charts.daily_counts.every(c => c === 0) ? (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No appointments registered in the past 7 days.
              </div>
            ) : (
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="svg-chart" style={{ width: '100%', height: 'auto' }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Guide Lines */}
                <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="var(--border-light)" strokeWidth={1} strokeDasharray="4 4" />
                <line x1={padding} y1={svgHeight/2} x2={svgWidth - padding} y2={svgHeight/2} stroke="var(--border-light)" strokeWidth={1} strokeDasharray="4 4" />
                <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="var(--border-light)" strokeWidth={1.5} />
                
                {/* Fill Path */}
                <path d={fillD} fill="url(#chartGradient)" />
                
                {/* Stroke Path */}
                <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Point Circles and Tooltips */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={5} fill="var(--bg-secondary)" stroke="var(--color-primary)" strokeWidth={2.5} />
                    
                    {/* Y Value label on hover (always on here for nice look) */}
                    <text x={p.x} y={p.y - 10} fill="var(--text-main)" fontSize="10px" textAnchor="middle" fontWeight="bold">
                      {p.val}
                    </text>
                    
                    {/* X Axis Labels */}
                    <text x={p.x} y={svgHeight - 4} fill="var(--text-secondary)" fontSize="9px" textAnchor="middle">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>

        {/* Department Workloads */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Department Workload</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
            {charts.dept_labels.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>No department booking data available.</p>
            ) : (
              charts.dept_labels.map((dept, idx) => {
                const count = charts.dept_values[idx];
                const pct = (count / maxDeptCount) * 100;
                return (
                  <div key={dept} className="progress-bar-group">
                    <div className="progress-label">
                      <span>{dept}</span>
                      <span>{count} {count === 1 ? 'visit' : 'visits'}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Grid: Upcoming Appointments & Status Breakdown */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        
        {/* Upcoming Appointments Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px' }}>Upcoming Scheduled Appointments</h2>
            <button onClick={() => setView('appointments')} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
              View All <ArrowRight size={12} />
            </button>
          </div>
          
          <div className="table-container">
            {upcoming_appointments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>No upcoming appointments scheduled.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming_appointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <button 
                          onClick={() => setSelectedPatientId(appt.patient_id)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        >
                          {appt.patient_name}
                        </button>
                      </td>
                      <td>
                        <button 
                          onClick={() => setSelectedDoctorId(appt.doctor_id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        >
                          {appt.doctor_name}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{appt.appointment_date}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{appt.appointment_time}</div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(appt.status)}`}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {getStatusIcon(appt.status)}
                            {appt.status}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Appointment Status Pie Representation (Vanilla Progress Bars) */}
        <div className="card">
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Visits Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            {charts.status_labels.map((status, idx) => {
              const count = charts.status_values[idx];
              const total = stats.total_appointments || 1;
              const pct = Math.round((count / total) * 100);
              
              // Custom colors matching badges
              let barColor = 'var(--color-info)';
              if (status === 'Confirmed') barColor = 'var(--color-warning)';
              if (status === 'Completed') barColor = 'var(--color-success)';
              if (status === 'Cancelled') barColor = 'var(--color-danger)';
              
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                      {getStatusIcon(status)}
                      {status}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{count} ({pct}%)</span>
                  </div>
                  <div className="progress-track" style={{ height: '6px' }}>
                    <div className="progress-bar" style={{ width: `${pct}%`, background: barColor }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
