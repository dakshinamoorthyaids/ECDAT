import hashlib
import hmac
import os

from security import calculate_hmac

test_data = "This is a test digital evidence file."
secret_key = os.environ["HMAC_SECRET_KEY"]

hmac_value = calculate_hmac(test_data)
expected_hmac = hmac.new(
	secret_key.encode(),
	test_data.encode(),
	digestmod=hashlib.sha256,
).hexdigest()

assert hmac.compare_digest(hmac_value, expected_hmac), "HMAC did not match the expected digest."

print("HMAC-SHA256: SUCCESS")