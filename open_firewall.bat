@echo off
echo Opening firewall for Expo (8081) and Backend (3000)...
netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="iChef Backend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Vite Frontend" dir=in action=allow protocol=TCP localport=5173
echo.
echo Done! Firewall rules added.
pause
