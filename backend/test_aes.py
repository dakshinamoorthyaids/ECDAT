from security import generate_aes_key, encrypt_data, decrypt_data


# Test data
original_data = b"This is confidential digital evidence."


# Generate AES-256 key
key = generate_aes_key()

print("AES Key Length:", len(key), "bytes")


# Encrypt
stored_data, iv = encrypt_data(
    original_data,
    key
)

encrypted_data = stored_data[len(iv):]

print("Encryption: SUCCESS")
print("Encrypted Data Length:", len(encrypted_data))
print("IV Length:", len(iv))


# Decrypt
decrypted_data = decrypt_data(
    encrypted_data,
    iv,
    key
)

assert decrypted_data == original_data, "AES round-trip did not preserve the original data."

print("Decryption: SUCCESS")
print("Decrypted Data:", decrypted_data.decode())