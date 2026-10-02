[CmdletBinding()]
param(
    [string]$Time = '02:00'
)

$ErrorActionPreference = 'Stop'
$taskName = 'GestionFinances - Sauvegarde MySQL'
$backupScript = Join-Path $PSScriptRoot 'backup-database.ps1'
$parsedTime = [DateTime]::ParseExact($Time, 'HH:mm', $null)

$action = New-ScheduledTaskAction `
    -Execute 'PowerShell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`""

# Planifie la tache toutes les 24 heures pour respecter un cycle quotidien.
$trigger = New-ScheduledTaskTrigger -Once -At $parsedTime
$trigger.RepetitionInterval = New-TimeSpan -Hours 24
$trigger.RepetitionDuration = [TimeSpan]::MaxValue

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Description 'Sauvegarde automatique toutes les 24 heures de la base gestion_finances, avec conservation de 3 mois.' `
    -Force | Out-Null

Write-Output "Tache planifiee : $taskName (chaque 24 heures a partir de $Time)"
