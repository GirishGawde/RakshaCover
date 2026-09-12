import qrcode
import base64
from io import BytesIO
from PIL import Image

def generate_base64_qr(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def generate_garbage_base64() -> str:
    # Generate a plain image with no QR
    img = Image.new('RGB', (100, 100), color = 'red')
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

if __name__ == "__main__":
    upi_qr = generate_base64_qr("upi://pay?pa=scammer123@paytm&pn=Merchant&am=500")
    url_qr = generate_base64_qr("https://sbi-ekyc-verify.com/login")
    garbage_img = generate_garbage_base64()
    
    with open("test_upi_qr.txt", "w") as f:
        f.write(upi_qr)
        
    with open("test_url_qr.txt", "w") as f:
        f.write(url_qr)
        
    with open("test_garbage_img.txt", "w") as f:
        f.write(garbage_img)
        
    print("Generated base64 test images: test_upi_qr.txt, test_url_qr.txt, test_garbage_img.txt")
