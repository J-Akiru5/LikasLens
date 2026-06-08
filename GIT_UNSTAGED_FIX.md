# Fixing "Unstaged Changes" Error Before Rebase

## The Problem
```
error: cannot rebase: You have unstaged changes.
error: Please commit or stash them.
```

This means Git found files that have been modified but not staged/committed.

---

## Solution - Choose One

### Option 1: Stash Changes (Recommended - Temporary Storage)
This temporarily saves your changes, lets you rebase, then restores them:

```bash
git stash
git rebase origin/development
git stash pop
```

**What this does:**
- `git stash` - Saves changes to a temporary location
- `git rebase origin/development` - Rebases cleanly
- `git stash pop` - Restores your changes

---

### Option 2: Discard Changes (If You Don't Need Them)
If the changes aren't important:

```bash
git checkout -- .
git rebase origin/development
```

**Warning:** This deletes your local changes permanently!

---

### Option 3: Commit the Changes
If you want to keep the changes as part of the commit:

```bash
git add .
git commit -m "Save work in progress"
git rebase origin/development
```

---

## Quick Steps to Follow

**Run these in order:**

```bash
# 1. Stash your changes
git stash

# 2. Rebase on development
git rebase origin/development

# 3. Restore your changes
git stash pop

# 4. Push to remote
git push origin ui-experiment --force-with-lease
```

---

## If Stash Pop Shows Conflicts

If `git stash pop` creates conflicts:

```bash
git add .
git commit -m "Merge stashed changes"
```

Then try pushing:
```bash
git push origin ui-experiment --force-with-lease
```

---

## Summary

The easiest fix is:
```bash
git stash && git rebase origin/development && git stash pop
```

Then check with:
```bash
git status
```

Should show "working tree clean" ✅
