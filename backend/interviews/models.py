from django.db import models
from jobs.models import JobApplication


class Interview(models.Model):
    INTERVIEW_TYPE_CHOICES = [
        ("phone", "Phone"),
        ("technical", "Technical"),
        ("onsite", "Onsite"),
    ]

    job = models.ForeignKey(
        JobApplication,
        related_name="interviews",
        on_delete=models.CASCADE,
    )

    interview_type = models.CharField(
        max_length=20,
        choices=INTERVIEW_TYPE_CHOICES,
    )

    date = models.DateTimeField()
    outcome = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.job.company} — {self.interview_type}"
