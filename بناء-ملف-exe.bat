@echo off
chcp 65001 > nul
echo ===================================================
echo     تحويل Osama Pos إلى برنامج تنفيذي (.exe)
echo ===================================================
echo.

if not exist node_modules (
    echo [1/4] جاري تثبيت الحزم الأساسية...
    call npm install
)

echo [2/4] تثبيت أدوات ديسكتوب Electron...
call npm install --save-dev electron electron-builder

echo [3/4] بناء ملفات واجهة المستخدم...
call npm run build

echo [4/4] إنشاء ملف التثبيت .exe...
call npx electron-builder --win

echo.
echo ✅ تم الانتهاء بنجاح! ستجد ملف الـ exe داخل مجلد release
echo.
pause
