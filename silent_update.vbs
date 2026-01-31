Set FSO = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
' الحصول على مسار المجلد الحالي للملف
scriptPath = FSO.GetParentFolderName(WScript.ScriptFullName)
batPath = scriptPath & "\update_report.bat"
' تشغيل ملف الباتش في الخلفية
WshShell.Run chr(34) & batPath & Chr(34), 0
Set WshShell = Nothing
Set FSO = Nothing
