from django.contrib import admin
from .models import JobApplication


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("company_name", "job_title", "status", "application_date")
    list_filter = ("status",)
    search_fields = ("company_name", "job_title")
