# sup boys db_service is very easy to use, just go to /7.0_ft_transcendence and run docker compose up --build. two containers should pop up: 

1. postgres_db 
2. python_logic_hub 

1.is the actual db (mapped to port 5433) and 2. is the api layer to access the db (port 8000) in theory you shouldnt ever need to touch port 5433, just do restapi calls to 8000.

# example python code below on how to use the api:

```
from urllib import response
import requests
import json

# 1. define url
# if running on your host machine, use localhost:8000
# if running inside another container, use http://logic_hub:8000. remember to link containers in docker compose yml
BASE_URL = "http://localhost:8000"

# function to fetch all user info
def fetch_all_users():
    try:
        # 2. make request, in this case a GET to /users (check main.py api for available requests)
        response = requests.get(f"{BASE_URL}/users")
        
        # 3. check if request is successful (200)
        response.raise_for_status()
        
        # 4. parse json response
        users = response.json()
        
        print(f"✅ Successfully retrieved {len(users)} users:\n")
        print(json.dumps(users, indent=4))
        
        return users

    except requests.exceptions.HTTPError as err:
        print(f"❌ HTTP Error occurred: {err}")
    except Exception as err:
        print(f"❌ An error occurred: {err}")
        

# example 2, to update user profile
def update_profile(user_id):
    url = f"http://localhost:8000/users/{user_id}"
    
    # We only want to change the birthday and pic
    payload = {
        "date_of_birth": "1998-05-20T00:00:00",
        "profile_picture_url": "https://ayylmao.com/wesley_pro_pic.png"
    }

    response = requests.put(url, json=payload)
    
    if response.status_code == 200:
        print("✅ Profile Updated!")
        print(response.json())
    else:
        print(f"❌ Failed: {response.text}")

# example 3, create new user
def create_user(name, email):
    url = f"http://localhost:8000/users"
    
    payload = {
        "full_name": name,
        "email": email,
        }
    
    response = requests.post(url, json=payload)
    
    response.raise_for_status()

    if response.status_code == 200:
        print("✅ Profile created!")
        user_data = response.json()
        name = user_data.get("full_name")
        print("User created:" + name)
    else:
        print(f"❌ Failed: {response.text}")
    


if __name__ == "__main__":
    # update_profile(3)
    # create_user("bumser", "bumlol@gmail.com")
    fetch_all_users()
```
