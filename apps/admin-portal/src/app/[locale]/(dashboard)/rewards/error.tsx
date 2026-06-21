"use client";
import { ErrorPage } from "@likaslens/shared";
export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorPage message={error.message} reset={reset} />;
}
