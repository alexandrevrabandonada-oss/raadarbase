$projectRef = if ($env:SUPABASE_PROJECT_ID) { $env:SUPABASE_PROJECT_ID } else { "blimjnitngthldhazvwh" }
$pat        = $env:SUPABASE_ACCESS_TOKEN

if (-not $pat) {
    throw "SUPABASE_ACCESS_TOKEN is required to run remote migrations."
}
$apiUrl     = "https://api.supabase.com/v1/projects/$projectRef/database/query"

$headers = @{
    "Authorization" = "Bearer $pat"
    "Content-Type"  = "application/json"
}

$migrationsDir = Join-Path $PSScriptRoot "..\supabase\migrations"
$files = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name

Write-Host "=== Radar de Base — Aplicando Migrations Remotas ===" -ForegroundColor Cyan
Write-Host "Projeto: $projectRef"
Write-Host "Migrations encontradas: $($files.Count)`n"

$allOk = $true

foreach ($file in $files) {
    Write-Host "▶ $($file.Name) ... " -NoNewline

    $sql  = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $body = @{ query = $sql } | ConvertTo-Json -Depth 5 -Compress

    try {
        $resp = Invoke-RestMethod `
            -Uri     $apiUrl `
            -Method  POST `
            -Headers $headers `
            -Body    $body `
            -ErrorAction Stop

        Write-Host "OK" -ForegroundColor Green
    }
    catch {
        $allOk = $false
        $errMsg = $_.ErrorDetails.Message
        if (-not $errMsg) { $errMsg = $_.Exception.Message }
        Write-Host "ERRO" -ForegroundColor Red
        Write-Host "  $errMsg" -ForegroundColor Yellow
    }
}

Write-Host ""

# Verificação final
Write-Host "=== Tabelas no banco apos migrations ===" -ForegroundColor Cyan
$verifySql  = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
$verifyBody = @{ query = $verifySql } | ConvertTo-Json -Compress

try {
    $tables = Invoke-RestMethod `
        -Uri     $apiUrl `
        -Method  POST `
        -Headers $headers `
        -Body    $verifyBody `
        -ErrorAction Stop

    foreach ($t in $tables) { Write-Host "  OK: $($t.table_name)" -ForegroundColor Green }
}
catch {
    Write-Host "Nao foi possivel verificar tabelas: $($_.Exception.Message)" -ForegroundColor Red
}

if ($allOk) {
    Write-Host "`n[SUCESSO] Todas as migrations aplicadas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "`n[ATENCAO] Algumas migrations falharam. Revise os erros acima." -ForegroundColor Yellow
}
