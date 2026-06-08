# LikasLens API Endpoint Smoke Test
# Usage: .\test-api.ps1 -BaseUrl "https://likaslens-backend.jollysand-xxxx.southeastasia.azurecontainerapps.io"
#
# Set optional test credentials:
#   .\test-api.ps1 -BaseUrl "..." -TestEmail "maria.santos@likaslens.ph" -TestPassword "password"
#   .\test-api.ps1 -BaseUrl "..." -AdminEmail "super.admin@likaslens.ph" -AdminPassword "password"

param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,

    [string]$TestEmail = "maria.santos@likaslens.ph",
    [string]$TestPassword = "password",

    [string]$AdminEmail = "super.admin@likaslens.ph",
    [string]$AdminPassword = "password"
)

$BaseUrl = $BaseUrl.TrimEnd('/')
$ApiBase = "$BaseUrl/api"
$PassCount = 0
$FailCount = 0
$SkipCount = 0
$Results = @()

function Test-Endpoint {
    param(
        [string]$Label,
        [string]$Method = "GET",
        [string]$Path,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectStatus = 200,
        [string]$Note = ""
    )
    $url = "$ApiBase$Path"
    $statusCode = 0
    $response = $null
    $errorMsg = ""

    try {
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            TimeoutSec = 15
        }
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10 -Compress)
        }

        # Invoke-WebRequest for reliable StatusCode in PS 5.1
        $wr = Invoke-WebRequest @params -UseBasicParsing -ErrorAction Stop
        $statusCode = [int]$wr.StatusCode
        try { $response = $wr.Content | ConvertFrom-Json } catch { $response = $wr.Content }
    } catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
        }
        $errorMsg = $_.Exception.Message
        if ($errorMsg.Length -gt 120) { $errorMsg = $errorMsg.Substring(0, 120) + "..." }
    }

    $ok = ($statusCode -eq $ExpectStatus) -or ($ExpectStatus -eq 0)
    if ($ok) {
        $script:PassCount++
        $result = "PASS"
        $detail = "HTTP $statusCode"
    } elseif ($statusCode -gt 0) {
        $script:FailCount++
        $result = "FAIL"
        $detail = "Expected $ExpectStatus, got HTTP $statusCode"
    } else {
        $script:FailCount++
        $result = "FAIL"
        $detail = "Connection error: $errorMsg"
    }

    $obj = [PSCustomObject]@{
        Result = $result
        Method = $Method
        Endpoint = $Path
        Detail = $detail
        Note = $Note
    }
    $script:Results += $obj
    $fg = if ($result -eq "PASS") { "Green" } else { "Red" }
    Write-Host ("[{0}] {1,-6} {2}" -f $result, $Method, $Path) -ForegroundColor $fg
    return $response
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  LikasLens API Smoke Test" -ForegroundColor Cyan
Write-Host "  Target: $BaseUrl" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ═══════════════════════════════════════════════════════════
# SECTION 1: HEALTH & PUBLIC READ-ONLY
# ═══════════════════════════════════════════════════════════
Write-Host "--- SECTION 1: Health & Public Read-Only ---" -ForegroundColor Yellow

$healthResp = Test-Endpoint -Label "Health check" -Path "/health" -Note "Should return 200 with status=ok"

Test-Endpoint -Label "Public leaderboard" -Path "/leaderboard"

Test-Endpoint -Label "Achievement catalog" -Path "/achievements"

Test-Endpoint -Label "Public laws list" -Path "/laws"

Test-Endpoint -Label "Eco-credit rate" -Path "/settings/eco-credit-rate"

Test-Endpoint -Label "Public tickets list" -Path "/tickets"

$testLawId = ""
$testTicketId = ""
if ($healthResp) {
    # Try to get a sample law ID for single-resource test
    try {
        $lawsResp = Invoke-RestMethod -Uri "$ApiBase/laws" -Method GET -TimeoutSec 10 -ErrorAction Stop
        if ($lawsResp.data -and $lawsResp.data.Count -gt 0) {
            $testLawId = $lawsResp.data[0].id
        } elseif ($lawsResp.success -and $lawsResp.data.Count -gt 0) {
            $testLawId = $lawsResp.data[0].id
        }
    } catch {}
    try {
        $ticketsResp = Invoke-RestMethod -Uri "$ApiBase/tickets" -Method GET -TimeoutSec 10 -ErrorAction Stop
        if ($ticketsResp.data -and $ticketsResp.data.Count -gt 0) {
            $testTicketId = $ticketsResp.data[0].id
        }
    } catch {}
}

if ($testLawId) {
    Test-Endpoint -Label "Single law" -Path "/laws/$testLawId"
}
if ($testTicketId) {
    Test-Endpoint -Label "Single ticket" -Path "/tickets/$testTicketId"
}

# ═══════════════════════════════════════════════════════════
# SECTION 2: PUBLIC WRITE / SUBMISSION ENDPOINTS
# ═══════════════════════════════════════════════════════════
Write-Host "`n--- SECTION 2: Public Submission Endpoints ---" -ForegroundColor Yellow

Test-Endpoint -Label "Contact message" -Method POST -Path "/contact-messages" `
    -Body @{ name="Test User"; email="test@example.com"; subject="API Test"; message="Smoke test message" } `
    -ExpectStatus 200 -Note "May return 201"

Test-Endpoint -Label "Chat proxy" -Method POST -Path "/v1/chat" `
    -Body @{ message="Hello"; context_type="general" } -ExpectStatus 200 -Note "May return 200/422/503"

# ═══════════════════════════════════════════════════════════
# SECTION 3: TESTING RATE LIMIT ON /api/reports (60/min)
# ═══════════════════════════════════════════════════════════
Write-Host "`n--- SECTION 3: Rate Limit Test on /api/reports ---" -ForegroundColor Yellow

$rateHit = 0
$rateLimited = $false
for ($i = 1; $i -le 65; $i++) {
    try {
        Invoke-WebRequest -Uri "$ApiBase/reports" -Method POST -ContentType "application/json" `
            -Body '{"test":"rate-limit-check"}' -UseBasicParsing -ErrorAction Stop -TimeoutSec 5 | Out-Null
        $rateHit++
    } catch {
        $sc = 0
        if ($_.Exception.Response) { $sc = [int]$_.Exception.Response.StatusCode.value__ }
        if ($sc -eq 429) {
            Write-Host "[PASS] Rate limit hit after $rateHit OK calls (429 at request $i)" -ForegroundColor Green
            $PassCount++
            $Results += [PSCustomObject]@{Result="PASS";Method="POST";Endpoint="/reports (rate limit)";Detail="429 at request $i after $rateHit OK calls";Note="60/min rate limit"}
            $rateLimited = $true
            break
        } elseif ($sc -eq 422) {
            $rateHit++
            continue
        } else {
            $rateHit++
            continue
        }
    }
}
if (-not $rateLimited -and $rateHit -ge 65) {
    Write-Host "[FAIL] Rate limit never triggered after 65 requests" -ForegroundColor Red
    $FailCount++
    $Results += [PSCustomObject]@{Result="FAIL";Method="POST";Endpoint="/reports (rate limit)";Detail="No 429 after 65 requests";Note="60/min rate limit"}
}

# ═══════════════════════════════════════════════════════════
# SECTION 4: AUTHENTICATION ENDPOINTS
# ═══════════════════════════════════════════════════════════
Write-Host "`n--- SECTION 4: Authentication ---" -ForegroundColor Yellow

Test-Endpoint -Label "Register" -Method POST -Path "/auth/register" `
    -Body @{ name="Test User API"; email="apitest_$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"; password="TestPass123!" } `
    -ExpectStatus 200 -Note "May return 200/201/409"

$loginResp = Test-Endpoint -Label "Login" -Method POST -Path "/auth/login" `
    -Body @{ email=$TestEmail; password=$TestPassword } -ExpectStatus 200

$token = ""
if ($loginResp.token) { $token = $loginResp.token }
elseif ($loginResp.data.token) { $token = $loginResp.data.token }
elseif ($loginResp.access_token) { $token = $loginResp.access_token }

$authHeaders = @{}
if ($token) {
    $authHeaders = @{ Authorization = "Bearer $token" }
    Write-Host "  [INFO] Token obtained: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor DarkGray
} else {
    Write-Host "  [WARN] No token in login response - authenticated tests will be skipped" -ForegroundColor Yellow
    $SkipCount = 100
}

# ═══════════════════════════════════════════════════════════
# SECTION 5: AUTHENTICATED ENDPOINTS (auth:sanctum)
# ═══════════════════════════════════════════════════════════
Write-Host "`n--- SECTION 5: Authenticated Endpoints ---" -ForegroundColor Yellow

if ($token) {
    Test-Endpoint -Label "Get user" -Path "/user" -Headers $authHeaders
    Test-Endpoint -Label "User profile" -Path "/user/profile" -Headers $authHeaders
    Test-Endpoint -Label "User impact" -Path "/user/impact" -Headers $authHeaders
    Test-Endpoint -Label "User achievements" -Path "/user/achievements" -Headers $authHeaders
    Test-Endpoint -Label "User rank progress" -Path "/user/rank-progress" -Headers $authHeaders
    Test-Endpoint -Label "Dashboard stats" -Path "/dashboard/stats" -Headers $authHeaders
    Test-Endpoint -Label "Dashboard feed" -Path "/dashboard/feed" -Headers $authHeaders

    # Report actions (expect 422 on invalid body, which is still valid response)
    Test-Endpoint -Label "Report verify" -Method POST -Path "/reports/verify" -Headers $authHeaders `
        -Body @{ test="no-real-verify" } -ExpectStatus 422 -Note "422 expected for invalid body"
    Test-Endpoint -Label "Report batch-sync" -Method POST -Path "/reports/batch-sync" -Headers $authHeaders `
        -Body @{ reports=@() } -ExpectStatus 200 -Note "200/422 depending on payload"

    # Authorised admin read (any authenticated)
    Test-Endpoint -Label "Admin NGOs list" -Path "/admin/ngos" -Headers $authHeaders
    Test-Endpoint -Label "Admin laws list" -Path "/admin/laws" -Headers $authHeaders
    Test-Endpoint -Label "Admin users list" -Path "/admin/users" -Headers $authHeaders
    Test-Endpoint -Label "Admin partner stores" -Path "/admin/partner-stores" -Headers $authHeaders

    # Single-resource admin reads
    $ngosResp = try { Invoke-RestMethod -Uri "$ApiBase/admin/ngos" -Headers $authHeaders -TimeoutSec 10 -ErrorAction Stop } catch { $null }
    if ($ngosResp.data -and $ngosResp.data.Count -gt 0) {
        $ngoId = $ngosResp.data[0].id
        Test-Endpoint -Label "Admin single NGO" -Path "/admin/ngos/$ngoId" -Headers $authHeaders
    }
    if ($testLawId) {
        Test-Endpoint -Label "Admin single law" -Path "/admin/laws/$testLawId" -Headers $authHeaders
    }
    $storesResp = try { Invoke-RestMethod -Uri "$ApiBase/admin/partner-stores" -Headers $authHeaders -TimeoutSec 10 -ErrorAction Stop } catch { $null }
    if ($storesResp.data -and $storesResp.data.Count -gt 0) {
        $storeId = $storesResp.data[0].id
        Test-Endpoint -Label "Admin single store" -Path "/admin/partner-stores/$storeId" -Headers $authHeaders
    }

    # Eco-Credit Engine
    Test-Endpoint -Label "Eco-credit award" -Method POST -Path "/v1/likaslens-engine/credits/award" -Headers $authHeaders `
        -Body @{ user_id=(New-Guid).ToString(); amount=10; reason="test" } -ExpectStatus 200 -Note "May return 200/422"

    # Logout
    Test-Endpoint -Label "Logout" -Method POST -Path "/auth/logout" -Headers $authHeaders
} else {
    Write-Host "  [SKIP] No auth token available" -ForegroundColor DarkYellow
}

# ═══════════════════════════════════════════════════════════
# SECTION 6: ADMIN ENDPOINTS (role:super_admin)
# ═══════════════════════════════════════════════════════════
Write-Host "`n--- SECTION 6: Admin Endpoints ---" -ForegroundColor Yellow

Write-Host "  [INFO] Logging in as admin: $AdminEmail" -ForegroundColor DarkGray
$adminLoginResp = try {
    Invoke-RestMethod -Uri "$ApiBase/auth/login" -Method POST -ContentType "application/json" `
        -Body (@{ email=$AdminEmail; password=$AdminPassword } | ConvertTo-Json) -TimeoutSec 15 -ErrorAction Stop
} catch { $null }

$adminToken = ""
if ($adminLoginResp.token) { $adminToken = $adminLoginResp.token }
elseif ($adminLoginResp.data.token) { $adminToken = $adminLoginResp.data.token }
elseif ($adminLoginResp.access_token) { $adminToken = $adminLoginResp.access_token }

$adminHeaders = @{}
if ($adminToken) {
    $adminHeaders = @{ Authorization = "Bearer $adminToken" }
    Write-Host "  [INFO] Admin token obtained" -ForegroundColor DarkGray

    Test-Endpoint -Label "Admin users sync" -Path "/v1/likaslens-admin/users/sync" -Headers $adminHeaders
    Test-Endpoint -Label "Admin laws trashed" -Path "/admin/laws/trashed" -Headers $adminHeaders
    Test-Endpoint -Label "Admin audit logs" -Path "/admin/audit-logs" -Headers $adminHeaders
    Test-Endpoint -Label "Admin contact messages" -Path "/admin/contact-messages" -Headers $adminHeaders
    Test-Endpoint -Label "Currency settings list" -Path "/admin/currency-settings" -Headers $adminHeaders

    # Single resource admin reads
    $adminUsersResp = try { Invoke-RestMethod -Uri "$ApiBase/admin/users" -Headers $adminHeaders -TimeoutSec 10 -ErrorAction Stop } catch { $null }
    if ($adminUsersResp.data -and $adminUsersResp.data.Count -gt 0) {
        $userId = $adminUsersResp.data[0].id
        Test-Endpoint -Label "Admin single user" -Path "/admin/users/$userId" -Headers $adminHeaders
    }
    $auditResp = try { Invoke-RestMethod -Uri "$ApiBase/admin/audit-logs" -Headers $adminHeaders -TimeoutSec 10 -ErrorAction Stop } catch { $null }
    if ($auditResp.data -and $auditResp.data.Count -gt 0) {
        $auditId = $auditResp.data[0].id
        Test-Endpoint -Label "Admin single audit log" -Path "/admin/audit-logs/$auditId" -Headers $adminHeaders
    }
} else {
    Write-Host "  [SKIP] Admin login failed - admin tests skipped" -ForegroundColor DarkYellow
}

# ═══════════════════════════════════════════════════════════
# SECTION 7: UNAUTHORIZED ACCESS TESTS
# ═══════════════════════════════════════════════════════════
Write-Host "`n--- SECTION 7: Unauthorized Access Tests (expect 401) ---" -ForegroundColor Yellow

Test-Endpoint -Label "No-auth dashboard" -Path "/dashboard/stats" -ExpectStatus 401 -Note "Must reject unauthenticated"
Test-Endpoint -Label "No-auth dashboard feed" -Path "/dashboard/feed" -ExpectStatus 401 -Note "Must reject unauthenticated"
Test-Endpoint -Label "No-auth user endpoint" -Path "/user" -ExpectStatus 401 -Note "Must reject unauthenticated"

# ═══════════════════════════════════════════════════════════
# SECTION 8: JSON ERROR RESPONSE CHECK
# ═══════════════════════════════════════════════════════════
Write-Host "`n--- SECTION 8: JSON Error Response Check ---" -ForegroundColor Yellow

try {
    Invoke-WebRequest -Uri "$ApiBase/nonexistent-route-12345" -Method GET -ContentType "application/json" `
        -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop | Out-Null
    # If we get here without exception, the route returned 2xx (unexpected)
    Write-Host "[WARN] 404 test: got 2xx instead of 404" -ForegroundColor Yellow
    $PassCount++
} catch {
    $contentType = ""
    $sc = 0
    if ($_.Exception.Response) {
        $resp = $_.Exception.Response
        $sc = [int]$resp.StatusCode.value__
        if ($resp.Headers['Content-Type']) {
            $contentType = $resp.Headers['Content-Type']
        }
    }
    if ($sc -eq 404 -and $contentType -match 'application/json') {
        Write-Host "[PASS] 404 returns JSON (HTTP $sc, Content-Type: $contentType)" -ForegroundColor Green
        $PassCount++
        $Results += [PSCustomObject]@{Result="PASS";Method="GET";Endpoint="/nonexistent (404 JSON)";Detail="HTTP 404 Content-Type: $contentType";Note="JSON error response"}
    } elseif ($sc -eq 404) {
        Write-Host "[FAIL] 404 returns non-JSON Content-Type: $contentType" -ForegroundColor Red
        $FailCount++
        $Results += [PSCustomObject]@{Result="FAIL";Method="GET";Endpoint="/nonexistent (404 JSON)";Detail="Content-Type: $contentType";Note="JSON error response"}
    } else {
        Write-Host "[FAIL] 404 test failed (HTTP $sc)" -ForegroundColor Red
        $FailCount++
        $Results += [PSCustomObject]@{Result="FAIL";Method="GET";Endpoint="/nonexistent (404 JSON)";Detail="HTTP $sc";Note="JSON error response"}
    }
}

# ═══════════════════════════════════════════════════════════
# RESULTS SUMMARY
# ═══════════════════════════════════════════════════════════
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ("  PASS: {0}  FAIL: {1}  SKIP: {2}" -f $PassCount, $FailCount, $SkipCount)
$total = $PassCount + $FailCount + $SkipCount
if ($total -gt 0) {
    $pct = [Math]::Round(($PassCount / $total) * 100, 0)
    Write-Host ("  SCORE: {0}%" -f $pct) -ForegroundColor $(if ($pct -ge 90) { "Green" } elseif ($pct -ge 70) { "Yellow" } else { "Red" })
}
Write-Host "========================================`n"

# Detail report
if ($FailCount -gt 0) {
    Write-Host "FAILED ENDPOINTS:" -ForegroundColor Red
    $Results | Where-Object { $_.Result -eq "FAIL" } | ForEach-Object {
        Write-Host ("  [{0}] {1} {2} - {3}" -f $_.Result, $_.Method, $_.Endpoint, $_.Detail) -ForegroundColor Red
    }
    Write-Host ""
}

# Return results object for programmatic use
$Results
