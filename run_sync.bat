@echo off
echo ⏳ Starting Firebase Order Sync...
node sync_orders.js
echo.
echo ✅ Done! File "Orders_Database.xlsx" has been updated.
pause
