from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Count, Q
from django.http import HttpResponseRedirect
from datetime import date, timedelta
from .models import Department, Doctor, Patient, Appointment, MedicalRecord
from .forms import PatientForm, AppointmentForm, MedicalRecordForm

def dashboard(request):
    total_patients = Patient.objects.count()
    total_doctors = Doctor.objects.count()
    total_appointments = Appointment.objects.count()
    pending_appointments = Appointment.objects.filter(status='Scheduled').count()
    
    # Recent appointments
    recent_appointments = Appointment.objects.order_by('-created_at')[:5]
    
    # Upcoming appointments
    upcoming_appointments = Appointment.objects.filter(
        appointment_date__gte=date.today()
    ).exclude(status='Cancelled').order_by('appointment_date', 'appointment_time')[:5]
    
    # Chart 1: Appointments by status
    status_counts = Appointment.objects.values('status').annotate(count=Count('id'))
    status_data = {
        'Scheduled': 0,
        'Confirmed': 0,
        'Completed': 0,
        'Cancelled': 0
    }
    for item in status_counts:
        status_data[item['status']] = item['count']
        
    # Chart 2: Appointments by department
    dept_counts = Appointment.objects.values('doctor__department__name').annotate(count=Count('id'))
    dept_labels = []
    dept_values = []
    for item in dept_counts:
        if item['doctor__department__name']:
            dept_labels.append(item['doctor__department__name'])
            dept_values.append(item['count'])
            
    # Chart 3: Appointments last 7 days
    today = date.today()
    last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    days_labels = [d.strftime('%b %d') for d in last_7_days]
    
    daily_counts = []
    for d in last_7_days:
        cnt = Appointment.objects.filter(appointment_date=d).count()
        daily_counts.append(cnt)

    context = {
        'total_patients': total_patients,
        'total_doctors': total_doctors,
        'total_appointments': total_appointments,
        'pending_appointments': pending_appointments,
        'recent_appointments': recent_appointments,
        'upcoming_appointments': upcoming_appointments,
        'status_labels': list(status_data.keys()),
        'status_values': list(status_data.values()),
        'dept_labels': dept_labels,
        'dept_values': dept_values,
        'days_labels': days_labels,
        'daily_counts': daily_counts,
        'active_tab': 'dashboard'
    }
    return render(request, 'hospital/dashboard.html', context)

def doctor_list(request):
    dept_id = request.GET.get('department')
    if dept_id:
        doctors = Doctor.objects.filter(department_id=dept_id)
        selected_dept = get_object_or_404(Department, id=dept_id)
    else:
        doctors = Doctor.objects.all()
        selected_dept = None
        
    departments = Department.objects.all()
    
    context = {
        'doctors': doctors,
        'departments': departments,
        'selected_dept': selected_dept,
        'active_tab': 'doctors'
    }
    return render(request, 'hospital/doctors.html', context)

def doctor_detail(request, pk):
    doctor = get_object_or_404(Doctor, pk=pk)
    appointments = doctor.appointments.order_by('-appointment_date', '-appointment_time')[:10]
    context = {
        'doctor': doctor,
        'appointments': appointments,
        'active_tab': 'doctors'
    }
    return render(request, 'hospital/doctor_detail.html', context)

def patient_list(request):
    query = request.GET.get('q')
    if query:
        patients = Patient.objects.filter(
            Q(name__icontains=query) |
            Q(email__icontains=query) |
            Q(phone__icontains=query)
        ).order_by('-created_at')
    else:
        patients = Patient.objects.all().order_by('-created_at')
        
    context = {
        'patients': patients,
        'query': query,
        'active_tab': 'patients'
    }
    return render(request, 'hospital/patients.html', context)

def patient_detail(request, pk):
    patient = get_object_or_404(Patient, pk=pk)
    appointments = patient.appointments.all().order_by('-appointment_date', '-appointment_time')
    records = patient.medical_records.all().order_by('-visit_date')
    
    # Inline record form
    record_form = MedicalRecordForm(initial={'patient': patient})
    
    context = {
        'patient': patient,
        'appointments': appointments,
        'records': records,
        'record_form': record_form,
        'active_tab': 'patients'
    }
    return render(request, 'hospital/patient_detail.html', context)

def patient_add(request):
    if request.method == 'POST':
        form = PatientForm(request.POST)
        if form.is_valid():
            patient = form.save()
            return redirect('patient_detail', pk=patient.pk)
    else:
        form = PatientForm()
        
    context = {
        'form': form,
        'title': 'Add New Patient',
        'active_tab': 'patients'
    }
    return render(request, 'hospital/patient_form.html', context)

def patient_edit(request, pk):
    patient = get_object_or_404(Patient, pk=pk)
    if request.method == 'POST':
        form = PatientForm(request.POST, instance=patient)
        if form.is_valid():
            form.save()
            return redirect('patient_detail', pk=patient.pk)
    else:
        form = PatientForm(instance=patient)
        
    context = {
        'form': form,
        'title': 'Edit Patient Details',
        'active_tab': 'patients'
    }
    return render(request, 'hospital/patient_form.html', context)

def appointment_list(request):
    status_filter = request.GET.get('status')
    if status_filter:
        appointments = Appointment.objects.filter(status=status_filter).order_by('-appointment_date', '-appointment_time')
    else:
        appointments = Appointment.objects.all().order_by('-appointment_date', '-appointment_time')
        
    context = {
        'appointments': appointments,
        'status_filter': status_filter,
        'active_tab': 'appointments'
    }
    return render(request, 'hospital/appointments.html', context)

def appointment_book(request):
    if request.method == 'POST':
        form = AppointmentForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('appointment_list')
    else:
        initial_data = {}
        patient_id = request.GET.get('patient')
        doctor_id = request.GET.get('doctor')
        if patient_id:
            initial_data['patient'] = patient_id
        if doctor_id:
            initial_data['doctor'] = doctor_id
        form = AppointmentForm(initial=initial_data)
        
    context = {
        'form': form,
        'active_tab': 'appointments'
    }
    return render(request, 'hospital/appointment_form.html', context)

def appointment_update_status(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    if request.method == 'POST':
        status = request.POST.get('status')
        if status in dict(Appointment.STATUS_CHOICES):
            appointment.status = status
            appointment.save()
            
    referer = request.META.get('HTTP_REFERER')
    if referer:
        return HttpResponseRedirect(referer)
    return redirect('dashboard')

def patient_add_record(request, pk):
    patient = get_object_or_404(Patient, pk=pk)
    if request.method == 'POST':
        form = MedicalRecordForm(request.POST)
        if form.is_valid():
            record = form.save(commit=False)
            record.patient = patient
            record.save()
            return redirect('patient_detail', pk=patient.pk)
    return redirect('patient_detail', pk=patient.pk)
