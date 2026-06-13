import { redirect } from "next/navigation";

export default function ProfileSettingsPage() {
  redirect("/profile?tab=settings");
}
