# Resolving Merge Conflict in PR #52

## Problem
PR #52 ("feat: enhance accessibility and animations across components") has a merge conflict in:
- `apps/frontend/src/app/report/page.tsx`

You cannot merge until this is resolved.

---

## Solutions

### Option 1: Resolve via GitHub Web Editor (Recommended - Easiest)

1. Go to the PR: https://github.com/J-Akiru5/LikasLens/pull/52
2. Click the **"Resolve conflicts"** button
3. GitHub will show the conflicting sections marked with `<<<<<<<`, `=======`, `>>>>>>>`
4. **Edit directly** in the web editor:
   - Remove the markers (`<<<<<<<`, `=======`, `>>>>>>>`)
   - Keep the code you want
   - Save the changes
5. Click **"Mark as resolved"**
6. Click **"Commit merge"**

---

### Option 2: Resolve Locally via Command Line

If you prefer to resolve locally:

#### Step 1: Fetch the Branch
```bash
git fetch origin
git checkout ui-experiment
```

#### Step 2: Try to Merge Development
```bash
git merge origin/development
```

This will show which files have conflicts.

#### Step 3: Fix the Conflict
Edit `apps/frontend/src/app/report/page.tsx` and look for conflict markers:

```
<<<<<<< HEAD (current branch - ui-experiment)
  [code from ui-experiment]
=======
  [code from development]
>>>>>>> origin/development
```

**Choose one of these approaches:**
- **Keep ui-experiment**: Delete everything between `=======` and `>>>>>`
- **Keep development**: Delete everything between `<<<<<<<` and `=======`
- **Merge both**: Edit to combine both versions intelligently

#### Step 4: Mark as Resolved
```bash
git add apps/frontend/src/app/report/page.tsx
```

#### Step 5: Complete the Merge
```bash
git commit -m "Resolve merge conflict in report/page.tsx"
```

#### Step 6: Push to Remote
```bash
git push origin ui-experiment
```

The PR will automatically update on GitHub and the conflict will be resolved.

---

### Option 3: Use VS Code Merge Conflict Resolver

If you have the branch checked out locally:

1. Open the conflicted file: `apps/frontend/src/app/report/page.tsx`
2. VS Code will show merge conflict buttons above the conflict:
   - **Accept Current Change** (keep ui-experiment version)
   - **Accept Incoming Change** (keep development version)
   - **Accept Both Changes** (merge both)
3. Click the appropriate button
4. Save the file
5. Commit and push

---

## Understanding the Conflict

The conflict likely occurred because:
- The `ui-experiment` branch made changes to `report/page.tsx`
- The `development` branch also made changes to the same file
- Both branches diverged from a common ancestor

---

## Best Practice Moving Forward

To avoid conflicts:
1. **Keep branches up-to-date**: `git rebase origin/development` before pushing
2. **Communicate changes**: Coordinate with team on what files you're modifying
3. **Merge frequently**: Don't let branches diverge for too long
4. **Use pull requests**: Always use PRs for code review before merging

---

## Quick Reference

| Action | Command |
|--------|---------|
| Fetch latest | `git fetch origin` |
| Switch to branch | `git checkout ui-experiment` |
| Show conflicts | `git status` |
| Abort merge | `git merge --abort` |
| Complete merge | `git add . && git commit -m "Merge message"` |

---

## Need Help?

If you get stuck:
1. Click **"Resolve conflicts"** on GitHub for the easiest path
2. Or run `git merge --abort` locally to reset and try again
3. Check the actual conflict markers in the file to understand what changed

The conflict marker format is:
```
<<<<<<< HEAD
Your changes
=======
Their changes  
>>>>>>> branch-name
```

Choose one section or merge them manually, then remove the markers.
