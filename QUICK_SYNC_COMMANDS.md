# 🚀 Quick Git Sync Commands

## Before You Start
```powershell
# Check what you've changed
git status

# Your backup branch: backup-local-api-logic-20250103
# Your stash: backup-critical-api-logic-20250103 (already restored)
```

---

## Option 1: Safe Pull (RECOMMENDED FIRST)
```powershell
.\safe-git-sync.ps1 -Operation pull
```
**What it does:**
- ✅ Creates backup branch automatically
- ✅ Stashes your changes
- ✅ Pulls from remote
- ✅ Auto-resolves conflicts (keeps your API logic)
- ✅ Restores your changes

---

## Option 2: Manual Pull (If you want full control)
```powershell
# 1. Pull and see what happens
git pull origin develop

# 2. If conflicts in critical files, keep yours:
git checkout --ours SkaEV.API/Application/Services/StationService.cs
git checkout --ours SkaEV.API/Controllers/StationsController.cs
git checkout --ours src/services/api.js
git checkout --ours src/pages/customer/ChargingFlow.jsx
git checkout --ours src/components/customer/BookingModal.jsx
git add .

# 3. Complete the merge
git commit -m "Merge develop: preserved local API logic for booking flow"
```

---

## Option 3: Safe Full Sync (Pull + Validate + Push)
```powershell
.\safe-git-sync.ps1 -Operation sync
```
**Follow the validation checklist when prompted!**

---

## Validation Before Push
```powershell
# Start backend
.\start-backend.ps1

# Test API (in another terminal)
curl http://localhost:5000/api/stations/1/posts

# Start frontend
npm run dev

# Test in browser:
# 1. Go to http://localhost:5173
# 2. Click a charging station on map
# 3. Verify modal shows: "Trụ sạc 01 — Cổng 1, 2, 3, 4"
# 4. Check no console errors
```

---

## Push After Validation
```powershell
# Safe push (checks if remote changed)
git push --force-with-lease origin develop

# OR use the script
.\safe-git-sync.ps1 -Operation push
```

---

## Emergency: Undo Everything
```powershell
# Go back to your backup
git reset --hard backup-local-api-logic-20250103

# Re-apply your changes if needed
git stash list
git stash apply stash@{1}
```

---

## Summary of Your Critical Files
These will be auto-protected during merge conflicts:

**Backend:**
- `SkaEV.API/Application/Services/StationService.cs` ← GetAvailablePostsAsync()
- `SkaEV.API/Controllers/StationsController.cs` ← GET /posts endpoint
- `SkaEV.API/Application/DTOs/Stations/ChargingPostWithSlotsDto.cs` ← NEW DTO

**Frontend:**
- `src/services/api.js` ← getAvailablePosts()
- `src/pages/customer/ChargingFlow.jsx` ← Real-time stats from API
- `src/components/customer/BookingModal.jsx` ← Post-based display

---

## 👉 RECOMMENDED WORKFLOW

```powershell
# Step 1: Safe pull with auto-protection
.\safe-git-sync.ps1 -Operation pull

# Step 2: Check if everything still works
.\start-backend.ps1
npm run dev
# Test in browser...

# Step 3: Commit any remaining changes
git add .
git commit -m "Merge: preserved API logic + resolved conflicts"

# Step 4: Push
git push --force-with-lease origin develop
```

---

**Need help? Check `GIT_SYNC_GUIDE.md` for detailed instructions.**
