# 🔒 Safe Git Sync Guide - API Logic Protection

## 🚨 CRITICAL PRIORITY RULE
**ALWAYS PRESERVE LOCAL CODE for API and booking flow logic!**

Your local code contains the **CORRECT and PRODUCTION-READY** implementation that connects to the database and handles charging station bookings.

---

## 📋 Quick Command Reference

### Safe Pull (Recommended)
```powershell
# Pull with automatic protection of critical files
.\safe-git-sync.ps1 -Operation pull

# Dry run (see what would happen without making changes)
.\safe-git-sync.ps1 -Operation pull -DryRun
```

### Safe Push
```powershell
# Push with validation checklist
.\safe-git-sync.ps1 -Operation push

# Force push (skip validation - use with caution)
.\safe-git-sync.ps1 -Operation push -Force
```

### Full Sync (Pull + Push)
```powershell
# Complete sync operation
.\safe-git-sync.ps1 -Operation sync
```

---

## 🛡️ Protected Files (AUTO-PRESERVED)

These files contain critical API and booking logic. The script **automatically keeps your local version** during conflicts:

### Backend (C# API)
- `SkaEV.API/Application/Services/StationService.cs` ⭐
- `SkaEV.API/Application/Services/BookingService.cs` ⭐
- `SkaEV.API/Controllers/StationsController.cs` ⭐
- `SkaEV.API/Controllers/BookingsController.cs`
- `SkaEV.API/Application/DTOs/Stations/ChargingPostWithSlotsDto.cs` ⭐
- `SkaEV.API/Application/DTOs/Stations/ChargingSlotDto.cs` ⭐

### Frontend (React)
- `src/services/api.js` ⭐
- `src/pages/customer/ChargingFlow.jsx` ⭐
- `src/components/customer/BookingModal.jsx` ⭐
- `src/store/bookingStore.js` ⭐
- `src/hooks/useMasterDataSync.js` ⭐

⭐ = Recently modified with critical booking flow improvements

---

## 🔧 Manual Conflict Resolution

If the script encounters conflicts it can't auto-resolve:

### Keep Local Version (API/Database logic)
```powershell
git checkout --ours <file>
git add <file>
```

### Keep Remote Version (UI/Documentation)
```powershell
git checkout --theirs <file>
git add <file>
```

### Manual Merge (Both have valuable changes)
```powershell
# Open in VS Code merge editor
code <file>

# Or use git merge tool
git mergetool <file>
```

### Complete the merge
```powershell
git commit -m "Merge: preserved local API logic"
```

---

## 🆘 Emergency Rollback

If something goes wrong after sync:

### Option 1: Abort Ongoing Merge
```powershell
git merge --abort
```

### Option 2: Reset to Backup Branch
```powershell
# List backup branches
git branch | Select-String "backup-local"

# Reset to backup (replace timestamp)
git reset --hard backup-local-api-20250103
```

### Option 3: Restore from Stash
```powershell
# List stashes
git stash list

# Apply most recent stash
git stash apply stash@{0}

# Or pop (apply + remove from stash)
git stash pop
```

---

## ✅ Pre-Push Validation Checklist

**ALWAYS verify these before pushing:**

- [ ] Backend API is running: `.\start-backend.ps1`
- [ ] Test API endpoints: `.\test-integration-simple.ps1`
- [ ] Frontend loads without errors
- [ ] Can select a charging station on map
- [ ] Booking modal opens and shows correct slot data
- [ ] Slot selection works
- [ ] Database queries return expected results
- [ ] No console errors related to API calls

### Quick Test Commands
```powershell
# Start backend
.\start-backend.ps1

# Test frontend flow
.\test-frontend-flow.ps1

# Test API integration
.\test-integration-simple.ps1

# Check specific booking endpoint
curl http://localhost:5000/api/stations/1/posts
```

---

## 📊 Understanding Conflict Types

### 🔴 HIGH RISK - Keep Local
**Files containing:**
- API endpoint definitions
- Database query logic
- Booking flow state management
- Data transformation between API ↔ Database
- Authentication/authorization for charging APIs

**Action:** `git checkout --ours <file>`

### 🟡 MEDIUM RISK - Evaluate
**Files containing:**
- UI component logic that calls APIs
- Store/state management
- API response handlers

**Action:** Manual review - keep API calls, merge UI improvements

### 🟢 LOW RISK - Can Accept Remote
**Files containing:**
- Pure UI/styling changes
- Documentation
- Configuration (except API endpoints)
- Test files

**Action:** `git checkout --theirs <file>` (if safe)

---

## 🎯 Common Scenarios

### Scenario 1: Fast-Forward Pull (No Conflicts)
```powershell
.\safe-git-sync.ps1 -Operation pull
# ✅ Automatically merges, restores your changes
```

### Scenario 2: Pull with Conflicts in Critical Files
```powershell
.\safe-git-sync.ps1 -Operation pull
# ⚠️ Script auto-resolves to keep local API logic
# ℹ️ Review changes and commit
git commit -m "Merge: preserved local API logic"
```

### Scenario 3: Pull with Conflicts in Non-Critical Files
```powershell
.\safe-git-sync.ps1 -Operation pull
# ⚠️ Script warns about manual resolution needed
# Choose per file:
git checkout --ours README.md  # Keep local
git checkout --theirs docs/SETUP.md  # Keep remote
git add .
git commit -m "Merge: resolved docs conflicts"
```

### Scenario 4: Full Sync (Pull + Push)
```powershell
.\safe-git-sync.ps1 -Operation sync
# 1. Pulls with conflict protection
# 2. Asks for validation
# 3. Pushes with --force-with-lease
```

---

## 🔍 Verify Your Current Changes

Before syncing, review what you've changed:

```powershell
# See modified files
git status

# See detailed changes
git diff

# See changes in specific file
git diff src/services/api.js

# Compare with remote
git fetch origin
git diff origin/develop..HEAD
```

---

## 📝 Current Critical Changes (as of 2025-11-03)

Your local branch has these critical improvements:

1. **ChargingPostWithSlotsDto.cs** (NEW) - Post-centric data structure
2. **StationService.cs** - GetAvailablePostsAsync() method
3. **StationsController.cs** - GET /api/stations/{id}/posts endpoint
4. **api.js** - getAvailablePosts() API call
5. **ChargingFlow.jsx** - Real-time stats from API
6. **BookingModal.jsx** - Post-based slot display with formatting

**These changes fix:**
- ❌ Outside display showing "2/24 cổng trống" (wrong data)
- ❌ Inside modal showing incorrect slot count
- ✅ Now displays 100% database-driven slot information
- ✅ Correct formatting: "Trụ sạc 01 — Cổng 1"

---

## 💡 Best Practices

1. **Always backup before major operations**
   - Script does this automatically
   - Creates branch + stash

2. **Pull frequently to minimize conflicts**
   - Daily pulls keep your branch up-to-date
   - Smaller conflicts are easier to resolve

3. **Test before pushing**
   - Use the validation checklist
   - Run integration tests

4. **Document conflict resolutions**
   - Add notes to commit messages
   - Explain why you chose local over remote

5. **Keep team informed**
   - Notify team about critical API changes
   - Document breaking changes

---

## 🔗 Related Scripts

- `start-backend.ps1` - Start ASP.NET backend API
- `run-frontend.ps1` - Start React frontend
- `test-integration-simple.ps1` - Test API endpoints
- `test-frontend-flow.ps1` - Test booking flow
- `stop-backend.ps1` - Stop backend gracefully

---

## 📞 Need Help?

If you encounter issues:

1. Check backup branch exists: `git branch | Select-String backup`
2. Check stash exists: `git stash list`
3. Review this guide's Emergency Rollback section
4. Ask team for help with specific conflicts

---

**Remember: When in doubt, KEEP LOCAL API LOGIC! 🔒**
