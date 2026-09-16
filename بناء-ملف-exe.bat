@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title بناء تطبيق أسامة كاشير - Osama POS (.exe)

echo ================================================================
echo        أداة بناء برنامج أسامة كاشير (Osama POS) إلى ملف EXE
echo ================================================================
echo.

:: التحقق من وجود Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطأ قاتل] Node.js غير مثبت على جهازك!
    echo يرجى تحميل وتثبيت Node.js أولاً من الموقع الرسمي: https://nodejs.org
    echo ثم أعد تشغيل هذا الملف مجدداً.
    echo.
    pause
    exit /b 1
)

echo [1/4] التحقق من بيئة العمل وإصدار Node.js...
node -v
npm -v
echo.

:: تثبيت الحزم إذا لم تكن موجودة
if not exist node_modules (
    echo [2/4] جاري تثبيت الحزم والمكتبات (npm install)...
    echo يرجى الانتظار، قد يستغرق هذا دقيقتين في المرة الأولى...
    call npm install
    if %errorlevel% neq 0 (
        echo [خطأ] فشل أمر npm install! يرجى التأكد من اتصال الإنترنت.
        pause
        exit /b 1
    )
) else (
    echo [2/4] الحزم مثبتة بالفعل (node_modules موجودة).
)

echo.
echo [3/4] جاري بناء ملفات التطبيق (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo [خطأ] فشل بناء ملفات الواجهة (npm run build)!
    pause
    exit /b 1
)

echo.
echo [4/4] جاري توليد وتغليف ملف التثبيت (.exe) عبر electron-builder...
echo يرجى الانتظار حتى ينتهي التغليف...
call npx electron-builder --win
if %errorlevel% neq 0 (
    echo.
    echo [تنبيه] حدث خطأ أثناء التغليف عبر npx electron-builder!
    echo جاري محاولة التوليد عبر npm run dist...
    call npm run dist
    if %errorlevel% neq 0 (
        echo [خطأ] تعذر إنشاء ملف الـ exe. تفقد سجل الأخطاء بالأعلى.
        pause
        exit /b 1
    )
)

echo.
echo ================================================================
echo ✅ تم إنشاء ملف التثبيت بنجاح تام!
echo 📁 ستجد ملف الـ exe داخل المجلد: release
echo ================================================================
echo.

:: فتح مجلد release تلقائياً للمستخدم
if exist release (
    start release
)

pause

