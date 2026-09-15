@echo off
chcp 65001 > nul
echo ===================================================
echo     تشغيل برنامج Osama Pos - نقطة البيع ديسكتوب
echo ===================================================
echo.

if not exist node_modules (
    echo [1/3] جاري تثبيت الحزم الأساسية لأول مرة...
    call npm install
)

echo [2/3] جاري تشغيل خادم البرنامج المحلي...
start /b npx vite --port 3000 --host 127.0.0.1 > nul 2>&1

timeout /t 2 /nobreak > nul

echo [3/3] جاري فتح البرنامج في نافذة سطح المكتب...
start msedge --app=http://127.0.0.1:3000 || start chrome --app=http://127.0.0.1:3000 || start http://127.0.0.1:3000

echo.
echo ✅ البرنامج يعمل الآن محلياً على جهازك بدون إنترنت!
echo.
pause
