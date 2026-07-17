import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  CalendarDays, 
  Clock, 
  User, 
  UserRound, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Check, 
  CalendarIcon,
  HelpCircle,
  FileSpreadsheet,
  Printer
} from 'lucide-react';

export default function Appointments({ setView, setSelectedPatientId, setSelectedDoctorId, role }) {
  const [appointments, setAppointments] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields
  const [formPatientId, setFormPatientId] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formReason, setFormReason] = useState('');

  // Form Fields for new manual patient creation
  const [bookingNewPatient, setBookingNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('Male');
  const [newPatientDob, setNewPatientDob] = useState('');

  const fetchAppointments = async (status = '') => {
    try {
      setLoading(true);
      const url = status ? `/api/appointments/?status=${status}` : '/api/appointments/';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load appointments roster.');
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormDropdowns = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        fetch('/api/patients/'),
        fetch('/api/doctors/')
      ]);
      
      if (patRes.ok && docRes.ok) {
        const patients = await patRes.json();
        const doctors = await docRes.json();
        
        setPatientsList(patients);
        setDoctorsList(doctors);
        
        if (patients.length > 0) setFormPatientId(patients[0].id);
        if (doctors.length > 0) setFormDoctorId(doctors[0].id);
      }
    } catch (err) {
      console.error('Error fetching dropdown choices: ', err);
    }
  };

  useEffect(() => {
    fetchAppointments(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    fetchFormDropdowns();
  }, []);

  const handleOpenBookModal = () => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormDate(tomorrow.toISOString().split('T')[0]);
    setFormTime('10:00');
    setFormReason('');
    
    // Reset new patient fields
    setBookingNewPatient(false);
    setNewPatientName('');
    setNewPatientPhone('');
    setNewPatientGender('Male');
    setNewPatientDob('');
    
    if (patientsList.length > 0 && !formPatientId) setFormPatientId(patientsList[0].id);
    if (doctorsList.length > 0 && !formDoctorId) setFormDoctorId(doctorsList[0].id);
    
    setIsBookModalOpen(true);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update appointment status.');
      
      // Update local state directly to keep it highly responsive
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!bookingNewPatient && !formPatientId) {
      alert('Please select a patient.');
      return;
    }
    if (!formDoctorId) {
      alert('Please select a practitioner.');
      return;
    }
    setSubmitting(true);

    try {
      let activePatientId = formPatientId;

      if (bookingNewPatient) {
        // Register the new patient first
        const patientPayload = {
          name: newPatientName,
          phone: newPatientPhone,
          gender: newPatientGender,
          date_of_birth: newPatientDob,
          email: '',
          blood_group: '',
          address: ''
        };

        const patientRes = await fetch('/api/patients/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientPayload)
        });

        if (!patientRes.ok) {
          const patientErr = await patientRes.json();
          throw new Error(patientErr.error || 'Failed to register the new patient.');
        }

        const newPatientData = await patientRes.json();
        activePatientId = newPatientData.id;
        
        // Refresh local dropdown options so they sync
        fetchFormDropdowns();
      }

      const payload = {
        patient_id: parseInt(activePatientId),
        doctor_id: parseInt(formDoctorId),
        appointment_date: formDate,
        appointment_time: formTime,
        reason: formReason,
        status: 'Scheduled'
      };

      const res = await fetch('/api/appointments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to book consultation.');
      }

      setIsBookModalOpen(false);
      fetchAppointments(statusFilter);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintSlip = (appt) => {
    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) {
      alert('Please allow popups to print the appointment slip.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Appointment Slip - ${appt.patient_name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            
            body { 
              font-family: 'Plus Jakarta Sans', sans-serif; 
              padding: 40px; 
              color: #1e293b; 
              background-color: #f8fafc;
              margin: 0;
            }
            .slip-card { 
              border: 1px solid #e2e8f0; 
              padding: 40px; 
              border-radius: 16px; 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff;
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02);
            }
            .brand-header { 
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              border-bottom: 2px dashed #e2e8f0; 
              padding-bottom: 24px; 
              margin-bottom: 28px; 
              text-align: center;
            }
            .hospital-logo {
              color: #10b981;
              font-size: 28px;
            }
            .hospital-name { 
              font-family: 'Outfit', sans-serif;
              font-size: 24px; 
              font-weight: 700; 
              color: #0f172a; 
              margin: 0;
            }
            .slip-subtitle { 
              font-size: 13px; 
              color: #64748b; 
              text-transform: uppercase;
              letter-spacing: 0.05em;
              font-weight: 600;
              margin-top: 4px;
            }
            .section { 
              margin-bottom: 24px; 
            }
            .section-title { 
              font-family: 'Outfit', sans-serif;
              font-size: 14px; 
              text-transform: uppercase; 
              color: #64748b; 
              font-weight: 700; 
              margin-bottom: 12px; 
              border-bottom: 1px solid #f1f5f9; 
              padding-bottom: 6px; 
              letter-spacing: 0.02em;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px 24px;
            }
            .field { 
              display: flex; 
              flex-direction: column;
              gap: 4px;
            }
            .label { 
              font-size: 11px;
              text-transform: uppercase;
              color: #94a3b8; 
              font-weight: 600;
              letter-spacing: 0.02em;
            }
            .value { 
              font-size: 14px;
              font-weight: 600;
              color: #334155; 
            }
            .status-badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 700;
              text-align: center;
              width: fit-content;
            }
            .status-Scheduled { background-color: #fef3c7; color: #d97706; }
            .status-Confirmed { background-color: #d1fae5; color: #059669; }
            .status-Completed { background-color: #dbeafe; color: #2563eb; }
            .status-Cancelled { background-color: #fee2e2; color: #dc2626; }
            
            .reason-box {
              background-color: #f8fafc;
              border-left: 3px solid #10b981;
              padding: 12px 16px;
              border-radius: 0 8px 8px 0;
              font-size: 13.5px;
              line-height: 1.5;
              color: #475569;
            }
            .barcode-placeholder {
              margin: 32px 0 16px 0;
              text-align: center;
              border-top: 1px solid #f1f5f9;
              padding-top: 24px;
            }
            .barcode-line {
              display: inline-block;
              height: 40px;
              background-color: #0f172a;
              margin: 0 1px;
            }
            .slip-footer { 
              text-align: center; 
              margin-top: 28px; 
              font-size: 11px; 
              color: #94a3b8; 
              line-height: 1.6;
            }
            .action-btn-container {
              display: flex;
              justify-content: center;
              margin-top: 30px;
            }
            .print-btn { 
              font-family: 'Plus Jakarta Sans', sans-serif;
              padding: 12px 28px; 
              background-color: #10b981; 
              color: white; 
              border: none; 
              border-radius: 8px; 
              font-weight: 700; 
              font-size: 14px;
              cursor: pointer; 
              box-shadow: 0 4px 6px -1px rgba(16,185,129,0.2);
              transition: all 0.2s;
            }
            .print-btn:hover {
              background-color: #059669;
              transform: translateY(-1px);
            }
            @media print {
              body { background-color: #ffffff; padding: 0; }
              .slip-card { border: none; box-shadow: none; padding: 20px; }
              .print-btn, .action-btn-container { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="slip-card">
            <div class="brand-header">
              <div class="hospital-logo">💚</div>
              <div>
                <h1 class="hospital-name">Lifeline HMS</h1>
                <div class="slip-subtitle">Official Appointment Confirmation</div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Patient Profile</div>
              <div class="grid">
                <div class="field">
                  <span class="label">Patient Name</span>
                  <span class="value">${appt.patient_name}</span>
                </div>
                <div class="field">
                  <span class="label">Patient Reference</span>
                  <span class="value">#PT-${appt.patient_id}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Clinical Appointment</div>
              <div class="grid">
                <div class="field">
                  <span class="label">Consulting Practitioner</span>
                  <span class="value">Dr. ${appt.doctor_name}</span>
                </div>
                <div class="field">
                  <span class="label">Specialization / Dept</span>
                  <span class="value">Consultant Specialist</span>
                </div>
                <div class="field">
                  <span class="label">Appointment Date</span>
                  <span class="value">${appt.appointment_date}</span>
                </div>
                <div class="field">
                  <span class="label">Scheduled Time</span>
                  <span class="value">${appt.appointment_time}</span>
                </div>
                <div class="field" style="grid-column: span 2;">
                  <span class="label">Booking Status</span>
                  <span class="status-badge status-${appt.status}">${appt.status}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Reason for Visit</div>
              <div class="reason-box">
                ${appt.reason || 'Routine general checkup and physical consultation.'}
              </div>
            </div>
            
            <div class="barcode-placeholder">
              <div class="barcode-line" style="width:2px"></div>
              <div class="barcode-line" style="width:4px"></div>
              <div class="barcode-line" style="width:1px"></div>
              <div class="barcode-line" style="width:3px"></div>
              <div class="barcode-line" style="width:2px"></div>
              <div class="barcode-line" style="width:1px"></div>
              <div class="barcode-line" style="width:4px"></div>
              <div class="barcode-line" style="width:2px"></div>
              <div class="barcode-line" style="width:1px"></div>
              <div class="barcode-line" style="width:3px"></div>
              <div class="barcode-line" style="width:2px"></div>
              <div class="barcode-line" style="width:1px"></div>
              <div class="barcode-line" style="width:4px"></div>
              <div style="font-size:10px; color:#94a3b8; font-family:monospace; margin-top:6px; letter-spacing: 0.2em;">APP-SLIP-${appt.id}-${appt.patient_id}</div>
            </div>
            
            <div class="slip-footer">
              <p>Please present a printed or digital copy of this slip at the reception desk 15 minutes before your scheduled appointment time.</p>
              <p>For cancellations or rescheduling, please contact us at least 24 hours in advance.</p>
              <p><strong>Lifeline Hospital Management System</strong></p>
            </div>
            
            <div class="action-btn-container">
              <button class="print-btn" onclick="window.print()">Print Appointment Slip</button>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statusTabs = [
    { label: 'All Bookings', value: '' },
    { label: 'Scheduled', value: 'Scheduled' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="header-container">
        <div>
          <h1 className="header-title">Appointment Bookings</h1>
          <p className="header-subtitle">Schedule outpatient consultations, check availabilities, and update progress</p>
        </div>
        <button onClick={handleOpenBookModal} className="btn btn-primary">
          <Plus size={16} /> Book Consultation
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-bar">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`filter-btn ${statusFilter === tab.value ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading appointments roster...</div>
      ) : appointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No appointments recorded in this category.
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient Detail</th>
                  <th>Assigned Practitioner</th>
                  <th>Date & Time</th>
                  <th>Purpose / Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>{role === 'admin' ? 'Admin Actions' : 'Approval Status'}</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>
                      <button
                        onClick={() => { setSelectedPatientId(appt.patient_id); setView('patients'); }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '700', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                      >
                        {appt.patient_name}
                      </button>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: #{appt.patient_id}</div>
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelectedDoctorId(appt.doctor_id); setView('doctors'); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                      >
                        Dr. {appt.doctor_name}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{appt.appointment_date}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {appt.appointment_time}
                      </div>
                    </td>
                    <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={appt.reason}>
                      {appt.reason}
                    </td>
                    <td>
                      <span className={`badge ${
                        appt.status === 'Scheduled' ? 'badge-scheduled' :
                        appt.status === 'Confirmed' ? 'badge-confirmed' :
                        appt.status === 'Completed' ? 'badge-completed' : 'badge-cancelled'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        {role === 'admin' ? (
                          <>
                            {appt.status === 'Scheduled' && (
                              <>
                                <button 
                                  onClick={() => handleUpdateStatus(appt.id, 'Confirmed')} 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                                >
                                  Accept
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(appt.id, 'Cancelled')} 
                                  className="btn btn-danger" 
                                  style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {appt.status === 'Confirmed' && (
                              <>
                                <button 
                                  onClick={() => handleUpdateStatus(appt.id, 'Completed')} 
                                  className="btn" 
                                  style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', color: 'var(--color-success)' }}
                                >
                                  Complete
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(appt.id, 'Cancelled')} 
                                  className="btn btn-danger" 
                                  style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {appt.status === 'Completed' && (
                              <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={14} /> Completed
                              </span>
                            )}
                            {appt.status === 'Cancelled' && (
                              <span style={{ fontSize: '12px', color: 'var(--color-danger)', fontWeight: '600' }}>
                                Declined
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {appt.status === 'Scheduled' && (
                              <span style={{ fontSize: '12px', color: 'var(--color-warning)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={14} /> Awaiting Approval
                              </span>
                            )}
                            {appt.status === 'Confirmed' && (
                              <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={14} style={{ color: 'var(--color-success)' }} /> Approved
                              </span>
                            )}
                            {appt.status === 'Completed' && (
                              <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={14} /> Visited
                              </span>
                            )}
                            {appt.status === 'Cancelled' && (
                              <span style={{ fontSize: '12px', color: 'var(--color-danger)', fontWeight: '600' }}>
                                Declined
                              </span>
                            )}
                          </>
                        )}
                        <button 
                          onClick={() => handlePrintSlip(appt)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Print Booking Slip"
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Consultation Modal */}
      {isBookModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Schedule Consultation</h2>
              <button onClick={() => setIsBookModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmitBooking}>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0' }}>
                <input 
                  type="checkbox" 
                  id="toggleNewPatient" 
                  checked={bookingNewPatient}
                  onChange={(e) => setBookingNewPatient(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="toggleNewPatient" style={{ fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  New Patient? (Enter Details Manually)
                </label>
              </div>

              {!bookingNewPatient ? (
                <div className="form-group">
                  <label className="form-label">Select Patient</label>
                  <select 
                    className="form-select" 
                    value={formPatientId} 
                    onChange={(e) => setFormPatientId(e.target.value)}
                    required={!bookingNewPatient}
                  >
                    {patientsList.length === 0 ? (
                      <option value="">No patients registered</option>
                    ) : (
                      patientsList.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Contact: {p.phone})</option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-light)', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-secondary)', marginBottom: '12px' }}>
                    New Patient Registration
                  </h4>
                  
                  <div className="form-group">
                    <label className="form-label">Patient Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      placeholder="e.g. Sarah Connor"
                      required={bookingNewPatient}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      value={newPatientPhone}
                      onChange={(e) => setNewPatientPhone(e.target.value)}
                      placeholder="e.g. +1 555-0155"
                      required={bookingNewPatient}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select 
                        className="form-select" 
                        value={newPatientGender} 
                        onChange={(e) => setNewPatientGender(e.target.value)}
                        required={bookingNewPatient}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={newPatientDob} 
                        onChange={(e) => setNewPatientDob(e.target.value)} 
                        required={bookingNewPatient}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Select Practitioner</label>
                <select 
                  className="form-select" 
                  value={formDoctorId} 
                  onChange={(e) => setFormDoctorId(e.target.value)}
                  required
                >
                  {doctorsList.length === 0 ? (
                    <option value="">No practitioners registered</option>
                  ) : (
                    doctorsList.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization})</option>
                    ))
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Appointment Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formDate} 
                    onChange={(e) => setFormDate(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Appointment Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={formTime} 
                    onChange={(e) => setFormTime(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Visit / Symptoms</label>
                <textarea 
                  className="form-textarea" 
                  value={formReason} 
                  onChange={(e) => setFormReason(e.target.value)} 
                  placeholder="Describe reason for scheduling consultation..."
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsBookModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Booking...' : 'Book Consultation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
