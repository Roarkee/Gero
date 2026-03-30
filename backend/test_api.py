import urllib.request
import json

def test_api():
    try:
        # Login
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/users/login/", 
            data=json.dumps({"email": "chris@example.com", "password": "password"}).encode("utf-8"), 
            headers={"Content-Type": "application/json"}
        )
        res = urllib.request.urlopen(req)
        token = json.loads(res.read())["access"]
        
        # Get Clients
        req2 = urllib.request.Request(
            "http://127.0.0.1:8000/api/client/", 
            headers={"Authorization": f"Bearer {token}"}
        )
        res2 = urllib.request.urlopen(req2)
        print("STATUS:", res2.status)
        print("DATA:", res2.read().decode('utf-8'))
    except Exception as e:
        print("ERROR:", str(e))
        if hasattr(e, 'read'):
            print("BODY:", e.read().decode('utf-8'))

test_api()
