import requests
import json
import base64

def print_res(name, res):
    print(f"\n--- {name} ---")
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))

def test_api():
    base_url = "http://localhost:8001"
    
    # 1. Test /check/link
    print("Testing /check/link...")
    res1 = requests.post(f"{base_url}/check/link", json={"url": "https://sbi-ekyc-verify.com/login"})
    print_res("Dangerous Link", res1)
    
    res2 = requests.post(f"{base_url}/check/link", json={"url": "https://www.sbi.co.in/"})
    print_res("Safe Link", res2)
    
    res3 = requests.post(f"{base_url}/check/link", json={"url": "https://axisbank.com.verify-kyc.ru/"})
    print_res("Suspicious/Dangerous Link", res3)
    
    # 2. Test /check/qr
    print("\nTesting /check/qr...")
    with open("test_upi_qr.txt", "r") as f:
        upi_qr = f.read()
    with open("test_url_qr.txt", "r") as f:
        url_qr = f.read()
    with open("test_garbage_img.txt", "r") as f:
        garbage_qr = f.read()
        
    res4 = requests.post(f"{base_url}/check/qr", json={"qr_raw_data": "upi://pay?pa=merchant@okaxis&pn=Merchant&am=500"})
    print_res("QR Raw Data (UPI)", res4)
    
    res5 = requests.post(f"{base_url}/check/qr", json={"qr_raw_data": "https://sbi-ekyc-verify.com/login"})
    print_res("QR Raw Data (URL)", res5)
    
    res6 = requests.post(f"{base_url}/check/qr", json={"qr_image_base64": upi_qr})
    print_res("QR Image Base64 (UPI)", res6)
    
    res7 = requests.post(f"{base_url}/check/qr", json={"qr_image_base64": url_qr})
    print_res("QR Image Base64 (URL)", res7)
    
    res8 = requests.post(f"{base_url}/check/qr", json={"qr_image_base64": garbage_qr})
    print_res("QR Image Base64 (Garbage)", res8)
    
    # 3. Test /check/upi
    print("\nTesting /check/upi...")
    res9 = requests.post(f"{base_url}/check/upi", json={"vpa": "scammer123@paytm"})
    print_res("UPI Fallback Check", res9)

if __name__ == "__main__":
    test_api()
