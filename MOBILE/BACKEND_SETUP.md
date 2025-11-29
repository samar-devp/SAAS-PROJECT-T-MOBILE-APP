# Backend Server Setup for Mobile App

## Problem
Backend server is only listening on `127.0.0.1:8000` (localhost only), so mobile devices can't connect.

## Solution

### For Django Backend:

1. **Run server on all network interfaces:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
   
   Instead of:
   ```bash
   python manage.py runserver  # This only listens on 127.0.0.1
   ```

2. **Or update settings.py to allow all hosts:**
   ```python
   ALLOWED_HOSTS = ['*']  # For development only
   # Or specific IPs:
   # ALLOWED_HOSTS = ['192.168.10.41', 'localhost', '127.0.0.1']
   ```

3. **Check Windows Firewall:**
   - Open Windows Defender Firewall
   - Allow port 8000 for incoming connections
   - Or temporarily disable firewall for testing

### Verify Server is Listening:

After starting server, check:
```bash
netstat -an | findstr :8000
```

You should see:
```
TCP    0.0.0.0:8000         0.0.0.0:0              LISTENING
```

Instead of:
```
TCP    127.0.0.1:8000         0.0.0.0:0              LISTENING  ❌
```

### Test Connection:

1. From your phone's browser, try:
   ```
   http://192.168.10.41:8000/api/login
   ```

2. From your computer's browser, try:
   ```
   http://192.168.10.41:8000/api/login
   ```

Both should work if server is configured correctly.

## Quick Fix:

1. Stop your current Django server (Ctrl+C)
2. Run: `python manage.py runserver 0.0.0.0:8000`
3. Verify with: `netstat -an | findstr :8000`
4. Test from phone browser: `http://192.168.10.41:8000/api/login`

