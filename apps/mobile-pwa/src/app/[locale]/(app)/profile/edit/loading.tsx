import { FormSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="px-5 pb-28 pt-2">
      <FormSkeleton fields={4} />
    </div>
  );
}
