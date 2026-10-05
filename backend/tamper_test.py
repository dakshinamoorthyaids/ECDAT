import os
import sys
import json
import zipfile
import mimetypes

from PIL import Image, ImageDraw, ImageFont

from security import (
    generate_aes_key,
    decrypt_data,
    encrypt_data,
)


# =========================================================
# SETTINGS
# =========================================================

EVIDENCE_ID = "EVD-644E2B02"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

STORAGE_DIR = os.path.join(
    BASE_DIR,
    "storage",
)

ORIGINAL_DIR = os.path.join(
    STORAGE_DIR,
    "original",
)

CURRENT_DIR = os.path.join(
    STORAGE_DIR,
    "current",
)


# =========================================================
# FIND ORIGINAL EVIDENCE
# =========================================================

matching_files = []

for filename in os.listdir(ORIGINAL_DIR):

    if filename.startswith(
        EVIDENCE_ID + "_"
    ):

        full_path = os.path.join(
            ORIGINAL_DIR,
            filename,
        )

        if os.path.isfile(full_path):
            matching_files.append(filename)


if not matching_files:

    print("❌ Original evidence file not found")
    print("Evidence ID:", EVIDENCE_ID)
    sys.exit(1)


filename = matching_files[0]

original_path = os.path.join(
    ORIGINAL_DIR,
    filename,
)

current_path = os.path.join(
    CURRENT_DIR,
    filename,
)


print()
print("==========================================")
print("        SECURE EVIDENCE TAMPER TEST")
print("==========================================")
print()

print("Evidence :", EVIDENCE_ID)
print("File     :", filename)

extension = os.path.splitext(
    filename
)[1].lower()

print("Extension:", extension)

mime_type, _ = mimetypes.guess_type(
    filename
)

print("MIME     :", mime_type)

print()


# =========================================================
# READ ORIGINAL ENCRYPTED FILE
# =========================================================

with open(
    original_path,
    "rb",
) as file:

    stored_data = file.read()


print(
    "Original encrypted size:",
    len(stored_data),
)


# =========================================================
# EXTRACT IV + CIPHERTEXT
# =========================================================

if len(stored_data) <= 16:

    print(
        "❌ Invalid encrypted evidence file"
    )

    sys.exit(1)


iv = stored_data[:16]

encrypted_data = stored_data[16:]


if len(encrypted_data) == 0:

    print(
        "❌ Encrypted data is empty"
    )

    sys.exit(1)


if len(encrypted_data) % 16 != 0:

    print(
        "❌ Invalid encrypted data length"
    )

    sys.exit(1)


# =========================================================
# GET AES KEY
# =========================================================

try:

    aes_key = generate_aes_key()

except Exception as error:

    print("❌ Unable to generate AES key")
    print(error)

    sys.exit(1)


# =========================================================
# DECRYPT ORIGINAL
# =========================================================

try:

    original_data = decrypt_data(
        encrypted_data,
        iv,
        aes_key,
    )

except Exception as error:

    print()
    print("❌ Decryption failed")
    print(error)
    print()

    print(
        "Check that the AES key in .env matches"
    )

    sys.exit(1)


print(
    "✅ Original evidence decrypted"
)


# =========================================================
# TAMPER FUNCTIONS
# =========================================================


def tamper_image(data: bytes) -> bytes:

    """
    Modify an image visibly.
    Adds a red rectangle and TAMPERED text.
    """

    temp_path = os.path.join(
        STORAGE_DIR,
        "_tamper_temp_image",
    )

    try:

        with open(
            temp_path,
            "wb",
        ) as file:

            file.write(data)


        image = Image.open(
            temp_path
        )

        # Preserve a normal RGB/RGBA image
        if image.mode not in (
            "RGB",
            "RGBA",
        ):

            image = image.convert(
                "RGB"
            )


        draw = ImageDraw.Draw(
            image
        )

        width, height = image.size


        # Rectangle size
        rectangle_width = max(
            100,
            width // 3,
        )

        rectangle_height = max(
            80,
            height // 4,
        )


        left = (
            width - rectangle_width
        ) // 2

        top = (
            height - rectangle_height
        ) // 2

        right = (
            left + rectangle_width
        )

        bottom = (
            top + rectangle_height
        )


        # Red rectangle
        draw.rectangle(
            [
                left,
                top,
                right,
                bottom,
            ],
            outline="red",
            width=max(
                5,
                width // 100,
            ),
        )


        # Text
        text = "TAMPERED"


        try:

            font = ImageFont.truetype(
                "arial.ttf",
                max(
                    30,
                    width // 20,
                ),
            )

        except Exception:

            font = ImageFont.load_default()


        draw.text(
            (
                left + 20,
                top + 20,
            ),
            text,
            fill="red",
            font=font,
        )


        # Save using original format
        original_format = image.format

        if not original_format:

            original_format = (
                "PNG"
            )


        image.save(
            temp_path,
            format=original_format,
        )


        with open(
            temp_path,
            "rb",
        ) as file:

            modified_data = file.read()


        return modified_data


    finally:

        if os.path.exists(
            temp_path
        ):

            try:
                os.remove(
                    temp_path
                )
            except Exception:
                pass


# =========================================================
# TEXT TAMPER
# =========================================================

def tamper_text(data: bytes) -> bytes:

    """
    Modify TXT content.
    """

    try:

        text = data.decode(
            "utf-8"
        )

    except UnicodeDecodeError:

        text = data.decode(
            "utf-8",
            errors="replace",
        )


    text += (
        "\n\n"
        "--------------------------------\n"
        "TAMPERED TEST DATA\n"
        "--------------------------------\n"
    )


    return text.encode(
        "utf-8"
    )


# =========================================================
# JSON TAMPER
# =========================================================

def tamper_json(data: bytes) -> bytes:

    """
    Modify JSON while keeping it valid JSON.
    """

    try:

        obj = json.loads(
            data.decode("utf-8")
        )

    except Exception:

        return tamper_text(
            data
        )


    if isinstance(
        obj,
        dict,
    ):

        obj[
            "_tampered_test"
        ] = True

        obj[
            "_tampered_message"
        ] = "TAMPERED TEST DATA"


    elif isinstance(
        obj,
        list,
    ):

        obj.append(
            {
                "_tampered_test": True,
                "_tampered_message": (
                    "TAMPERED TEST DATA"
                ),
            }
        )


    return json.dumps(
        obj,
        indent=4,
        ensure_ascii=False,
    ).encode("utf-8")


# =========================================================
# PDF TAMPER
# =========================================================

def tamper_pdf(data: bytes) -> bytes:

    """
    Add a PDF comment marker at the end.

    The original PDF is never modified.
    """

    marker = (
        b"\n"
        b"% TAMPERED TEST DATA\n"
    )

    return data + marker


# =========================================================
# MEDIA TAMPER
# =========================================================

def tamper_media(data: bytes) -> bytes:

    """
    Add a marker to the end of MP4/MP3 data.

    This changes the file content and therefore
    SHA/HMAC will fail.
    """

    marker = (
        b"\n"
        b"TAMPERED_TEST_DATA"
    )

    return data + marker


# =========================================================
# ZIP / DOCX TAMPER
# =========================================================

def tamper_zip(data: bytes) -> bytes:

    """
    Add a harmless extra file inside ZIP/DOCX.
    """

    input_path = os.path.join(
        STORAGE_DIR,
        "_tamper_input.zip",
    )

    output_path = os.path.join(
        STORAGE_DIR,
        "_tamper_output.zip",
    )


    try:

        with open(
            input_path,
            "wb",
        ) as file:

            file.write(data)


        with zipfile.ZipFile(
            input_path,
            "r",
        ) as source_zip:

            with zipfile.ZipFile(
                output_path,
                "w",
                compression=zipfile.ZIP_DEFLATED,
            ) as output_zip:

                for item in source_zip.infolist():

                    output_zip.writestr(
                        item,
                        source_zip.read(
                            item.filename
                        ),
                    )


                output_zip.writestr(
                    "TAMPERED_TEST.txt",
                    (
                        "This file was added "
                        "during tampering test."
                    ),
                )


        with open(
            output_path,
            "rb",
        ) as file:

            modified_data = file.read()


        return modified_data


    finally:

        for temp_file in (
            input_path,
            output_path,
        ):

            if os.path.exists(
                temp_file
            ):

                try:
                    os.remove(
                        temp_file
                    )
                except Exception:
                    pass


# =========================================================
# GENERIC BINARY TAMPER
# =========================================================

def tamper_binary(data: bytes) -> bytes:

    """
    Generic binary tamper.

    Adds data to the end of the file.
    """

    marker = (
        b"\n"
        b"SECURE_EVIDENCE_TAMPER_TEST"
    )

    return data + marker


# =========================================================
# SELECT TAMPER METHOD
# =========================================================

try:

    print()
    print("Tampering file...")


    # -----------------------------------------------------
    # IMAGE
    # -----------------------------------------------------

    if extension in (
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".bmp",
        ".gif",
    ):

        modified_data = tamper_image(
            original_data
        )

        print(
            "✅ Image visibly modified"
        )


    # -----------------------------------------------------
    # TEXT
    # -----------------------------------------------------

    elif extension in (
        ".txt",
        ".csv",
        ".log",
    ):

        modified_data = tamper_text(
            original_data
        )

        print(
            "✅ Text content modified"
        )


    # -----------------------------------------------------
    # JSON
    # -----------------------------------------------------

    elif extension == ".json":

        modified_data = tamper_json(
            original_data
        )

        print(
            "✅ JSON content modified"
        )


    # -----------------------------------------------------
    # PDF
    # -----------------------------------------------------

    elif extension == ".pdf":

        modified_data = tamper_pdf(
            original_data
        )

        print(
            "✅ PDF tamper marker added"
        )


    # -----------------------------------------------------
    # MP4 / MP3
    # -----------------------------------------------------

    elif extension in (
        ".mp4",
        ".mp3",
        ".wav",
        ".m4a",
        ".webm",
        ".avi",
    ):

        modified_data = tamper_media(
            original_data
        )

        print(
            "✅ Media file modified"
        )


    # -----------------------------------------------------
    # ZIP / DOCX
    # -----------------------------------------------------

    elif extension in (
        ".zip",
        ".docx",
    ):

        modified_data = tamper_zip(
            original_data
        )

        print(
            "✅ Archive/document modified"
        )


    # -----------------------------------------------------
    # EVERYTHING ELSE
    # -----------------------------------------------------

    else:

        modified_data = tamper_binary(
            original_data
        )

        print(
            "✅ Binary file modified"
        )


except Exception as error:

    print()
    print("❌ Tampering failed")
    print(error)

    sys.exit(1)


# =========================================================
# CHECK MODIFIED DATA
# =========================================================

if modified_data == original_data:

    print()
    print(
        "❌ Tampering did not change the file"
    )

    sys.exit(1)


print(
    "Original plaintext size:",
    len(original_data),
)

print(
    "Modified plaintext size:",
    len(modified_data),
)


# =========================================================
# ENCRYPT MODIFIED DATA
# =========================================================

try:

    new_stored_data, new_iv = encrypt_data(
        modified_data,
        aes_key,
    )

except Exception as error:

    print()
    print("❌ Encryption failed")
    print(error)

    sys.exit(1)


# =========================================================
# SAVE MODIFIED FILE TO CURRENT
# =========================================================

try:

    with open(
        current_path,
        "wb",
    ) as file:

        file.write(
            new_stored_data
        )

except Exception as error:

    print()
    print(
        "❌ Could not save modified file"
    )

    print(error)

    sys.exit(1)


# =========================================================
# FINAL RESULT
# =========================================================

print()

print(
    "✅ Modified encrypted file saved:"
)

print(
    current_path
)

print()

print("==========================================")
print("       🎯 TAMPERING TEST COMPLETED")
print("==========================================")

print()

print(
    "Evidence ID:",
    EVIDENCE_ID,
)

print(
    "File:",
    filename,
)

print()

print("Expected verification result:")

print(
    "SHA-256 → MISMATCH"
)

print(
    "HMAC     → MISMATCH"
)

print(
    "Status   → Tampered"
)

print()

print(
    "Next:"
)

print(
    "1. Open Verification page"
)

print(
    "2. Enter:",
    EVIDENCE_ID,
)

print(
    "3. Click Verify"
)

print(
    "4. Click View Preserved Tampered File"
)

print()