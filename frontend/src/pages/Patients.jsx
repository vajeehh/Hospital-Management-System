import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Droplet, 
  MapPin, 
  X, 
  Edit2, 
  Trash2,
  FileText,
  Clock,
  UserRound,
  FileHeart,
  Stethoscope,
  Printer
} from 'lucide-react';

export default function Patients({ selectedPatientId, setSelectedPatientId, setView, setSelectedDoctorId, role }) {
  const [patients, setPatients] = useState([]);
  const [patientDetail, setPatientDetail] = useState(null);
  const [doctorsList, setDoctorsList] = useState([]); // for adding medical record
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null); // null = add, Patient object = edit
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Patient Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formGender, setFormGender] = useState('Male');
  const [formDob, setFormDob] = useState('');
  const [formBloodGroup, setFormBloodGroup] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // Medical Record Form Fields
  const [recordDocId, setRecordDocId] = useState('');
  const [recordSymptoms, setRecordSymptoms] = useState('');
  const [recordDiagnosis, setRecordDiagnosis] = useState('');
  const [recordPrescription, setRecordPrescription] = useState('');

  // Details active tab: 'records' or 'appointments'
  const [detailTab, setDetailTab] = useState('records');

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/patients/?q=${encodeURIComponent(query)}` : '/api/patients/';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch patients.');
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetail = async (id) => {
    try {
      const res = await fetch(`/api/patients/${id}/`);
      if (!res.ok) throw new Error('Failed to fetch patient history.');
      const data = await res.json();
      setPatientDetail(data);
    } catch (err) {
      console.error(err);
      alert(err.message);
      setSelectedPatientId(null);
    }
  };

  const fetchDoctorsList = async () => {
    try {
      const res = await fetch('/api/doctors/');
      if (res.ok) {
        const data = await res.json();
        setDoctorsList(data);
        if (data.length > 0) setRecordDocId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching doctors: ', err);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctorsList();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientDetail(selectedPatientId);
    } else {
      setPatientDetail(null);
    }
  }, [selectedPatientId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchPatients('');
  };

  const handleOpenAddModal = () => {
    setEditingPatient(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormGender('Male');
    setFormDob('');
    setFormBloodGroup('');
    setFormAddress('');
    setIsPatientModalOpen(true);
  };

  const handleOpenEditModal = (pat, e) => {
    e.stopPropagation();
    setEditingPatient(pat);
    setFormName(pat.name);
    setFormEmail(pat.email);
    setFormPhone(pat.phone);
    setFormGender(pat.gender);
    setFormDob(pat.date_of_birth);
    setFormBloodGroup(pat.blood_group);
    setFormAddress(pat.address);
    setIsPatientModalOpen(true);
  };

  const handleDeletePatient = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this patient profile? All their medical history and appointments will be permanently removed.')) return;
    
    try {
      const res = await fetch(`/api/patients/${id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete patient.');
      setPatients(patients.filter(p => p.id !== id));
      if (selectedPatientId === id) setSelectedPatientId(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formName,
      email: formEmail,
      phone: formPhone,
      gender: formGender,
      date_of_birth: formDob,
      blood_group: formBloodGroup,
      address: formAddress
    };

    try {
      let res;
      if (editingPatient) {
        res = await fetch(`/api/patients/${editingPatient.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/patients/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save patient profile.');
      }

      setIsPatientModalOpen(false);
      fetchPatients(searchQuery);
      if (selectedPatientId && editingPatient && selectedPatientId === editingPatient.id) {
        fetchPatientDetail(selectedPatientId);
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Add Medical Record Submission
  const handleOpenRecordModal = () => {
    setRecordSymptoms('');
    setRecordDiagnosis('');
    setRecordPrescription('');
    setIsRecordModalOpen(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordDocId) {
      alert('Please register at least one doctor first.');
      return;
    }
    setSubmitting(true);

    const payload = {
      doctor_id: parseInt(recordDocId),
      symptoms: recordSymptoms,
      diagnosis: recordDiagnosis,
      prescription: recordPrescription
    };

    try {
      const res = await fetch(`/api/patients/${selectedPatientId}/records/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create medical record.');
      
      setIsRecordModalOpen(false);
      fetchPatientDetail(selectedPatientId); // reload history
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Age Calculator
  const calculateAge = (dobString) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handlePrintReport = (pat) => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      alert('Please allow popups to print the report.');
      return;
    }
    
    const recordsHtml = pat.records && pat.records.length > 0 
      ? pat.records.map(rec => `
          <div class="record-item">
            <div class="record-header">
              <span class="record-date">📅 Visit Date: ${rec.visit_date}</span>
              <span class="record-doc">👨‍⚕️ Practitioner: Dr. ${rec.doctor_name}</span>
            </div>
            <div class="record-detail"><strong>Clinical Diagnosis:</strong> ${rec.diagnosis}</div>
            ${rec.symptoms ? `<div class="record-detail"><strong>Symptoms:</strong> ${rec.symptoms}</div>` : ''}
            <div class="prescription-box">
              <strong>Prescription & Instructions:</strong><br/>
              ${rec.prescription.replace(/\n/g, '<br/>')}
            </div>
          </div>
        `).join('')
      : '<p style="color: #64748b; font-style: italic;">No clinical diagnostic records found.</p>';

    const appointmentsHtml = pat.appointments && pat.appointments.length > 0
      ? pat.appointments.map(appt => `
          <tr class="appt-tr">
            <td>${appt.appointment_date}</td>
            <td>${appt.appointment_time}</td>
            <td>Dr. ${appt.doctor_name}</td>
            <td>${appt.reason}</td>
            <td><span class="status-span status-${appt.status}">${appt.status}</span></td>
          </tr>
        `).join('')
      : '<tr><td colspan="5" style="text-align: center; color: #64748b; font-style: italic;">No booked appointments recorded.</td></tr>';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Report - ${pat.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            
            body { 
              font-family: 'Plus Jakarta Sans', sans-serif; 
              padding: 40px; 
              color: #1e293b; 
              background-color: #f8fafc;
              margin: 0;
            }
            .report-card { 
              border: 1px solid #e2e8f0; 
              padding: 40px; 
              border-radius: 16px; 
              max-width: 800px; 
              margin: 0 auto; 
              background-color: #ffffff;
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
            }
            .brand-header { 
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #10b981; 
              padding-bottom: 20px; 
              margin-bottom: 28px; 
            }
            .hospital-logo {
              color: #10b981;
              font-size: 28px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .hospital-name { 
              font-family: 'Outfit', sans-serif;
              font-size: 24px; 
              font-weight: 700; 
              color: #0f172a; 
              margin: 0;
            }
            .report-title-label {
              font-size: 12px;
              color: white;
              background-color: #10b981;
              padding: 4px 12px;
              border-radius: 9999px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .section { 
              margin-bottom: 32px; 
            }
            .section-title { 
              font-family: 'Outfit', sans-serif;
              font-size: 15px; 
              text-transform: uppercase; 
              color: #0f172a; 
              font-weight: 700; 
              margin-bottom: 16px; 
              border-bottom: 2px solid #f1f5f9; 
              padding-bottom: 6px; 
              letter-spacing: 0.02em;
            }
            .grid-3col {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 16px 24px;
              margin-bottom: 20px;
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
            }
            .value { 
              font-size: 14px;
              font-weight: 600;
              color: #334155; 
            }
            .record-item {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 16px;
            }
            .record-header {
              display: flex;
              justify-content: space-between;
              font-size: 12.5px;
              font-weight: 600;
              color: #64748b;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .record-detail {
              font-size: 14px;
              color: #334155;
              margin-bottom: 8px;
            }
            .prescription-box {
              background-color: #f0fdf4;
              border-left: 4px solid #10b981;
              padding: 12px;
              border-radius: 4px;
              font-size: 13.5px;
              color: #166534;
              margin-top: 10px;
            }
            .appt-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 13.5px;
            }
            .appt-table th, .appt-table td {
              padding: 10px 12px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            .appt-table th {
              background-color: #f8fafc;
              color: #64748b;
              font-weight: 600;
            }
            .status-span {
              font-size: 11px;
              font-weight: bold;
              padding: 2px 8px;
              border-radius: 9999px;
            }
            .status-Scheduled { background-color: #fef3c7; color: #d97706; }
            .status-Confirmed { background-color: #d1fae5; color: #059669; }
            .status-Completed { background-color: #dbeafe; color: #2563eb; }
            .status-Cancelled { background-color: #fee2e2; color: #dc2626; }

            .report-footer { 
              text-align: center; 
              margin-top: 40px; 
              font-size: 11px; 
              color: #94a3b8; 
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
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
            }
            @media print {
              body { background-color: #ffffff; padding: 0; }
              .report-card { border: none; box-shadow: none; padding: 20px; }
              .print-btn, .action-btn-container { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="report-card">
            <div class="brand-header">
              <div class="hospital-logo">
                <span>💚</span>
                <span class="hospital-name">Lifeline HMS</span>
              </div>
              <div class="report-title-label">Patient Medical Record</div>
            </div>
            
            <div class="section">
              <div class="section-title">Patient Profile Information</div>
              <div class="grid-3col">
                <div class="field">
                  <span class="label">Patient Name</span>
                  <span class="value">${pat.name}</span>
                </div>
                <div class="field">
                  <span class="label">Patient Reference</span>
                  <span class="value">#PT-${pat.id}</span>
                </div>
                <div class="field">
                  <span class="label">Gender</span>
                  <span class="value">${pat.gender}</span>
                </div>
                <div class="field">
                  <span class="label">Date of Birth</span>
                  <span class="value">${pat.date_of_birth}</span>
                </div>
                <div class="field">
                  <span class="label">Blood Group</span>
                  <span class="value" style="color:#ef4444">${pat.blood_group || 'Not Recorded'}</span>
                </div>
                <div class="field">
                  <span class="label">Contact Phone</span>
                  <span class="value">${pat.phone}</span>
                </div>
                <div class="field" style="grid-column: span 3;">
                  <span class="label">Residential Address</span>
                  <span class="value" style="font-weight: normal; color: #475569;">${pat.address || 'No address specified'}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Clinical Diagnoses & Visit History</div>
              ${recordsHtml}
            </div>
            
            <div class="section">
              <div class="section-title">Outpatient Consultations History</div>
              <table class="appt-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Doctor</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${appointmentsHtml}
                </tbody>
              </table>
            </div>
            
            <div class="report-footer">
              <p>Confidential Medical Document - Generated by Lifeline HMS on ${new Date().toLocaleDateString()}</p>
              <p>This document is intended solely for clinical usage by authorized medical personnel.</p>
              <p>© 2026 Lifeline Hospital Management System</p>
            </div>
            
            <div class="action-btn-container">
              <button class="print-btn" onclick="window.print()">Print Complete Medical Record</button>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {!patientDetail ? (
        /* Patient List View */
        <>
          <div className="header-container">
            <div>
              <h1 className="header-title">Patient Admissions</h1>
              <p className="header-subtitle">Search registered profiles, view histories, and clinical records</p>
            </div>
            {role === 'admin' && (
              <button onClick={handleOpenAddModal} className="btn btn-primary">
                <Plus size={16} /> Register Patient
              </button>
            )}
          </div>

          {/* Search Controls */}
          <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="search-box">
                <Search size={18} style={{ color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="search-input" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or contact number..." 
                />
                {searchQuery && (
                  <button type="button" onClick={handleClearSearch} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-secondary">Search</button>
            </form>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading patient roster...</div>
          ) : patients.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No patients match the search criteria.
            </div>
          ) : (
            <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Gender / Age</th>
                      <th>Contact Information</th>
                      <th>Blood Group</th>
                      <th>Registered On</th>
                      {role === 'admin' && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((pat) => (
                      <tr key={pat.id} onClick={() => setSelectedPatientId(pat.id)} style={{ cursor: 'pointer' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontWeight: 'bold', paddingLeft: '11px' }}>
                              {pat.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700' }}>{pat.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: #{pat.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '500' }}>{pat.gender}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{calculateAge(pat.date_of_birth)} years</div>
                        </td>
                        <td>
                          <div>{pat.phone}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{pat.email || 'No email registered'}</div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: pat.blood_group ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                            <Droplet size={14} fill={pat.blood_group ? 'var(--color-danger)' : 'none'} />
                            {pat.blood_group || 'N/A'}
                          </span>
                        </td>
                        <td>{pat.created_at ? pat.created_at.substring(0, 10) : 'N/A'}</td>
                        {role === 'admin' && (
                          <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button onClick={(e) => handleOpenEditModal(pat, e)} className="btn btn-secondary" style={{ padding: '6px', minWidth: 'auto' }} title="Edit Details">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={(e) => handleDeletePatient(pat.id, e)} className="btn btn-danger" style={{ padding: '6px', minWidth: 'auto' }} title="Delete Profile">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Patient Profile Detail View */
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="header-container" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setSelectedPatientId(null)} className="btn btn-secondary">
                <X size={14} /> Back to List
              </button>
              <button onClick={() => handlePrintReport(patientDetail)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={14} /> Print Medical Report
              </button>
            </div>
            {role === 'admin' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleOpenRecordModal} className="btn btn-primary">
                  <FileHeart size={14} /> Record Clinic Visit
                </button>
                <button onClick={(e) => handleOpenEditModal(patientDetail, e)} className="btn btn-secondary">
                  <Edit2 size={14} /> Edit Profile
                </button>
                <button onClick={(e) => handleDeletePatient(patientDetail.id, e)} className="btn btn-danger">
                  <Trash2 size={14} /> Delete Profile
                </button>
              </div>
            )}
          </div>

          <div className="patient-profile-layout">
            {/* Left Column: Personal info card */}
            <div className="card" style={{ height: 'fit-content' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', margin: '0 auto 12px auto' }}>
                  {patientDetail.name.charAt(0)}
                </div>
                <h2>{patientDetail.name}</h2>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Registered Patient #{patientDetail.id}</span>
              </div>

              <div className="patient-info-list">
                <div className="patient-info-item">
                  <div className="patient-info-label">Age & DOB</div>
                  <div className="patient-info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
                    {patientDetail.date_of_birth} ({calculateAge(patientDetail.date_of_birth)} years)
                  </div>
                </div>

                <div className="patient-info-item">
                  <div className="patient-info-label">Gender</div>
                  <div className="patient-info-value">{patientDetail.gender}</div>
                </div>

                <div className="patient-info-item">
                  <div className="patient-info-label">Blood Group</div>
                  <div className="patient-info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
                    <Droplet size={14} fill="var(--color-danger)" />
                    {patientDetail.blood_group || 'Not recorded'}
                  </div>
                </div>

                <div className="patient-info-item">
                  <div className="patient-info-label">Contact Number</div>
                  <div className="patient-info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                    {patientDetail.phone}
                  </div>
                </div>

                <div className="patient-info-item">
                  <div className="patient-info-label">Email Address</div>
                  <div className="patient-info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '13.5px', wordBreak: 'break-all' }}>{patientDetail.email || 'None'}</span>
                  </div>
                </div>

                <div className="patient-info-item" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                  <div className="patient-info-label">Residential Address</div>
                  <div className="patient-info-value" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontWeight: 'normal', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} style={{ color: 'var(--color-primary)', marginTop: '3px', flexShrink: 0 }} />
                    {patientDetail.address || 'No address specified'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Records timeline */}
            <div>
              <div className="detail-tabs">
                <button 
                  onClick={() => setDetailTab('records')} 
                  className={`tab-btn ${detailTab === 'records' ? 'active' : ''}`}
                >
                  Medical Records ({patientDetail.records?.length || 0})
                </button>
                <button 
                  onClick={() => setDetailTab('appointments')} 
                  className={`tab-btn ${detailTab === 'appointments' ? 'active' : ''}`}
                >
                  Consultations History ({patientDetail.appointments?.length || 0})
                </button>
              </div>

              {detailTab === 'records' ? (
                /* Medical Records history timeline */
                <div className="timeline">
                  {patientDetail.records?.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No clinical visits recorded yet. Click "Record Clinic Visit" to document a diagnosis.
                    </div>
                  ) : (
                    patientDetail.records.map((rec) => (
                      <div key={rec.id} className="timeline-item">
                        <div className="timeline-dot completed"></div>
                        <div className="timeline-content">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span className="timeline-time" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={12} /> {rec.visit_date}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Stethoscope size={13} style={{ color: 'var(--color-secondary)' }} />
                              Diagnosed by:{' '}
                              <button 
                                onClick={() => { setSelectedDoctorId(rec.doctor_id); setView('doctors'); }}
                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', padding: 0, cursor: 'pointer', fontWeight: '700' }}
                              >
                                Dr. {rec.doctor_name}
                              </button>
                            </span>
                          </div>
                          
                          <div className="timeline-title" style={{ color: 'var(--color-secondary)', marginTop: '8px', fontSize: '16px' }}>
                            Diagnosis: {rec.diagnosis}
                          </div>
                          
                          {rec.symptoms && (
                            <div className="timeline-body" style={{ marginTop: '8px' }}>
                              <strong>Recorded Symptoms:</strong> {rec.symptoms}
                            </div>
                          )}
                          
                          <div className="timeline-body" style={{ marginTop: '8px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid var(--color-primary)' }}>
                            <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Prescription & Instructions:</strong>
                            <div style={{ whiteSpace: 'pre-line' }}>{rec.prescription}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Appointments list */
                <div className="timeline">
                  {patientDetail.appointments?.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No booked consultations found.
                    </div>
                  ) : (
                    patientDetail.appointments.map((appt) => (
                      <div key={appt.id} className="timeline-item">
                        <div className={`timeline-dot ${appt.status === 'Completed' ? 'completed' : appt.status === 'Cancelled' ? 'cancelled' : 'scheduled'}`}></div>
                        <div className="timeline-content">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="timeline-time">{appt.appointment_date} @ {appt.appointment_time}</span>
                            <span className={`badge ${appt.status === 'Scheduled' ? 'badge-scheduled' : appt.status === 'Confirmed' ? 'badge-confirmed' : appt.status === 'Completed' ? 'badge-completed' : 'badge-cancelled'}`}>
                              {appt.status}
                            </span>
                          </div>
                          <div className="timeline-title" style={{ fontSize: '15px' }}>
                            Consultation with{' '}
                            <button 
                              onClick={() => { setSelectedDoctorId(appt.doctor_id); setView('doctors'); }}
                              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '700', padding: 0 }}
                            >
                              Dr. {appt.doctor_name}
                            </button>
                          </div>
                          <div className="timeline-body">
                            <strong>Reason:</strong> {appt.reason}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register / Edit Patient Modal */}
      {isPatientModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingPatient ? 'Modify Patient Profile' : 'Register New Patient'}</h2>
              <button onClick={() => setIsPatientModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>

            <form onSubmit={handlePatientSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  placeholder="e.g. Robert Smith"
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={formEmail} 
                    onChange={(e) => setFormEmail(e.target.value)} 
                    placeholder="robert@example.com" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    value={formPhone} 
                    onChange={(e) => setFormPhone(e.target.value)} 
                    placeholder="e.g. +1 555-0144"
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-select" 
                    value={formGender} 
                    onChange={(e) => setFormGender(e.target.value)}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group (Optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formBloodGroup} 
                    onChange={(e) => setFormBloodGroup(e.target.value)} 
                    placeholder="e.g. O+, AB-" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formDob} 
                  onChange={(e) => setFormDob(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Residential Address</label>
                <textarea 
                  className="form-textarea" 
                  value={formAddress} 
                  onChange={(e) => setFormAddress(e.target.value)} 
                  placeholder="Street address, City, ZIP..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsPatientModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Clinic Visit Modal */}
      {isRecordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Record Clinical Diagnosis</h2>
              <button onClick={() => setIsRecordModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>

            <form onSubmit={handleRecordSubmit}>
              <div className="form-group">
                <label className="form-label">Attending Doctor</label>
                <select 
                  className="form-select" 
                  value={recordDocId} 
                  onChange={(e) => setRecordDocId(e.target.value)}
                  required
                >
                  {doctorsList.length === 0 ? (
                    <option value="">No doctors registered</option>
                  ) : (
                    doctorsList.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization})</option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Symptoms</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={recordSymptoms} 
                  onChange={(e) => setRecordSymptoms(e.target.value)} 
                  placeholder="e.g. Fever, persistent cough, fatigue" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Diagnosis</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={recordDiagnosis} 
                  onChange={(e) => setRecordDiagnosis(e.target.value)} 
                  placeholder="e.g. Acute Bronchitis"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prescription (Medicines, dosage, duration)</label>
                <textarea 
                  className="form-textarea" 
                  value={recordPrescription} 
                  onChange={(e) => setRecordPrescription(e.target.value)} 
                  placeholder="e.g. Amoxicillin 500mg - 3 times daily for 7 days. Paracetamol 650mg as needed for fever."
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsRecordModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Save Diagnosis'}
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
