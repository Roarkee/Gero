def generate_reference():
    import uuid #unique universal identifier don't forget the acronym
    #i'm using timezone for time aware
    from django.utils import timezone#this is for correect time in different regions
    #my reference format is PI-yyyymmdd-hhmm-uuid(first 8 chars)
    return f'PI-{timezone.now().strftime("%Y%m%d-%H%M")}-{uuid.uuid4().hex[:8]}'


