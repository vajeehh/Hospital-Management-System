import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from datetime import date, datetime, timedelta
from .models import Department, Doctor, Patient, Appointment, MedicalRecord

# --- Serialization Helpers ---

def patient_to_dict(p):
    return {
        'id': p.id,
        'name': p.name,
        'email': p.email or '',
        'phone': p.phone,
        'gender': p.gender,
        'date_of_birth': p.date_of_birth.strftime('%Y-%m-%d') if p.date_of_birth else '',
        'blood_group': p.blood_group,
        'address': p.address,
        'created_at': p.created_at.strftime('%Y-%m-%d %H:%M:%S') if p.created_at else ''
    }

def doctor_to_dict(d):
    return {
        'id': d.id,
        'name': d.name,
        'email': d.email,
        'phone': d.phone,
        'specialization': d.specialization,
        'department_id': d.department.id if d.department else None,
        'department_name': d.department.name if d.department else '',
        'bio': d.bio,
        'room_number': d.room_number,
        'availability': d.availability,
        'profile_pic': d.profile_pic or "/static/hospital/images/default-doctor.png"
    }

def appointment_to_dict(a):
    return {
        'id': a.id,
        'patient_id': a.patient.id,
        'patient_name': a.patient.name,
        'doctor_id': a.doctor.id,
        'doctor_name': a.doctor.name,
        'appointment_date': a.appointment_date.strftime('%Y-%m-%d') if a.appointment_date else '',
        'appointment_time': a.appointment_time.strftime('%H:%M') if a.appointment_time else '',
        'reason': a.reason,
        'status': a.status,
        'created_at': a.created_at.strftime('%Y-%m-%d %H:%M:%S') if a.created_at else ''
    }

def record_to_dict(r):
    return {
        'id': r.id,
        'patient_id': r.patient.id,
        'patient_name': r.patient.name,
        'doctor_id': r.doctor.id,
        'doctor_name': r.doctor.name,
        'visit_date': r.visit_date.strftime('%Y-%m-%d') if r.visit_date else '',
        'symptoms': r.symptoms,
        'diagnosis': r.diagnosis,
        'prescription': r.prescription
    }

def department_to_dict(dept):
    return {
        'id': dept.id,
        'name': dept.name,
        'description': dept.description,
        'icon': dept.icon
    }

# --- Views ---

def api_dashboard(request):
    """Retrieve statistics and data needed for dashboard charts."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    total_patients = Patient.objects.count()
    total_doctors = Doctor.objects.count()
    total_appointments = Appointment.objects.count()
    pending_appointments = Appointment.objects.filter(status='Scheduled').count()
    
    # Recent appointments (last 5)
    recent = Appointment.objects.order_by('-created_at')[:5]
    recent_list = [appointment_to_dict(a) for a in recent]
    
    # Upcoming appointments (upcoming 5)
    upcoming = Appointment.objects.filter(
        appointment_date__gte=date.today()
    ).exclude(status='Cancelled').order_by('appointment_date', 'appointment_time')[:5]
    upcoming_list = [appointment_to_dict(a) for a in upcoming]
    
    # Chart 1: Status Counts
    status_counts = Appointment.objects.values('status').annotate(count=Count('id'))
    status_data = {
        'Scheduled': 0,
        'Confirmed': 0,
        'Completed': 0,
        'Cancelled': 0
    }
    for item in status_counts:
        status_data[item['status']] = item['count']
        
    # Chart 2: Department Counts
    dept_counts = Appointment.objects.values('doctor__department__name').annotate(count=Count('id'))
    dept_labels = []
    dept_values = []
    for item in dept_counts:
        if item['doctor__department__name']:
            dept_labels.append(item['doctor__department__name'])
            dept_values.append(item['count'])
            
    # Chart 3: Weekly Activity
    today = date.today()
    last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    days_labels = [d.strftime('%b %d') for d in last_7_days]
    daily_counts = []
    for d in last_7_days:
        cnt = Appointment.objects.filter(appointment_date=d).count()
        daily_counts.append(cnt)

    return JsonResponse({
        'stats': {
            'total_patients': total_patients,
            'total_doctors': total_doctors,
            'total_appointments': total_appointments,
            'pending_appointments': pending_appointments,
        },
        'recent_appointments': recent_list,
        'upcoming_appointments': upcoming_list,
        'charts': {
            'status_labels': list(status_data.keys()),
            'status_values': list(status_data.values()),
            'dept_labels': dept_labels,
            'dept_values': dept_values,
            'days_labels': days_labels,
            'daily_counts': daily_counts,
        }
    })

def api_departments(request):
    """Retrieve all departments."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    depts = Department.objects.all()
    return JsonResponse([department_to_dict(d) for d in depts], safe=False)

@csrf_exempt
def api_doctors(request):
    """List or create doctors."""
    if request.method == 'GET':
        dept_id = request.GET.get('department')
        if dept_id:
            doctors = Doctor.objects.filter(department_id=dept_id)
        else:
            doctors = Doctor.objects.all()
        return JsonResponse([doctor_to_dict(d) for d in doctors], safe=False)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            department = get_object_or_404(Department, id=data.get('department_id'))
            doctor = Doctor.objects.create(
                name=data.get('name'),
                email=data.get('email'),
                phone=data.get('phone'),
                specialization=data.get('specialization'),
                department=department,
                bio=data.get('bio', ''),
                room_number=data.get('room_number', ''),
                availability=data.get('availability', ''),
                profile_pic=data.get('profile_pic', '')
            )
            return JsonResponse(doctor_to_dict(doctor), status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def api_doctor_detail(request, pk):
    """Retrieve, update, or delete a doctor."""
    doctor = get_object_or_404(Doctor, pk=pk)
    
    if request.method == 'GET':
        appointments = doctor.appointments.order_by('-appointment_date', '-appointment_time')[:10]
        data = doctor_to_dict(doctor)
        data['recent_appointments'] = [appointment_to_dict(a) for a in appointments]
        return JsonResponse(data)
        
    elif request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body)
            if 'name' in data: doctor.name = data['name']
            if 'email' in data: doctor.email = data['email']
            if 'phone' in data: doctor.phone = data['phone']
            if 'specialization' in data: doctor.specialization = data['specialization']
            if 'bio' in data: doctor.bio = data['bio']
            if 'room_number' in data: doctor.room_number = data['room_number']
            if 'availability' in data: doctor.availability = data['availability']
            if 'profile_pic' in data: doctor.profile_pic = data['profile_pic']
            
            if 'department_id' in data:
                department = get_object_or_404(Department, id=data['department_id'])
                doctor.department = department
                
            doctor.save()
            return JsonResponse(doctor_to_dict(doctor))
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    elif request.method == 'DELETE':
        doctor.delete()
        return JsonResponse({'message': 'Doctor deleted successfully'}, status=200)
        
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def api_patients(request):
    """List, search, or create patients."""
    if request.method == 'GET':
        query = request.GET.get('q')
        if query:
            patients = Patient.objects.filter(
                Q(name__icontains=query) |
                Q(email__icontains=query) |
                Q(phone__icontains=query)
            ).order_by('-created_at')
        else:
            patients = Patient.objects.all().order_by('-created_at')
        return JsonResponse([patient_to_dict(p) for p in patients], safe=False)
        
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            dob = date.fromisoformat(data.get('date_of_birth'))
            patient = Patient.objects.create(
                name=data.get('name'),
                email=data.get('email') or None,
                phone=data.get('phone'),
                gender=data.get('gender'),
                date_of_birth=dob,
                blood_group=data.get('blood_group', ''),
                address=data.get('address', '')
            )
            return JsonResponse(patient_to_dict(patient), status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def api_patient_detail(request, pk):
    """Retrieve, update, or delete a patient."""
    patient = get_object_or_404(Patient, pk=pk)
    
    if request.method == 'GET':
        appointments = patient.appointments.all().order_by('-appointment_date', '-appointment_time')
        records = patient.medical_records.all().order_by('-visit_date')
        
        data = patient_to_dict(patient)
        data['appointments'] = [appointment_to_dict(a) for a in appointments]
        data['records'] = [record_to_dict(r) for r in records]
        return JsonResponse(data)
        
    elif request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body)
            if 'name' in data: patient.name = data['name']
            if 'email' in data: patient.email = data['email'] or None
            if 'phone' in data: patient.phone = data['phone']
            if 'gender' in data: patient.gender = data['gender']
            if 'blood_group' in data: patient.blood_group = data['blood_group']
            if 'address' in data: patient.address = data['address']
            
            if 'date_of_birth' in data:
                patient.date_of_birth = date.fromisoformat(data['date_of_birth'])
                
            patient.save()
            return JsonResponse(patient_to_dict(patient))
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    elif request.method == 'DELETE':
        patient.delete()
        return JsonResponse({'message': 'Patient deleted successfully'}, status=200)
        
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def api_patient_records(request, pk):
    """List or create medical records for a specific patient."""
    patient = get_object_or_404(Patient, pk=pk)
    
    if request.method == 'GET':
        records = patient.medical_records.all().order_by('-visit_date')
        return JsonResponse([record_to_dict(r) for r in records], safe=False)
        
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            doctor = get_object_or_404(Doctor, id=data.get('doctor_id'))
            record = MedicalRecord.objects.create(
                patient=patient,
                doctor=doctor,
                symptoms=data.get('symptoms', ''),
                diagnosis=data.get('diagnosis'),
                prescription=data.get('prescription')
            )
            return JsonResponse(record_to_dict(record), status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def api_appointments(request):
    """List or book appointments."""
    if request.method == 'GET':
        status_filter = request.GET.get('status')
        patient_id = request.GET.get('patient')
        doctor_id = request.GET.get('doctor')
        
        appointments = Appointment.objects.all()
        if status_filter:
            appointments = appointments.filter(status=status_filter)
        if patient_id:
            appointments = appointments.filter(patient_id=patient_id)
        if doctor_id:
            appointments = appointments.filter(doctor_id=doctor_id)
            
        appointments = appointments.order_by('-appointment_date', '-appointment_time')
        return JsonResponse([appointment_to_dict(a) for a in appointments], safe=False)
        
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            patient = get_object_or_404(Patient, id=data.get('patient_id'))
            doctor = get_object_or_404(Doctor, id=data.get('doctor_id'))
            
            appt_date = date.fromisoformat(data.get('appointment_date'))
            appt_time = datetime.strptime(data.get('appointment_time'), "%H:%M").time()
            
            appointment = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                appointment_date=appt_date,
                appointment_time=appt_time,
                reason=data.get('reason'),
                status=data.get('status', 'Scheduled')
            )
            return JsonResponse(appointment_to_dict(appointment), status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def api_appointment_status(request, pk):
    """Update appointment status."""
    appointment = get_object_or_404(Appointment, pk=pk)
    
    if request.method in ['POST', 'PATCH', 'PUT']:
        try:
            data = json.loads(request.body)
            status = data.get('status')
            if status in dict(Appointment.STATUS_CHOICES):
                appointment.status = status
                appointment.save()
                return JsonResponse(appointment_to_dict(appointment))
            else:
                return JsonResponse({'error': 'Invalid status'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)
