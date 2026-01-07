import sys
import requests

def test_setup():
    # 1. Check Python Version
    print(f"🐍 Python Version: {sys.version.split()[0]}")
    
    # 2. Check Library Installation
    try:
        response = requests.get("https://api.github.com/zen")
        print(f"🚀 Library Works! GitHub says: {response.text}")
    except Exception as e:
        print(f"❌ Library Error: {e}")

if __name__ == "__main__":
    test_setup()