<#
Runs smoke tests against local SkaEV API using a crafted JWT for admin_local@skaev.test.
Generates a token using the app secret from appsettings.json and queries several endpoints.
#>

param()

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path "$scriptDir\.." | Select-Object -ExpandProperty Path
$appsettings = Join-Path $repoRoot 'appsettings.json'

if (-not (Test-Path $appsettings)) { Write-Err "appsettings.json not found at $appsettings"; exit 1 }

$conf = Get-Content $appsettings -Raw | ConvertFrom-Json
$secret = $conf.JwtSettings.SecretKey
if (-not $secret) { Write-Err "JWT secret not found in appsettings.json"; exit 1 }

# Get admin user id from DB
$server = 'ADMIN-PC\\MSSQLSERVER01'
$db = 'SkaEV_DB'
$email = 'admin_local@skaev.test'

# Try to obtain server/database from appsettings.json ConnectionStrings.DefaultConnection if present
try {
    if ($conf.ConnectionStrings -and $conf.ConnectionStrings.DefaultConnection) {
        $conn = $conf.ConnectionStrings.DefaultConnection
        if ($conn -match 'Server=([^;]+);') { $server = $Matches[1] }
        if ($conn -match 'Database=([^;]+);') { $db = $Matches[1] }
    }
} catch { }

Write-Info "Querying DB for admin user id..."
$adminIdRaw = sqlcmd -S $server -E -d $db -Q "SET NOCOUNT ON; SELECT TOP 1 user_id FROM users WHERE email = '$email'" -h -1 -W
$adminId = $null
if ($adminIdRaw) { $adminId = $adminIdRaw.Trim() }
if (-not $adminId) {
    Write-Warn "Admin with email $email not found. Attempting fallback lookups."
    $adminIdRaw = sqlcmd -S $server -E -d $db -Q "SET NOCOUNT ON; SELECT TOP 1 user_id FROM users WHERE role LIKE '%admin%' OR email LIKE '%admin%'" -h -1 -W
    if ($adminIdRaw) { $adminId = $adminIdRaw.Trim() }
}
if (-not $adminId) {
    Write-Warn "Fallback failed. Selecting first user in users table as last resort."
    $adminIdRaw = sqlcmd -S $server -E -d $db -Q "SET NOCOUNT ON; SELECT TOP 1 user_id FROM users ORDER BY created_at DESC" -h -1 -W
    if ($adminIdRaw) { $adminId = $adminIdRaw.Trim() }
}
if (-not $adminId) { Write-Err "Could not find any user id in users table. Aborting tests."; exit 1 }
Write-Info "Found admin user id: $adminId"

# Helper: base64url
function To-Base64Url([byte[]]$bytes){
    $s = [Convert]::ToBase64String($bytes).TrimEnd('=') -replace '\+','-' -replace '/','_'
    return $s
}

# Create JWT header and payload using the exact claim type URIs used in the app
$header = @{ alg = 'HS256'; typ = 'JWT' } | ConvertTo-Json -Compress

$nameIdClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
$emailClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
$nameClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
$roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

$exp = [int]((Get-Date).ToUniversalTime().AddHours(24) - (Get-Date '1970-01-01').ToUniversalTime()).TotalSeconds

$payloadObj = @{
    ($nameIdClaim) = "$adminId"
    ($emailClaim) = $email
    ($nameClaim) = 'Admin Local'
    ($roleClaim) = 'admin'
    exp = $exp
}

$payload = $payloadObj | ConvertTo-Json -Compress

$header64 = To-Base64Url([Text.Encoding]::UTF8.GetBytes($header))
$payload64 = To-Base64Url([Text.Encoding]::UTF8.GetBytes($payload))

# Sign
$keyBytes = [Text.Encoding]::UTF8.GetBytes($secret)
$inputBytes = [Text.Encoding]::UTF8.GetBytes("$header64.$payload64")
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = $keyBytes
$sig = $hmac.ComputeHash($inputBytes)
$sig64 = To-Base64Url($sig)

$token = "$header64.$payload64.$sig64"

Write-Info "Generated JWT for admin (length: $($token.Length))."

# Base URL
$base = 'http://localhost:5000'

function Call-Get($path, $useAuth=$false){
    $uri = "$base$path"
    try{
        if ($useAuth) {
            return Invoke-RestMethod -Uri $uri -Headers @{ Authorization = "Bearer $token" } -Method Get -ErrorAction Stop
        } else {
            return Invoke-RestMethod -Uri $uri -Method Get -ErrorAction Stop
        }
    } catch {
        return @{ error = $_.Exception.Message }
    }
}

Write-Info "Calling GET /api/statistics/home (anonymous)"
$homeResp = Call-Get '/api/statistics/home'
Write-Host ($homeResp | ConvertTo-Json -Depth 5)

Write-Info "Calling GET /api/statistics/dashboard (admin token)"
$dashResp = Call-Get '/api/statistics/dashboard' $true
Write-Host ($dashResp | ConvertTo-Json -Depth 6)

Write-Info "Calling GET /api/stations"
$stationsResp = Call-Get '/api/stations'
Write-Host ($stationsResp | ConvertTo-Json -Depth 4)

Write-Info "Calling GET /api/AdminUsers/support-requests (admin token)"
$supportsResp = Call-Get '/api/AdminUsers/support-requests' $true
Write-Host ($supportsResp | ConvertTo-Json -Depth 5)

Write-Info "Calling GET /api/Wallet/balance (admin token)"
$walletResp = Call-Get '/api/Wallet/balance' $true
Write-Host ($walletResp | ConvertTo-Json -Depth 4)

Write-Info "Smoke tests complete."
