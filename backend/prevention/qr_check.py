"""
qr_check.py
Decodes QR codes using pyzbar. Identifies if the content is a UPI string or a URL.
Validates VPA format against known PSP handles.
Part of the algorithm specs (Rule 5).
"""
import io
import base64
from urllib.parse import urlparse, parse_qs
from pyzbar.pyzbar import decode
from PIL import Image

# A list of known valid PSP handles in India (mocked/subset for hackathon)
VALID_PSP_HANDLES = {
    'okicici', 'okaxis', 'okhdfcbank', 'oksbi', 'paytm', 'ybl', 'ibl', 'axl', 
    'apl', 'upi', 'sbi', 'icici'
}

def decode_qr_image(image_base64: str) -> str:
    """
    Decodes a base64 encoded image and returns the QR string data.
    """
    try:
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        decoded_objects = decode(image)
        if not decoded_objects:
            return None
        return decoded_objects[0].data.decode('utf-8')
    except Exception as e:
        print(f"Failed to decode QR image: {e}")
        return None

def parse_qr_data(qr_string: str) -> dict:
    """
    Parses the raw QR string. Returns type ('upi', 'url', 'unknown') and associated data.
    """
    if not qr_string:
        return {"type": "unknown", "vpa": None, "url": None}

    qr_string_lower = qr_string.lower()
    
    if qr_string_lower.startswith('upi://'):
        # Parse UPI string
        parsed = urlparse(qr_string)
        qs = parse_qs(parsed.query)
        vpa = qs.get('pa', [None])[0]
        
        return {
            "type": "upi",
            "vpa": vpa,
            "url": None,
            "raw": qr_string
        }
    elif qr_string_lower.startswith('http://') or qr_string_lower.startswith('https://'):
        return {
            "type": "url",
            "vpa": None,
            "url": qr_string,
            "raw": qr_string
        }
    else:
        return {
            "type": "unknown",
            "vpa": None,
            "url": None,
            "raw": qr_string
        }

def validate_vpa(vpa: str) -> dict:
    """
    Validates a VPA format (name@handle) against known PSP handles.
    """
    if not vpa or '@' not in vpa:
        return {"flagged": True, "score": 100, "detail": "Invalid VPA format"}
        
    parts = vpa.split('@')
    if len(parts) != 2:
        return {"flagged": True, "score": 100, "detail": "Multiple @ in VPA"}
        
    handle = parts[1].lower()
    if handle not in VALID_PSP_HANDLES:
        return {"flagged": True, "score": 50, "detail": f"Unrecognized PSP handle: @{handle}"}
        
    return {"flagged": False, "score": 0, "detail": f"Valid PSP handle: @{handle}"}
