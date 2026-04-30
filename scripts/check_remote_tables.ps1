$projectRef = if ($env:SUPABASE_PROJECT_ID) { $env:SUPABASE_PROJECT_ID } else { "blimjnitngthldhazvwh" }
$url = "https://$projectRef.supabase.co"
$serviceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $serviceKey) {
    throw "SUPABASE_SERVICE_ROLE_KEY is required to query remote tables."
}

$headers = @{
    "apikey"        = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type"  = "application/json"
}

# Query via PostgREST information_schema view is not exposed, so we use a direct REST call
# to the pg_catalog via a custom RPC or just list via REST

# Try listing tables via information_schema using a raw SQL endpoint
$sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"

$body = @{ query = $sql } | ConvertTo-Json -Depth 5

try {
    $resp = Invoke-RestMethod `
        -Uri "$url/rest/v1/rpc/query" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    Write-Host "Tables via RPC:" 
    $resp | ConvertTo-Json
} catch {
    Write-Host "RPC failed: $_"
}

# Alternatively, try each known table to see if it's accessible
$knownTables = @(
    "ig_posts",
    "ig_people", 
    "ig_interactions",
    "contacts",
    "outreach_tasks",
    "message_templates",
    "audit_logs",
    "meta_account_snapshots",
    "meta_sync_runs",
    "internal_users",
    "operational_retention_policies"
)

Write-Host "`n=== Checking tables via HEAD request ==="
foreach ($table in $knownTables) {
    try {
        $resp = Invoke-WebRequest `
            -Uri "$url/rest/v1/$table?limit=1" `
            -Method HEAD `
            -Headers $headers `
            -ErrorAction Stop
        Write-Host "[OK]  $table (HTTP $($resp.StatusCode))"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "[ERR] $table (HTTP $code)"
    }
}
