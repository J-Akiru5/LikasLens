#!/bin/sh
# Vercel deploy gate — only build on main and staging.
# Exit 1 = proceed with build. Exit 0 = skip build.

case "$VERCEL_GIT_COMMIT_REF" in
  main|staging)
    exit 1
    ;;
  *)
    exit 0
    ;;
esac
