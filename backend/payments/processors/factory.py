from ..services.paystack_service import PaystackProcessor

class PaymentProcessorFactory:

    PROCESSORS =  {
            "paystack": PaystackProcessor
        }

    @classmethod
    def get_processor(cls, provider):
        """
        provider is an instance of PaymentProvider
        """
        processor_class = cls.PROCESSORS.get(provider.provider)

        if not processor_class:
            raise ValueError(f"unsupported type {provider.provider}")
        
        return processor_class(provider)