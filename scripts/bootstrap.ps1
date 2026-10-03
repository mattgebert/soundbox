# Run this installation script using PowerShell.
# Set-ExecutionPolicy -Scope Process Bypass
# .\scripts\bootstrap.ps1

$ErrorActionPreference = "Stop"

Write-Host "Checking required commands..."

$requiredCommands = @(
    "git",
    "node",
    "npm",
    "python"
)

foreach ($command in $requiredCommands) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "Required command '$command' was not found on PATH."
    }
}

Write-Host "Installing Node dependencies..."
npm ci

if (-not (Get-Command pipx -ErrorAction SilentlyContinue)) {
    Write-Host "Installing pipx..."
    py -m pip install --user pipx
    py -m pipx ensurepath

    Write-Warning "pipx was installed."
    Write-Warning "Restart PowerShell, then run this script again."
    exit 0
}

Write-Host "Installing or upgrading development tools..."

pipx install pre-commit 2>$null
if ($LASTEXITCODE -ne 0) {
    pipx upgrade pre-commit
}

pipx install commitizen 2>$null
if ($LASTEXITCODE -ne 0) {
    pipx upgrade commitizen
}

pipx install ruff 2>$null
if ($LASTEXITCODE -ne 0) {
    pipx upgrade ruff
}

Write-Host "Installing Git hooks..."
pre-commit install --hook-type pre-commit
pre-commit install --hook-type commit-msg
pre-commit install-hooks

Write-Host "Running repository checks..."
pre-commit run --all-files

Write-Host "Soundbox development environment is ready."
