import hashlib
import hmac
from pathlib import Path
import tempfile

from security import (
    calculate_hmac,
    calculate_sha256,
    encrypt_data,
    generate_aes_key,
)

test_data = b"This is a test digital evidence file."

with tempfile.TemporaryDirectory() as directory:
    file_path = Path(directory) / "evidence.bin"
    file_path.write_bytes(test_data)
    hash_value = calculate_sha256(str(file_path))

expected_hash = hashlib.sha256(test_data).hexdigest()
assert hash_value == expected_hash, "SHA-256 did not match the expected digest."

aes_key = generate_aes_key()
assert aes_key == generate_aes_key(), "AES key loading was not deterministic."

encrypted_data, _ = encrypt_data(test_data, aes_key)
encrypted_hmac = calculate_hmac(encrypted_data)

for offset in (0, 15, 16, len(encrypted_data) - 1):
    modified_data = bytearray(encrypted_data)
    modified_data[offset] ^= 1
    modified_hmac = calculate_hmac(bytes(modified_data))
    assert not hmac.compare_digest(encrypted_hmac, modified_hmac), (
        f"Encrypted-file tampering at byte {offset} was not detected."
    )

print("SHA-256: SUCCESS")
print("Encrypted-file tamper detection: SUCCESS")