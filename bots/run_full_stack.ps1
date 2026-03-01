# Create required folders
$folders = @(
    "D:\studiodefi\flashloan\logs",
    "D:\studiodefi\flashloan\dashboard",
    "D:\studiodefi\flashloan\services",
    "D:\studiodefi\flashloan\contracts",
    "D:\studiodefi\flashloan\db"
)
foreach ($folder in $folders) { if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder | Out-Null } }

# Start bots (parallel opportunity seekers, analytics, wallet trackers)
foreach ($bot in @("ninja_bot.py", "sniper_bot.py", "multi_opportunity_seeker.py")) { Start-Process python -ArgumentList "D:\studiodefi\flashloan\bots\$bot" }

# Start dashboard (Bootstrap/React/Neon UI)
Start-Process powershell -ArgumentList "-NoExit", "-File D:\studiodefi\flashloan\frontend\run_frontend.ps1"

# Start backend services (Node.js/Express/Socket.io/Prisma/MySQL)
Start-Process node -ArgumentList "D:\studiodefi\flashloan\backend\index.js"
Start-Process node -ArgumentList "D:\studiodefi\flashloan\backend\cycle.js"
Start-Process node -ArgumentList "D:\studiodefi\flashloan\backend\market.js"
Start-Process node -ArgumentList "D:\studiodefi\flashloan\backend\tokens.js"
Start-Process node -ArgumentList "D:\studiodefi\flashloan\backend\wallet.js"
Start-Process node -ArgumentList "D:\studiodefi\flashloan\backend\scoring.js"

# Start contract deployment service (for new tokens/pools/lunchpads)
Start-Process node -ArgumentList "D:\studiodefi\flashloan\contracts\deploy.js"

# Start MySQL DB (if using local server)
# Start-Process "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"

# Start Prisma live sync
Start-Process npx -ArgumentList "prisma generate"
Start-Process npx -ArgumentList "prisma migrate dev"

# Start analytics crawler (wallet/founder/luncher tracking)
Start-Process node -ArgumentList "D:\studiodefi\flashloan\services\analytics_crawler.js"

# Start API proxy (secure transactions, auto slippage, gas optimization)
Start-Process node -ArgumentList "D:\studiodefi\flashloan\backend\api.js"

# Start SSL proxy (Caddy/NGINX for HTTPS)
# Start-Process "C:\Caddy\caddy.exe" -ArgumentList "run --config D:\studiodefi\flashloan\Caddyfile"

Write-Host "Full core, dashboard, bots, backend, contract deployments, analytics, DB, and services started. Monitor logs for live prices, wallet tracking, and strategy execution."
powershell -ExecutionPolicy Bypass -File D:\studiodefi\flashloan\run_full_stack.ps1