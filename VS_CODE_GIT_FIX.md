# VS Code Git Conflict Resolution - Step by Step

## What's Happening
VS Code is showing: "Git: mark them as resolved using git add"

This means you have conflicted files that need to be resolved before pushing.

---

## Steps to Fix

### Step 1: Click "Cancel" on the Dialog
This will close the popup without doing anything yet.

### Step 2: Replace the Conflicted File
In your terminal:

```bash
cd apps/frontend/src/app/report
# Remove the conflicted version
del page.tsx

# Rename the clean version to the correct name
ren page-clean.tsx page.tsx
```

OR in VS Code:
1. Right-click `page.tsx` → Delete
2. Right-click `page-clean.tsx` → Rename to `page.tsx`

### Step 3: Mark as Resolved
```bash
git add apps/frontend/src/app/report/page.tsx
```

### Step 4: Complete the Rebase
```bash
git rebase --continue
```

### Step 5: Push to Remote
```bash
git push origin ui-experiment --force-with-lease
```

---

## Terminal Command (All at Once)

```bash
cd c:\LikasLens\LikasLens\apps\frontend\src\app\report
del page.tsx
ren page-clean.tsx page.tsx
cd c:\LikasLens\LikasLens
git add apps/frontend/src/app/report/page.tsx
git rebase --continue
git push origin ui-experiment --force-with-lease
```

---

## Expected Outcome

After these steps:
- ✅ Conflicts resolved
- ✅ Rebase completed
- ✅ Changes pushed to remote
- ✅ PR #52 will be mergeable

Then go to GitHub and merge PR #52 to development!
