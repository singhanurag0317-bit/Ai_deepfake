import requests
import os

URL = "http://ml-service:5001/predict-image"

# Create a small dummy image for testing
img_path = "/tmp/test.jpg"
import numpy as np
import cv2
dummy_img = np.zeros((256, 256, 3), dtype=np.uint8)
cv2.imwrite(img_path, dummy_img)

try:
    # We call with a path that exists inside the container
    # Since ml-service doesn't have /tmp/ mapped to the backend, 
    # we should check one of the existing shared volumes: /app/uploads
    # Wait, the volumes in docker-compose:
    # ml-service has backend_uploads:/app/uploads
    # backend has backend_uploads:/app/uploads
    
    # Let's move the dummy image to /app/uploads/test_verify.jpg
    final_path = "/app/uploads/test_verify.jpg"
    cv2.imwrite(final_path, dummy_img)
    
    print(f"Testing with image: {final_path}")
    response = requests.post(URL, json={"filepath": final_path})
    print("Response Status:", response.status_code)
    print("Response Data:", response.json())
except Exception as e:
    print("Error during verification:", str(e))
