import os
from dotenv import load_dotenv
import requests
load_dotenv()
key = os.getenv('OPENROUTER_API_KEY')
if not key:
    print('NO_KEY')
    raise SystemExit(1)
try:
    r = requests.get('https://openrouter.ai/api/v1', headers={'Authorization': f'Bearer {key}'}, timeout=10)
    print(r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text[:200])
except Exception as e:
    print('ERR', e)
