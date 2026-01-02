from rest_framework import viewsets, permissions, serializers
from .models import Interview, JobApplication
from .serializers import InterviewSerializer


class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter interviews by the current user's job applications
        return Interview.objects.filter(job__user=self.request.user)

    def perform_create(self, serializer):
        # Get the job ID from the validated data
        job_id = serializer.validated_data.get('job')
        if not job_id:
            raise serializers.ValidationError("Job application is required for an interview.")

        try:
            # Ensure the job application belongs to the current user
            job_application = JobApplication.objects.get(id=job_id, user=self.request.user)
        except JobApplication.DoesNotExist:
            raise serializers.ValidationError("The selected job application does not belong to the current user.")
        
        # Save the interview, associating it with the validated job application
        serializer.save(job=job_application)
