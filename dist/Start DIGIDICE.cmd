@echo off
setlocal
set "dice_node=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%dice_node%" set "dice_node=node"
set "DIGIDICE_OPEN=1"
"%dice_node%" "%~dp0serve.cjs"
if errorlevel 1 pause
