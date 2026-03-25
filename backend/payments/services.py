

#helper funtion to log audits
def log_audit(user, action, success=True, ip_address=None, user_agent=None, error_message='', details=None, webhook=None):
    from .models import PaymentAuditLog #this would help avoid circular imports which is unlikely mmom but still
    return PaymentAuditLog.objects.create(
        user=user,
        action=action,
        success=success, 
        ip_address=ip_address,
        user_agent=user_agent,
        error_message=error_message,
        details=details,
        webhook=webhook
    )