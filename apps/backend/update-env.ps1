# LikasLens Backend - Azure Container App Env Var Update
# Run: powershell -ExecutionPolicy Bypass -File .\update-env.ps1

$AppName = "likaslens-backend"
$ResourceGroup = "likaslens"

Write-Host "=== 1. Logging into Azure ===" -ForegroundColor Cyan
& "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" login --use-device-code

Write-Host "`n=== 2. Updating environment variables ===" -ForegroundColor Cyan
& "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" containerapp update `
  --name $AppName `
  --resource-group $ResourceGroup `
  --set-env-vars `
    APP_ENV=production `
    APP_DEBUG=false `
    APP_KEY="base64:isMyFTXZYcT+KplXlw37lFSrpd8k95X3lzIS3G2nJiI=" `
    DB_CONNECTION=pgsql `
    DB_HOST="db.sfklmmtimelotqvrldni.supabase.co" `
    DB_PORT=5432 `
    DB_DATABASE=postgres `
    DB_USERNAME="postgres.sfklmmtimelotqvrldni" `
    DB_PASSWORD="RZCpSUDmyRJ1uKVH" `
    LOG_CHANNEL=stderr `
    LOG_LEVEL=warning `
    CACHE_STORE=file `
    SESSION_DRIVER=file `
    AI_SERVICE_URL="http://likaslens-ai-service:8001"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== Env vars updated successfully ===" -ForegroundColor Green
} else {
    Write-Host "`n=== Update failed with exit code $LASTEXITCODE ===" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 3. Checking logs (last 10 minutes) ===" -ForegroundColor Cyan
& "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" containerapp logs show `
  --name $AppName `
  --resource-group $ResourceGroup `
  --since 10m

Write-Host "`n=== 4. Filtering for DB errors ===" -ForegroundColor Cyan
& "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" containerapp logs show `
  --name $AppName `
  --resource-group $ResourceGroup `
  --since 10m `
  --query "[?contains(LogEntry, 'SQLSTATE') || contains(LogEntry, 'connection') || contains(LogEntry, 'error')].{Time:Timestamp, Log:LogEntry}" `
  --output table
