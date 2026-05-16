# Fixing Git Merge State Error

## The Problem
You got this error:
```
apps/frontend/src/app/report/page.tsx: needs merge
error: you need to resolve your current index first
```

This means Git is stuck in the middle of a merge operation.

---

## Solution

### Step 1: Abort the Current Merge (Reset to Clean State)
```bash
git merge --abort
```

This will cancel the incomplete merge and return to your previous state.

### Step 2: Verify Clean State
```bash
git status
```

You should see:
```
On branch development
nothing to commit, working tree clean
```

### Step 3: Fetch the Latest Changes
```bash
git fetch origin
```

### Step 4: Switch to ui-experiment Branch
```bash
git checkout ui-experiment
```

### Step 5: Rebase on Development (Cleaner than Merge)
Instead of merging, rebase to avoid conflicts:
```bash
git rebase origin/development
```

If conflicts appear during rebase:
1. **Fix the conflicts** in the editor
2. Then continue:
   ```bash
   git add .
   git rebase --continue
   ```

### Step 6: Push to Remote
```bash
git push origin ui-experiment --force-with-lease
```

---

## If You Want to Merge Instead

After Step 3:
```bash
# Switch to ui-experiment
git checkout ui-experiment

# Merge development into ui-experiment
git merge origin/development

# If conflicts appear, fix them in apps/frontend/src/app/report/page.tsx
# Then:
git add apps/frontend/src/app/report/page.tsx
git commit -m "Resolve merge conflict in report/page.tsx"
git push origin ui-experiment
```

---

## TL;DR - Quick Fix

```bash
git merge --abort
git fetch origin
git checkout ui-experiment
git rebase origin/development
git push origin ui-experiment --force-with-lease
```

---

## What's the Difference?

| Command | Result |
|---------|--------|
| `git merge` | Creates a merge commit, preserves history |
| `git rebase` | Replays commits on top of base, cleaner history |

For PRs, either works, but rebase is often cleaner.

---

## Then Merge in GitHub

Once pushed, go to PR #52 and click **"Merge pull request"** - it should work now!
