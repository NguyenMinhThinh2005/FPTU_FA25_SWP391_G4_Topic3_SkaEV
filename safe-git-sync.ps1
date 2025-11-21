# Safe Git Sync Script - Prioritizes Local API Logic
# Version: 1.0
# Date: 2025-11-03

param(
    [Parameter(Mandatory=$false)]
    [string]$Operation = "pull", # pull, push, or sync (pull + push)
    
    [Parameter(Mandatory=$false)]
    [string]$Branch = "develop",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

# Color output functions
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

# Critical files that contain API and booking logic (ALWAYS PRESERVE LOCAL)
$CriticalFiles = @(
    "SkaEV.API/Application/Services/StationService.cs",
    "SkaEV.API/Application/Services/BookingService.cs",
    "SkaEV.API/Controllers/StationsController.cs",
    "SkaEV.API/Controllers/BookingsController.cs",
    "SkaEV.API/Application/DTOs/Stations/ChargingPostWithSlotsDto.cs",
    "SkaEV.API/Application/DTOs/Stations/ChargingSlotDto.cs",
    "src/services/api.js",
    "src/pages/customer/ChargingFlow.jsx",
    "src/components/customer/BookingModal.jsx",
    "src/store/bookingStore.js",
    "src/hooks/useMasterDataSync.js"
)

# Files that can accept remote changes
$NonCriticalFiles = @(
    "README.md",
    "*.md",
    "package-lock.json"
)

Write-Info "═══════════════════════════════════════════════════════════"
Write-Info "    Safe Git Sync - Local API Logic Preservation Mode"
Write-Info "═══════════════════════════════════════════════════════════"
Write-Host ""

# Step 1: Verify we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Error "Error: Not in a git repository!"
    exit 1
}

# Step 2: Check current status
Write-Info "📊 Current Git Status:"
git status --short
Write-Host ""

# Step 3: Create backup
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupBranch = "backup-local-api-$Timestamp"

Write-Info "💾 Creating backup branch: $BackupBranch"
git branch $BackupBranch

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Backup branch created successfully"
} else {
    Write-Error "✗ Failed to create backup branch"
    exit 1
}

# Step 4: Create stash with all changes
Write-Info "📦 Stashing current changes (including untracked files)..."
$StashMessage = "safe-sync-backup-$Timestamp"
git stash push -u -m $StashMessage

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Changes stashed successfully"
    $StashCreated = $true
} else {
    Write-Warning "⚠ No changes to stash or stash failed"
    $StashCreated = $false
}

Write-Host ""

# Step 5: Pull from remote
if ($Operation -eq "pull" -or $Operation -eq "sync") {
    Write-Info "🔄 Pulling from origin/$Branch..."
    
    if ($DryRun) {
        Write-Warning "DRY RUN: Would execute: git pull origin $Branch"
    } else {
        git pull origin $Branch
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "✗ Pull failed with conflicts or errors"
            Write-Warning "Analyzing conflicts..."
            
            # Get list of conflicted files
            $ConflictedFiles = git diff --name-only --diff-filter=U
            
            if ($ConflictedFiles) {
                Write-Host ""
                Write-Warning "⚠ CONFLICTS DETECTED IN:"
                $ConflictedFiles | ForEach-Object {
                    $IsCritical = $false
                    foreach ($pattern in $CriticalFiles) {
                        if ($_ -like $pattern -or $_ -eq $pattern) {
                            $IsCritical = $true
                            break
                        }
                    }
                    
                    if ($IsCritical) {
                        Write-Error "  [CRITICAL] $_"
                    } else {
                        Write-Warning "  [NON-CRITICAL] $_"
                    }
                }
                
                Write-Host ""
                Write-Info "🔧 CONFLICT RESOLUTION STRATEGY:"
                Write-Host ""
                Write-Success "For CRITICAL files (API/Booking logic):"
                Write-Host "  → Keeping LOCAL version (your working code)"
                Write-Host ""
                Write-Warning "For NON-CRITICAL files:"
                Write-Host "  → Needs manual review"
                Write-Host ""
                
                # Auto-resolve critical files to keep local version
                foreach ($file in $ConflictedFiles) {
                    $IsCritical = $false
                    foreach ($pattern in $CriticalFiles) {
                        if ($file -like $pattern -or $file -eq $pattern) {
                            $IsCritical = $true
                            break
                        }
                    }
                    
                    if ($IsCritical) {
                        Write-Info "Resolving $file → KEEPING LOCAL VERSION"
                        if (-not $DryRun) {
                            git checkout --ours $file
                            git add $file
                        }
                    } else {
                        Write-Warning "⚠ Please manually resolve: $file"
                        Write-Host "  Commands:"
                        Write-Host "    git checkout --ours $file  (keep local)"
                        Write-Host "    git checkout --theirs $file  (keep remote)"
                    }
                }
                
                Write-Host ""
                Write-Warning "After resolving all conflicts, run:"
                Write-Host "  git commit -m 'Merge: preserved local API logic'"
                Write-Host ""
                
                # Don't continue if there are conflicts
                Write-Error "Please resolve conflicts and re-run this script"
                
                # Restore stash
                if ($StashCreated) {
                    Write-Info "Restoring stashed changes..."
                    git stash pop
                }
                
                exit 1
            }
        } else {
            Write-Success "✓ Pull completed successfully (fast-forward)"
        }
    }
}

Write-Host ""

# Step 6: Restore stashed changes
if ($StashCreated -and -not $DryRun) {
    Write-Info "📤 Restoring your local changes..."
    git stash pop
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✓ Changes restored successfully"
    } else {
        Write-Warning "⚠ Stash pop had conflicts - may need manual resolution"
        Write-Host ""
        Write-Info "Your changes are still in stash. To manually apply:"
        Write-Host "  git stash apply stash@{0}"
    }
}

Write-Host ""

# Step 7: Show current status after merge
Write-Info "📊 Current Status After Sync:"
git status --short
Write-Host ""

# Step 8: Validate critical files still exist
Write-Info "🔍 Validating Critical API Files:"
$MissingFiles = @()
foreach ($file in $CriticalFiles) {
    if (Test-Path $file) {
        Write-Success "  ✓ $file"
    } else {
        Write-Warning "  ⚠ $file (not found - may be new)"
    }
}

Write-Host ""

# Step 9: Push if requested
if ($Operation -eq "push" -or $Operation -eq "sync") {
    Write-Host ""
    Write-Warning "═══════════════════════════════════════════════════════════"
    Write-Warning "  PUSH VALIDATION CHECKLIST"
    Write-Warning "═══════════════════════════════════════════════════════════"
    Write-Host ""
    Write-Host "Before pushing, please verify:"
    Write-Host "  [ ] API endpoints connect successfully"
    Write-Host "  [ ] Charging station booking flow works"
    Write-Host "  [ ] Database queries return expected results"
    Write-Host "  [ ] Authentication/authorization works"
    Write-Host "  [ ] No regression in booking functionality"
    Write-Host ""
    
    if (-not $Force) {
        $Confirm = Read-Host "Have you validated all items? (yes/no)"
        if ($Confirm -ne "yes" -and $Confirm -ne "y") {
            Write-Warning "Push cancelled. Please validate and re-run with -Operation push"
            exit 0
        }
    }
    
    Write-Info "🚀 Pushing to origin/$Branch..."
    
    if ($DryRun) {
        Write-Warning "DRY RUN: Would execute: git push --force-with-lease origin $Branch"
    } else {
        git push --force-with-lease origin $Branch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✓ Push completed successfully"
        } else {
            Write-Error "✗ Push failed"
            Write-Warning "If remote has new commits, run pull first"
            exit 1
        }
    }
}

Write-Host ""
Write-Success "═══════════════════════════════════════════════════════════"
Write-Success "  Sync Operation Completed"
Write-Success "═══════════════════════════════════════════════════════════"
Write-Host ""
Write-Info "Backup branch: $BackupBranch"
Write-Info "Stash entry: $StashMessage"
Write-Host ""
Write-Info "If something went wrong, rollback with:"
Write-Host "  git reset --hard $BackupBranch"
Write-Host "  git stash apply stash@{0}"
Write-Host ""
