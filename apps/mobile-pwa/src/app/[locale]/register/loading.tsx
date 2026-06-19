import { FormSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <FormSkeleton fields={4} />
      </div>
    </div>
  );
}
