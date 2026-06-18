from abc import abstractmethod, ABC

class BasePaymentProcessor(ABC):
    @abstractmethod
    def initialize_payment(self, intent):
        pass

    @abstractmethod
    def verify_payment(self,ref):
        pass