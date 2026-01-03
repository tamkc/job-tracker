from rest_framework import viewsets, permissions, serializers
from django_filters.rest_framework import DjangoFilterBackend
from .models import Interview, JobApplication
from .serializers import InterviewSerializer


class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["job"]

    def get_queryset(self):
        # Filter interviews by the current user's job applications
        return Interview.objects.filter(job__user=self.request.user)

    def perform_create(self, serializer):
        # Get the job ID from the validated data
        # Check if 'job' is in validated_data (it might be a JobApplication object already if DRF parsed it)
        # However, because we are using primary key related field likely (default), it might be the object.
        # But wait, perform_create is called after validation.

        # Actually, let's look at how we pass 'job'.
        # If we pass job ID, the serializer (ModelSerializer) will try to resolve it.
        # We need to ensure the resolved job belongs to the user.

        job_instance = serializer.validated_data.get("job")

        if not job_instance:
            # This might happen if 'job' is not required in serializer, but it usually is for ModelSerializer FK.
            # If it is required, validation would have failed before this.
            pass

        if job_instance.user != self.request.user:
            raise serializers.ValidationError(
                "The selected job application does not belong to the current user."
            )

        serializer.save()
