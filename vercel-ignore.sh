#!/bin/bash

# Vercel Ignored Build Step Script
# Exits with 1 to proceed with the build (when pushing to main branch)
# Exits with 0 to skip the build (for all other branches)

echo "Checking deployment eligibility for branch: '$VERCEL_GIT_COMMIT_REF'"

if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "✅ Target branch is 'main'. Proceeding with build."
  exit 1
else
  echo "🛑 Target branch is '$VERCEL_GIT_COMMIT_REF', not 'main'. Skipping build."
  exit 0
fi
