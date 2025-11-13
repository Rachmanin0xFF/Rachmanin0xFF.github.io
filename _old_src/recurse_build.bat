@echo off
echo Live rebuilding active!
:loop
node index
timeout /t 1 > nul
goto loop