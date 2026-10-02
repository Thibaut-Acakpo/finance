[CmdletBinding()]
param(
    [string]$MysqlBin,
    [ValidateRange(1, 120)]
    [int]$RetentionMonths = 3
)

$ErrorActionPreference = 'Stop'
$backendRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $backendRoot
$envFile = Join-Path $backendRoot '.env'
$backupDirectory = Join-Path $backendRoot 'backups'

if (-not (Test-Path $envFile)) {
    throw "Fichier de configuration introuvable : $envFile"
}

$config = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"').Trim("'")
        $config[$key] = $value
    }
}

$dbHost = if ($config.ContainsKey('DB_HOTE')) { $config['DB_HOTE'] } else { 'localhost' }
$dbName = if ($config.ContainsKey('DB_NOM')) { $config['DB_NOM'] } else { 'gestion_finances' }
$dbUser = if ($config.ContainsKey('DB_UTILISATEUR')) { $config['DB_UTILISATEUR'] } else { 'root' }
$dbPassword = if ($config.ContainsKey('DB_MOT_DE_PASSE')) { $config['DB_MOT_DE_PASSE'] } else { '' }

if (-not $MysqlBin) {
    $MysqlBin = (Get-ChildItem 'C:\wamp64\bin\mysql\*\bin\mysqldump.exe' -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1 -ExpandProperty FullName)
}

if (-not $MysqlBin -or -not (Test-Path $MysqlBin)) {
    throw 'mysqldump.exe est introuvable. Passez son chemin avec -MysqlBin.'
}

New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null
$timestamp = Get-Date -Format 'yyyy-MM-ddTHH-mm-ss'
$backupPath = Join-Path $backupDirectory "finance-$timestamp.sql"

$arguments = @(
    '--host=' + $dbHost
    '--user=' + $dbUser
    '--single-transaction'
    '--routines'
    '--triggers'
    '--events'
    '--hex-blob'
    '--set-gtid-purged=OFF'
    '--databases'
    $dbName
    '--result-file=' + $backupPath
)

if ($dbPassword) {
    $arguments = @('--password=' + $dbPassword) + $arguments
}

& $MysqlBin @arguments
if ($LASTEXITCODE -ne 0) {
    Remove-Item $backupPath -Force -ErrorAction SilentlyContinue
    throw "La sauvegarde MySQL a echoue (code $LASTEXITCODE)."
}

Write-Output "Sauvegarde creee : $backupPath"

$cutoffDate = (Get-Date).AddMonths(-$RetentionMonths)
$oldBackups = Get-ChildItem -Path $backupDirectory -Filter 'finance-*.sql' -File |
    Where-Object { $_.LastWriteTime -lt $cutoffDate }

foreach ($oldBackup in $oldBackups) {
    Remove-Item $oldBackup.FullName -Force
    Write-Output "Ancienne sauvegarde supprimee : $($oldBackup.Name)"
}

if (-not $oldBackups) {
    Write-Output "Aucune ancienne sauvegarde a supprimer. Rétention active : $RetentionMonths mois."
}
