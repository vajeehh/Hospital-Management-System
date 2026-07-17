from django.urls import path
from . import views, api_views

urlpatterns = [
    # Legacy HTML views
    path('', views.dashboard, name='dashboard'),
    path('doctors/', views.doctor_list, name='doctor_list'),
    path('doctors/<int:pk>/', views.doctor_detail, name='doctor_detail'),
    path('patients/', views.patient_list, name='patient_list'),
    path('patients/<int:pk>/', views.patient_detail, name='patient_detail'),
    path('patients/add/', views.patient_add, name='patient_add'),
    path('patients/<int:pk>/edit/', views.patient_edit, name='patient_edit'),
    path('patients/<int:pk>/record/add/', views.patient_add_record, name='patient_add_record'),
    path('appointments/', views.appointment_list, name='appointment_list'),
    path('appointments/book/', views.appointment_book, name='appointment_book'),
    path('appointments/<int:pk>/status/', views.appointment_update_status, name='appointment_update_status'),

    # React JSON APIs
    path('api/dashboard/', api_views.api_dashboard, name='api_dashboard'),
    path('api/departments/', api_views.api_departments, name='api_departments'),
    path('api/doctors/', api_views.api_doctors, name='api_doctors'),
    path('api/doctors/<int:pk>/', api_views.api_doctor_detail, name='api_doctor_detail'),
    path('api/patients/', api_views.api_patients, name='api_patients'),
    path('api/patients/<int:pk>/', api_views.api_patient_detail, name='api_patient_detail'),
    path('api/patients/<int:pk>/records/', api_views.api_patient_records, name='api_patient_records'),
    path('api/appointments/', api_views.api_appointments, name='api_appointments'),
    path('api/appointments/<int:pk>/status/', api_views.api_appointment_status, name='api_appointment_status'),
]
