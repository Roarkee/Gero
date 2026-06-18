from .paystack import PaystackProcessor

class PaymentProcessorFactory:

    PROCESSORS =  {
            "paystack": PaystackProcessor
        }

    @classmethod
    def get_processor(cls,provider_type):
       
        processor = cls.PROCESSORS.get(provider_type)

        if not processor:
            raise ValueError(f"unsupported type {provider_type}")
        
        return processor()