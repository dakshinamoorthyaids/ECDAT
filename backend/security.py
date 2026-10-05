import hashlib
import hmac
import os
import base64

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from dotenv import load_dotenv


# =========================================================
# LOAD .ENV
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(
    dotenv_path=ENV_PATH,
    override=True,
)


# =========================================================
# SHA-256 HASH
# =========================================================

def calculate_sha256(file_path: str) -> str:
    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:
        while chunk := file.read(4096):
            sha256.update(chunk)

    return sha256.hexdigest()


# =========================================================
# HMAC-SHA256
# =========================================================

def calculate_hmac(data: str | bytes) -> str:

    secret_key = os.getenv("HMAC_SECRET_KEY")

    if not secret_key:
        raise ValueError(
            "HMAC-SHA256 key is not configured."
        )

    message = (
        data.encode()
        if isinstance(data, str)
        else data
    )

    return hmac.new(
        secret_key.encode(),
        message,
        digestmod="sha256"
    ).hexdigest()


# =========================================================
# AES-256 KEY GENERATION
# =========================================================

def generate_aes_key() -> bytes:

    secret_key = os.getenv("AES_SECRET_KEY")

    if not secret_key:
        raise ValueError(
            "AES_SECRET_KEY is not configured."
        )

    try:

        key = base64.urlsafe_b64decode(secret_key)

        if len(key) != 32:
            raise ValueError

        return key

    except Exception:

        raise ValueError(
            "AES_SECRET_KEY must be a valid "
            "base64-encoded 32-byte key."
        )


# =========================================================
# AES-256 ENCRYPTION
# =========================================================

def encrypt_data(
    data: bytes,
    key: bytes
) -> tuple[bytes, bytes]:

    if len(key) != 32:
        raise ValueError(
            "AES-256 key must be exactly 32 bytes."
        )

    iv = os.urandom(16)

    padding_length = 16 - (len(data) % 16)

    padded_data = (
        data
        + bytes([padding_length]) * padding_length
    )

    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv)
    )

    encryptor = cipher.encryptor()

    encrypted_data = (
        encryptor.update(padded_data)
        + encryptor.finalize()
    )

    # IV + ciphertext
    stored_data = iv + encrypted_data

    return stored_data, iv


# =========================================================
# AES-256 DECRYPTION
# =========================================================

def decrypt_data(
    encrypted_data: bytes,
    iv: bytes,
    key: bytes
) -> bytes:

    if len(key) != 32:
        raise ValueError(
            "AES-256 key must be exactly 32 bytes."
        )

    if len(iv) != 16:
        raise ValueError(
            "AES-CBC IV must be exactly 16 bytes."
        )

    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv)
    )

    decryptor = cipher.decryptor()

    padded_data = (
        decryptor.update(encrypted_data)
        + decryptor.finalize()
    )

    if not padded_data:
        raise ValueError(
            "Decryption failed: empty data."
        )

    padding_length = padded_data[-1]

    if padding_length < 1 or padding_length > 16:
        raise ValueError(
            "Invalid padding."
        )

    if padded_data[-padding_length:] != (
        bytes([padding_length]) * padding_length
    ):
        raise ValueError(
            "Invalid padding."
        )

    return padded_data[:-padding_length]