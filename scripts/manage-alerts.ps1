# manage-alerts.ps1
# Utility script to manage GitHub Code Scanning alerts (Trivy)
#
# Usage:
#   ./scripts/manage-alerts.ps1                    # List all open alerts
#   ./scripts/manage-alerts.ps1 -Severity critical # List only critical alerts
#   ./scripts/manage-alerts.ps1 -Dismiss           # Prompt to dismiss alerts
#   ./scripts/manage-alerts.ps1 -Export alerts.json # Export alerts to JSON
#
# Requirements: GitHub CLI (gh) must be installed and authenticated

param(
    [ValidateSet("low", "medium", "high", "critical")]
    [string]$Severity,
    
    [ValidateSet("backend-container", "ai-service-container")]
    [string]$Category,
    
    [switch]$Dismiss,
    
    [string]$Export,
    
    [int]$Limit = 100
)

$ErrorActionPreference = "Stop"

# Verify gh CLI is available
try {
    gh --version | Out-Null
} catch {
    Write-Error "GitHub CLI (gh) is not installed. Install it from https://cli.github.com/"
    exit 1
}

# Get repository info
$repo = gh repo view --json nameWithOwner -q '.nameWithOwner'
Write-Host "Repository: $repo" -ForegroundColor Cyan
Write-Host ""

# Fetch all open code scanning alerts
Write-Host "Fetching code scanning alerts..." -ForegroundColor Yellow

$alertsJson = gh api "repos/$repo/code-scanning/alerts?state=open&per_page=$Limit" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to fetch alerts. Make sure you have write access to the repository."
    exit 1
}

$alerts = $alertsJson | ConvertFrom-Json

# Filter by severity if specified
if ($Severity) {
    $alerts = $alerts | Where-Object { $_.rule.severity -eq $Severity }
}

# Filter by category if specified
if ($Category) {
    $alerts = $alerts | Where-Object { $_.rule.tags -contains "CATEGORY:$Category" -or $_.tool.name -eq "trivy" }
}

# Display summary
Write-Host "Found $($alerts.Count) alerts" -ForegroundColor Green
Write-Host ""

if ($alerts.Count -eq 0) {
    Write-Host "No alerts found matching the specified criteria." -ForegroundColor Green
    exit 0
}

# Export to JSON if requested
if ($Export) {
    $alerts | ConvertTo-Json -Depth 10 | Out-File -FilePath $Export -Encoding UTF8
    Write-Host "Exported $($alerts.Count) alerts to $Export" -ForegroundColor Green
    exit 0
}

# Group by severity
$grouped = $alerts | Group-Object { $_.rule.severity } | Sort-Object Name

Write-Host "Alerts by severity:" -ForegroundColor Cyan
foreach ($group in $grouped) {
    $color = switch ($group.Name) {
        "critical" { "Red" }
        "high" { "Yellow" }
        "medium" { "White" }
        "low" { "Gray" }
        default { "White" }
    }
    Write-Host "  $($group.Name): $($group.Count)" -ForegroundColor $color
}
Write-Host ""

# Display alerts
$index = 1
foreach ($alert in $alerts) {
    $severityColor = switch ($alert.rule.severity) {
        "critical" { "Red" }
        "high" { "Yellow" }
        "medium" { "White" }
        "low" { "Gray" }
        default { "White" }
    }
    
    Write-Host "[$index] " -NoNewline -ForegroundColor Cyan
    Write-Host "$($alert.rule.severity.ToUpper())" -NoNewline -ForegroundColor $severityColor
    Write-Host " - $($alert.rule.description)" -ForegroundColor White
    Write-Host "    Rule ID: $($alert.rule.id)" -ForegroundColor Gray
    Write-Host "    Location: $($alert.most_recent_instance.location.path):$($alert.most_recent_instance.location.start_line)" -ForegroundColor Gray
    Write-Host "    Alert URL: $($alert.html_url)" -ForegroundColor Gray
    Write-Host ""
    
    $index++
}

# Dismiss alerts if requested
if ($Dismiss) {
    Write-Host ""
    Write-Host "=== Dismiss Mode ===" -ForegroundColor Yellow
    Write-Host "You can dismiss alerts as:" -ForegroundColor White
    Write-Host "  1. false_positive - The vulnerability is not applicable" -ForegroundColor Gray
    Write-Host "  2. acceptable_risk - The vulnerability is an acceptable risk" -ForegroundColor Gray
    Write-Host "  3. wont_fix - The vulnerability will not be fixed" -ForegroundColor Gray
    Write-Host ""
    
    $dismissCount = 0
    $skipCount = 0
    
    foreach ($alert in $alerts) {
        Write-Host ""
        Write-Host "Alert: $($alert.rule.severity.ToUpper()) - $($alert.rule.description)" -ForegroundColor Yellow
        Write-Host "Location: $($alert.most_recent_instance.location.path)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "[D] Dismiss  [S] Skip  [Q] Quit" -ForegroundColor Cyan
        $choice = Read-Host "Choice"
        
        switch ($choice.ToUpper()) {
            "D" {
                Write-Host "Dismiss as: [F]alse_positive  [A]cceptable_risk  [W]ont_fix" -ForegroundColor Cyan
                $reason = Read-Host "Reason"
                
                $dismissReason = switch ($reason.ToUpper()) {
                    "F" { "false_positive" }
                    "A" { "acceptable_risk" }
                    "W" { "wont_fix" }
                    default { 
                        Write-Host "Invalid reason. Skipping." -ForegroundColor Red
                        $skipCount++
                        continue
                    }
                }
                
                try {
                    gh api "repos/$repo/code-scanning/alerts/$($alert.number)" `
                        -X PATCH `
                        -f state="dismissed" `
                        -f dismissed_reason=$dismissReason `
                        -f dismissed_comment="Dismissed via manage-alerts.ps1" | Out-Null
                    
                    Write-Host "Dismissed as $dismissReason" -ForegroundColor Green
                    $dismissCount++
                } catch {
                    Write-Host "Failed to dismiss: $_" -ForegroundColor Red
                    $skipCount++
                }
            }
            "S" {
                Write-Host "Skipped" -ForegroundColor Gray
                $skipCount++
            }
            "Q" {
                Write-Host "Quitting..." -ForegroundColor Yellow
                break
            }
            default {
                Write-Host "Invalid choice. Skipping." -ForegroundColor Red
                $skipCount++
            }
        }
    }
    
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  Dismissed: $dismissCount" -ForegroundColor Green
    Write-Host "  Skipped: $skipCount" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
