import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  Clock, 
  UserRound, 
  X, 
  Edit2, 
  Trash2,
  CalendarCheck2
} from 'lucide-react';

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1594824813573-246434e33963?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=150"
];

export default function Doctors({ selectedDoctorId, setSelectedDoctorId, setView, setSelectedPatientId, role }) {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  
  // Doctor details view state
  const [doctorDetail, setDoctorDetail] = useState(null);
  
  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null); // null for add, doctor object for edit
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form fields state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formAvailability, setFormAvailability] = useState('');
  const [formPic, setFormPic] = useState('');

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch departments
      const deptRes = await fetch('/api/departments/');
      const deptsJson = await deptRes.json();
      setDepartments(deptsJson);

      // Fetch doctors
      await fetchDoctors(selectedDeptFilter);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (deptId) => {
    try {
      const url = deptId ? `/api/doctors/?department=${deptId}` : '/api/doctors/';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load doctors.');
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const fetchDoctorDetail = async (id) => {
    try {
      const res = await fetch(`/api/doctors/${id}/`);
      if (!res.ok) throw new Error('Failed to fetch doctor profile.');
      const data = await res.json();
      setDoctorDetail(data);
    } catch (err) {
      console.error(err);
      alert(err.message);
      setSelectedDoctorId(null);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchDoctors(selectedDeptFilter);
  }, [selectedDeptFilter]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchDoctorDetail(selectedDoctorId);
    } else {
      setDoctorDetail(null);
    }
  }, [selectedDoctorId]);

  const handleOpenAddModal = () => {
    setEditingDoctor(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormSpecialization('');
    setFormDeptId(departments[0]?.id || '');
    setFormBio('');
    setFormRoom('');
    setFormAvailability('');
    setFormPic('');
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (doc, e) => {
    e.stopPropagation(); // prevent clicking card detail
    setEditingDoctor(doc);
    setFormName(doc.name);
    setFormEmail(doc.email);
    setFormPhone(doc.phone);
    setFormSpecialization(doc.specialization);
    setFormDeptId(doc.department_id);
    setFormBio(doc.bio);
    setFormRoom(doc.room_number);
    setFormAvailability(doc.availability);
    setFormPic(doc.profile_pic);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteDoctor = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this doctor? All their records will remain but referencing this doctor will be removed.')) return;
    
    try {
      const res = await fetch(`/api/doctors/${id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete doctor.');
      setDoctors(doctors.filter(d => d.id !== id));
      if (selectedDoctorId === id) setSelectedDoctorId(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formName,
      email: formEmail,
      phone: formPhone,
      specialization: formSpecialization,
      department_id: parseInt(formDeptId),
      bio: formBio,
      room_number: formRoom,
      availability: formAvailability,
      profile_pic: formPic
    };

    try {
      let res;
      if (editingDoctor) {
        // Edit doctor
        res = await fetch(`/api/doctors/${editingDoctor.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Add doctor
        res = await fetch('/api/doctors/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save doctor details.');
      }

      setIsAddEditModalOpen(false);
      fetchDoctors(selectedDeptFilter);
      if (selectedDoctorId && editingDoctor && selectedDoctorId === editingDoctor.id) {
        fetchDoctorDetail(selectedDoctorId);
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* List / Selection Split */}
      {!doctorDetail ? (
        <>
          <div className="header-container">
            <div>
              <h1 className="header-title">Clinical Practitioners</h1>
              <p className="header-subtitle">Manage clinical staffing, room allocations, and specializations</p>
            </div>
            {role === 'admin' && (
              <button onClick={handleOpenAddModal} className="btn btn-primary">
                <Plus size={16} /> Add New Doctor
              </button>
            )}
          </div>

          {/* Department Filter Pills */}
          <div className="filter-bar">
            <button 
              onClick={() => setSelectedDeptFilter('')}
              className={`filter-btn ${selectedDeptFilter === '' ? 'active' : ''}`}
            >
              All Departments
            </button>
            {departments.map((dept) => (
              <button 
                key={dept.id}
                onClick={() => setSelectedDeptFilter(dept.id)}
                className={`filter-btn ${selectedDeptFilter === dept.id ? 'active' : ''}`}
              >
                {dept.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading practitioners...</div>
          ) : doctors.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No practitioners registered in this category.
            </div>
          ) : (
            <div className="doctors-grid">
              {doctors.map((doc) => (
                <div 
                  key={doc.id} 
                  className="card doctor-card" 
                  onClick={() => setSelectedDoctorId(doc.id)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  {role === 'admin' && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={(e) => handleOpenEditModal(doc, e)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px', minWidth: 'auto', borderRadius: '50%' }}
                        title="Edit details"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteDoctor(doc.id, e)} 
                        className="btn btn-danger" 
                        style={{ padding: '6px', minWidth: 'auto', borderRadius: '50%' }}
                        title="Delete profile"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}

                  <div className="doctor-avatar-wrapper">
                    <img 
                      src={doc.profile_pic || "/static/hospital/images/default-doctor.png"} 
                      alt={doc.name} 
                      className="doctor-avatar"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150" }} 
                    />
                  </div>
                  
                  <span className="doctor-dept">{doc.department_name}</span>
                  <h3 style={{ fontSize: '18px', marginTop: '4px' }}>Dr. {doc.name}</h3>
                  <p className="doctor-specialty">{doc.specialization}</p>

                  <div className="doctor-details-list">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={12} style={{ color: 'var(--color-primary)' }} />
                      <span>Room {doc.room_number || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={12} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.availability || 'Not Specified'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Doctor Profile Detail View */
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="header-container" style={{ marginBottom: '24px' }}>
            <button onClick={() => setSelectedDoctorId(null)} className="btn btn-secondary">
              <X size={14} /> Back to List
            </button>
            {role === 'admin' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={(e) => handleOpenEditModal(doctorDetail, e)} className="btn btn-secondary">
                  <Edit2 size={14} /> Edit Profile
                </button>
                <button onClick={(e) => handleDeleteDoctor(doctorDetail.id, e)} className="btn btn-danger">
                  <Trash2 size={14} /> Delete Doctor
                </button>
              </div>
            )}
          </div>

          <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', marginBottom: '32px' }}>
            {/* Sidebar info */}
            <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-light)', paddingRight: '32px' }}>
              <img 
                src={doctorDetail.profile_pic} 
                alt={doctorDetail.name} 
                className="doctor-avatar" 
                style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '50%', marginBottom: '16px' }}
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200" }} 
              />
              <span className="doctor-dept" style={{ fontSize: '12px' }}>{doctorDetail.department_name}</span>
              <h2 style={{ marginTop: '8px' }}>Dr. {doctorDetail.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>{doctorDetail.specialization}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px' }}>
                  <Mail size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{doctorDetail.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px' }}>
                  <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>{doctorDetail.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px' }}>
                  <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>Room {doctorDetail.room_number}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px' }}>
                  <Clock size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>{doctorDetail.availability}</span>
                </div>
              </div>
            </div>

            {/* Profile Bio & Appointments */}
            <div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Professional Biography</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
                {doctorDetail.bio || `Dr. ${doctorDetail.name} is a dedicated professional in the field of ${doctorDetail.specialization} serving patients at Lifeline Hospital with utmost care.`}
              </p>

              <h3 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarCheck2 size={20} style={{ color: 'var(--color-primary)' }} />
                Upcoming Consultations
              </h3>
              
              <div className="table-container">
                {!doctorDetail.recent_appointments || doctorDetail.recent_appointments.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>No consultations scheduled recently.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date & Time</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorDetail.recent_appointments.map((appt) => (
                        <tr key={appt.id}>
                          <td>
                            <button 
                              onClick={() => { setSelectedPatientId(appt.patient_id); setView('patients'); }}
                              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}
                            >
                              {appt.patient_name}
                            </button>
                          </td>
                          <td>
                            <div style={{ fontWeight: '500' }}>{appt.appointment_date}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{appt.appointment_time}</div>
                          </td>
                          <td>{appt.reason}</td>
                          <td>
                            <span className={`badge ${appt.status === 'Scheduled' ? 'badge-scheduled' : appt.status === 'Confirmed' ? 'badge-confirmed' : appt.status === 'Completed' ? 'badge-completed' : 'badge-cancelled'}`}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Practitioner Modal */}
      {isAddEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingDoctor ? 'Edit Doctor Profile' : 'Add New Practitioner'}</h2>
              <button onClick={() => setIsAddEditModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  placeholder="e.g. John Doe"
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={formEmail} 
                    onChange={(e) => setFormEmail(e.target.value)} 
                    placeholder="name@hospital.com"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    value={formPhone} 
                    onChange={(e) => setFormPhone(e.target.value)} 
                    placeholder="+1 555-0199"
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formSpecialization} 
                    onChange={(e) => setFormSpecialization(e.target.value)} 
                    placeholder="e.g. Cardiologist"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select 
                    className="form-select" 
                    value={formDeptId} 
                    onChange={(e) => setFormDeptId(e.target.value)}
                    required
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Assigned Room</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formRoom} 
                    onChange={(e) => setFormRoom(e.target.value)} 
                    placeholder="e.g. 302"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Availability Schedule</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formAvailability} 
                    onChange={(e) => setFormAvailability(e.target.value)} 
                    placeholder="e.g. Mon-Fri, 9:00 AM - 5:00 PM"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Profile Image Presets</label>
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '6px 0', marginBottom: '8px' }}>
                  {PRESET_AVATARS.map((url, idx) => (
                    <img 
                      key={idx}
                      src={url}
                      alt={`Avatar ${idx + 1}`}
                      onClick={() => setFormPic(url)}
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: formPic === url ? '3px solid var(--color-primary)' : '2px solid var(--border-light)',
                        boxShadow: formPic === url ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      title={`Doctor Avatar Option ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Or Custom Image URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formPic} 
                  onChange={(e) => setFormPic(e.target.value)} 
                  placeholder="https://example.com/doctor-pic.jpg"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Professional Biography</label>
                <textarea 
                  className="form-textarea" 
                  value={formBio} 
                  onChange={(e) => setFormBio(e.target.value)} 
                  placeholder="Write a brief professional background..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsAddEditModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Save Details'}
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
