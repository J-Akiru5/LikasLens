import { FormSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 sm:p-6">
      <div className="panel w-full max-w-md p-8">
        <FormSkeleton fields={2} />
      </div>
    </div>
  );
}
