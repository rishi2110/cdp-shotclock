# Deploying Cursor Poker Shot Clock on Local Network

## Prerequisites
- Nginx is installed on your machine
- DNS for cdpshotclock.com is configured in Pi-hole to point to your local machine
- Node.js and npm are installed

## Deployment Steps

1. **Clone or update your project**
   - Make sure your code is up to date on your deployment machine.

2. **Run the deployment script**
   ```sh
   ./deploy.sh
   ```
   - This will:
     - Kill any old backend server and Nginx processes
     - Delete old session data, logs, and build artifacts
     - Build the React app (output to `dist/`) and backend server
     - Copy the correct Nginx config (with backend proxying) to the Nginx config location
     - Start the backend server in the background
     - Start Nginx
     - Print a success message if deployment is successful

3. **Access the app**
   - On any device on your local network, visit:  
     `http://cdpshotclock.com`

## Troubleshooting
- If you don’t see your app:
  - Ensure the DNS for `cdpshotclock.com` is set to your local machine’s IP in Pi-hole
  - Check that the `dist/` folder exists and contains `index.html`
  - Check backend logs: `backend.log` in the project root
  - Check Nginx error logs:
    - macOS/Homebrew: `/opt/homebrew/var/log/nginx/error.log`
    - Linux: `/var/log/nginx/error.log`
  - Make sure your firewall allows connections on port 80
- To manually test Nginx config:
  ```sh
  sudo nginx -t
  ```
- To manually reload Nginx:
  ```sh
  sudo nginx -s reload
  ```
- To stop the backend server:
  ```sh
  kill $(cat backend.pid)
  ```

## Notes
- The script will overwrite your Nginx config at `/opt/homebrew/etc/nginx/nginx.conf`. Backup if you have custom settings.
- For backend/API proxying or HTTPS, further configuration is needed.
- The backend server runs in the background and logs to `backend.log`. 

## Environment Configuration

Before running or deploying, create a `.env` file in the project root with the following variables:

```
VITE_API_BASE=http://localhost:3001
VITE_APP_DOMAIN=cdpshotclock.local
PROJECT_ROOT=/path/to/your/project
```

Replace `/path/to/your/project` and domain as needed for your environment. 