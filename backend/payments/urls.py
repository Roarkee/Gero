import paystack
from pprint import pprint

paystack.api_key = 'sk_test_f37db57a95ab65cb701ac08dcca4a3e6f2e82c02'

# response = paystack.Customer.create(
#         email="larry@james.com",
#         first_name="Larry",
#         last_name="James"
#     )
response=paystack.Transaction.initialize(email="rikkardambrose0@gmail.com",amount=800)
pprint(response)