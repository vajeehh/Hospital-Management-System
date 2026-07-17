import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle, 
  MessageSquare,
  Sparkles,
  PhoneCall,
  Activity
} from 'lucide-react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const contactInfos = [
    {
      icon: MapPin,
      title: 'Our Location',
      details: ['100 Lifeline Boulevard, Sector 4', 'Medical District, MD 110023'],
      color: 'var(--color-primary)'
    },
    {
      icon: PhoneCall,
      title: 'Emergency Help',
      details: ['+1 (555) 911-0000 (24/7)', '+1 (555) 911-0001 (ICU Hotline)'],
      color: 'var(--color-danger)'
    },
    {
      icon: Mail,
      title: 'Email Support',
      details: ['support@lifelinehms.com', 'careers@lifelinehms.com'],
      color: 'var(--color-secondary)'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      details: ['Outpatient: Mon - Sat (8 AM - 8 PM)', 'Emergency / Trauma: 24/7/365'],
      color: 'var(--color-warning)'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.message.trim()) newErrors.message = 'Please type your message';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate API call to Django backend
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccessModalOpen(true);
    }, 1500);
  };

  const handleCloseModal = () => {
    setIsSuccessModalOpen(false);
    // Reset Form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: 'General Inquiry',
      message: ''
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="header-container" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={28} className="pulse-icon" style={{ color: 'var(--color-primary)' }} />
            Connect With Lifeline HMS
          </h1>
          <p className="header-subtitle">We are here to assist you 24/7. Reach out for appointments, feedback, or emergencies</p>
        </div>
      </div>

      <div className="contact-grid">
        {/* Left Side: Contact Information Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', background: 'var(--gradient-card)' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
              Direct Channels
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {contactInfos.map((info, idx) => {
                const Icon = info.icon;
                return (
                  <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ 
                      padding: '10px', 
                      borderRadius: '12px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                      border: '1px solid var(--border-light)',
                      color: info.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>
                        {info.title}
                      </h4>
                      {info.details.map((detail, dIdx) => (
                        <p key={dIdx} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick FAQ Card */}
          <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.03, color: 'var(--text-main)' }}>
              <MessageSquare size={160} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Emergency Advisory</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              For severe injuries, sudden chest pain, difficulty breathing, or active trauma, please head directly to our Emergency Department or dial the ICU Hotline immediately. Pre-registration is not required for emergency care.
            </p>
          </div>
        </div>

        {/* Right Side: Message Submission Form */}
        <div className="card" style={{ padding: '30px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '6px' }}>Send Us a Message</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Fill out the form below and our relations officer will get back to you within 24 hours.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                name="name"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="e.g. John Doe"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  value={formData.email} 
                  onChange={handleInputChange} 
                  placeholder="e.g. john@example.com"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone"
                  className={`form-input ${errors.phone ? 'input-error' : ''}`}
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  placeholder="e.g. +1 555-0199"
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <select 
                name="subject"
                className="form-select"
                value={formData.subject} 
                onChange={handleInputChange}
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Appointment Support">Appointment Support</option>
                <option value="Billing & Insurance">Billing & Insurance</option>
                <option value="Feedback & Grievances">Feedback & Grievances</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Message Details</label>
              <textarea 
                name="message"
                className={`form-textarea ${errors.message ? 'input-error' : ''}`}
                value={formData.message} 
                onChange={handleInputChange} 
                placeholder="Describe your inquiry, request, or issue in detail..."
                style={{ minHeight: '130px' }}
              />
              {errors.message && <span className="error-text">{errors.message}</span>}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '8px' }}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ marginRight: '8px' }}></div>
                  Sending Message...
                </>
              ) : (
                <>
                  <Send size={16} style={{ marginRight: '8px' }} />
                  Submit Inquiry
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', zIndex: '300', background: 'rgba(5, 7, 12, 0.85)' }}>
          <div className="modal-content" style={{ maxWidth: '460px', padding: '32px', textAlign: 'center', animation: 'scaleUp 0.3s ease-out' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--color-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px auto' 
            }}>
              <CheckCircle size={36} />
            </div>
            
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Inquiry Submitted!</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
              Thank you, <strong>{formData.name}</strong>. Your message regarding <strong>{formData.subject}</strong> has been successfully forwarded to our relations team. We will review and respond to you at <strong>{formData.email}</strong> shortly.
            </p>

            <button onClick={handleCloseModal} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              Go Back
            </button>
          </div>
        </div>
      )}

      <style>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .contact-grid {
            grid-template-columns: 1fr;
          }
        }

        .pulse-icon {
          animation: pulse 2.5s infinite ease-in-out;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 4px rgba(16,185,129,0.4)); }
          100% { transform: scale(1); }
        }

        .input-error {
          border-color: var(--color-danger) !important;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15) !important;
        }

        .error-text {
          color: var(--color-danger);
          font-size: 11.5px;
          margin-top: 4px;
          font-weight: 500;
          display: block;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
