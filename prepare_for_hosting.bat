@echo off
echo ========================================
echo   تحضير الموقع للرفع على الاستضافة
echo ========================================
echo.

REM Create deployment folder
if exist "deployment" rmdir /s /q "deployment"
mkdir "deployment"

echo [1/5] نسخ الملفات الأساسية...
copy "index.html" "deployment\" >nul
copy "admin.html" "deployment\" >nul
copy "firebase-messaging-sw.js" "deployment\" >nul
copy "robots.txt" "deployment\" >nul
copy "sitemap.xml" "deployment\" >nul
copy ".htaccess" "deployment\" >nul
copy ".nojekyll" "deployment\" >nul 2>nul

echo [2/5] نسخ مجلد CSS...
xcopy "css" "deployment\css\" /E /I /Y >nul

echo [3/5] نسخ مجلد JavaScript...
xcopy "js" "deployment\js\" /E /I /Y >nul

echo [4/5] نسخ مجلد الصور...
xcopy "images" "deployment\images\" /E /I /Y >nul

echo [5/5] إنشاء ملف ZIP...
powershell -command "Compress-Archive -Path 'deployment\*' -DestinationPath 'موقع_ديزل_جاهز_للرفع.zip' -Force"

echo.
echo ========================================
echo   ✅ تم التحضير بنجاح!
echo ========================================
echo.
echo الملف الجاهز: موقع_ديزل_جاهز_للرفع.zip
echo.
echo خطوات الرفع:
echo 1. افتح لوحة تحكم الاستضافة (cPanel)
echo 2. اذهب إلى File Manager
echo 3. ارفع الملف ZIP في مجلد public_html
echo 4. فك الضغط (Extract)
echo 5. احذف ملف ZIP
echo.
echo ملاحظة: لا ترفع ملف serviceAccountKey.json!
echo.
pause
