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
$trigger = New-ScheduledTaskTrigger -Daily -At $parsedTime

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Description 'Sauvegarde quotidienne de la base gestion_finances, avec conservation de trois mois.' `
    -Force | Out-Null

Write-Output "Tache planifiee : $taskName (tous les jours a $Time)"
