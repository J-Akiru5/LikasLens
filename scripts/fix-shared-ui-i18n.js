const fs = require("fs");
const path = require("path");

// ─── Step 1: Add sharedUi keys to en.json ───────────────────────────────
const enPath = "apps/shared/src/i18n/messages/en.json";
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

const sharedUi = {
  // app-header
  notifications: "Notifications",
  markAllRead: "Mark all read",
  noNewNotifications: "No new notifications",
  allCaughtUp: "You're all caught up!",
  viewAll: "View All Notifications",
  switchToGhost: "Switch to Ghost mode",
  switchToCivic: "Switch to Civic mode",
  toggleGhostMode: "Toggle Ghost Mode",
  openNavMenu: "Open navigation menu",
  slaEscalation: "SLA Escalation",
  ticketUpdate: "Ticket Update",
  notification: "Notification",
  newNotification: "You have a new notification",

  // global-search
  tickets: "Tickets",
  laws: "Laws",
  ngo: "NGOs",
  users: "Users",
  searchPlaceholder: "Search tickets, laws, NGOs, users...",
  noResultsFor: "No results for",
  tryDifferentSearch: "Try a different search term or browse the sidebar",
  typeToSearch: "Type to search across all entities",
  toOpenAnytime: "to open anytime",
  go: "Go",

  // sidebar
  search: "Search...",
  collapseSidebar: "Collapse Sidebar",
  expandSidebar: "Expand Sidebar",
  backToHome: "Back to Home",
  closeSidebar: "Close sidebar",

  // error-page
  somethingWentWrong: "Something went wrong",
  unexpectedError: "An unexpected error occurred. Please try again.",
  tryAgain: "Try again",
  goHome: "Go home",
  pageNotFound: "Page not found",
  pageMoved: "This page doesn't exist or has been moved.",
  backToHomeAction: "Back to home",

  // modal
  closeDialog: "Close dialog",
  confirm: "Confirm",
  cancel: "Cancel",

  // mobile-header
  closeNotifications: "Close notifications",

  // pwa-install-prompt
  installLikasLens: "Install LikasLens",
  addToHomeScreen: "Add to Home Screen",
  installDescIOS: "Install the app for offline reports, push alerts, and a native experience.",
  installDescAndroid: "Get offline reports, instant notifications, and faster access right from your home screen.",
  worksOffline: "Works offline — report without internet",
  opensInstantly: "Opens instantly, no browser chrome",
  installNow: "Install Now",
  notNow: "Not now",
  gotIt: "Got it",
  shareInstructions: "Tap the Share button in Safari, then scroll down and tap Add to Home Screen.",

  // theme-toggle
  ghostMode: "Ghost Mode",

  // pull-to-refresh
  refreshing: "Refreshing...",
  releaseToRefresh: "Release to refresh",
  pullToRefresh: "Pull to refresh",

  // mobile-layout
  back: "Back",
  noNotificationsYet: "No notifications yet",

  // incident-drawer
  untitledIncident: "Untitled Incident",
  unclassified: "Unclassified",

  // stats-cards
  down: "Down",
  flat: "Flat",

  // language-dropdown
  switchLanguage: "Switch language",

  // public-scoreboard
  unknown: "Unknown",
  environmentalIssue: "Environmental Issue",
  open: "Open",

  // toast
  dismissNotification: "Dismiss notification",
};

en.sharedUi = sharedUi;
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + "\n");
console.log("✅ Added sharedUi section to en.json");

// ─── Step 2: Fix each shared UI file ────────────────────────────────────
const uiDir = "apps/shared/src/ui";

function fixFile(fileName, replacements) {
  const filePath = path.join(uiDir, fileName);
  const content = fs.readFileSync(filePath, "utf8");

  let newContent = content;
  let changed = 0;

  // Add import if not present
  if (!content.includes('import { useTranslations } from "next-intl"')) {
    const firstImportEnd = content.indexOf('";\n', content.indexOf('"use client"')) + 3;
    const insertAfter = content.indexOf("\n", firstImportEnd) + 1;
    newContent = newContent.slice(0, insertAfter) + 'import { useTranslations } from "next-intl";\n' + newContent.slice(insertAfter);
    changed++;
  }

  // Apply specific string replacements
  for (const [oldStr, newStr] of Object.entries(replacements)) {
    if (newContent.includes(oldStr)) {
      newContent = newContent.replace(oldStr, newStr);
      changed++;
    }
  }

  if (changed > 0) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Fixed ${fileName} (${changed} changes)`);
  } else {
    console.log(`⏭️  Skipped ${fileName} (no changes needed)`);
  }
}

// ─── Individual file fixes ─────────────────────────────────────────────

// app-header.tsx
fixFile("app-header.tsx", {
  // Replace getNotifTitle hardcoded strings
  'return "SLA Escalation"': 'return t("slaEscalation")',
  'return to ? `Ticket ${to.charAt(0).toUpperCase() + to.slice(1)}` : "Ticket Update"':
    'return to ? `Ticket ${to.charAt(0).toUpperCase() + to.slice(1)}` : t("ticketUpdate")',
  'return "Notification"': 'return t("notification")',
  'return n.data.message || "You have a new notification"':
    'return n.data.message || t("newNotification")',

  // Replace aria-labels
  'aria-label="Open navigation menu"': 'aria-label={t("openNavMenu")}',
  'aria-label={isGhostMode ? "Switch to Civic mode" : "Switch to Ghost mode"}':
    'aria-label={isGhostMode ? t("switchToCivic") : t("switchToGhost")}',
  'title="Toggle Ghost Mode"': 'title={t("toggleGhostMode")}',
  'aria-label="Notifications"': 'aria-label={t("notifications")}',

  // Replace notification panel text
  '<span className="font-mono text-xs text-ink uppercase tracking-wider">\n                    Notifications\n                  </span>':
    '<span className="font-mono text-xs text-ink uppercase tracking-wider">\n                    {t("notifications")}\n                  </span>',
  'Mark all read': '{t("markAllRead")}',
  'No new notifications': '{t("noNewNotifications")}',
  "You&apos;re all caught up!": "{t(\"allCaughtUp\")}",
  'View All Notifications': '{t("viewAll")}',
});

// Add t() hook to app-header
const appHeaderPath = path.join(uiDir, "app-header.tsx");
let appHeaderContent = fs.readFileSync(appHeaderPath, "utf8");
if (!appHeaderContent.includes("const t = useTranslations")) {
  appHeaderContent = appHeaderContent.replace(
    "export function AppHeader({",
    "const t = useTranslations(\"sharedUi\");\n\nexport function AppHeader({"
  );
  fs.writeFileSync(appHeaderPath, appHeaderContent);
  console.log("✅ Added t() hook to app-header.tsx");
}

// error-page.tsx — use default props pattern (hardcoded defaults are acceptable as fallbacks, but add t() for component body)
fixFile("error-page.tsx", {
  'title="Something went wrong"': "title",
  'message="An unexpected error occurred. Please try again."': "message",
  // The default props are fine — they're user-configurable. But the Try again / Go home button text should use t()
  'Try again': '{t("tryAgain")}',
  'Go home': '{t("goHome")}',
  'title = "Page not found"': "title",
  'message = "This page doesn\'t exist or has been moved."': "message",
  'action = { label: "Back to home", href: "/" }': "action",
  "{action.label}": "{action.label}",
});

// Add t() hook to error-page
const errorPagePath = path.join(uiDir, "error-page.tsx");
let errorPageContent = fs.readFileSync(errorPagePath, "utf8");
if (!errorPageContent.includes("const t = useTranslations")) {
  errorPageContent = errorPageContent.replace(
    "export function ErrorPage({",
    "const t = useTranslations(\"sharedUi\");\n\nexport function ErrorPage({"
  );
  // Also add to NotFoundPage
  errorPageContent = errorPageContent.replace(
    "export function NotFoundPage({",
    "const t = useTranslations(\"sharedUi\");\n\nexport function NotFoundPage({"
  );
  fs.writeFileSync(errorPagePath, errorPageContent);
  console.log("✅ Added t() hooks to error-page.tsx");
}

// modal.tsx — add useTranslations for ConfirmModal defaults
fixFile("modal.tsx", {
  'aria-label={title || "Dialog"}': 'aria-label={title || t("closeDialog")}',
  'aria-label="Close dialog"': 'aria-label={t("closeDialog")}',
  'confirmLabel = "Confirm"': "confirmLabel",
  'cancelLabel = "Cancel"': "cancelLabel",
});

// Add t() hook to modal
const modalPath = path.join(uiDir, "modal.tsx");
let modalContent = fs.readFileSync(modalPath, "utf8");
if (!modalContent.includes("const t = useTranslations")) {
  modalContent = modalContent.replace(
    "export function Modal({",
    "const t = useTranslations(\"sharedUi\");\n\nexport function Modal({"
  );
  fs.writeFileSync(modalPath, modalContent);
  console.log("✅ Added t() hook to modal.tsx");
}

// mobile-header.tsx
fixFile("mobile-header.tsx", {
  'aria-label="Open navigation menu"': 'aria-label={t("openNavMenu")}',
  'aria-label={isGhostMode ? "Switch to Civic mode" : "Switch to Ghost mode"}':
    'aria-label={isGhostMode ? t("switchToCivic") : t("switchToGhost")}',
  'aria-label="Notifications"': 'aria-label={t("notifications")}',
  'aria-label="Close notifications"': 'aria-label={t("closeNotifications")}',
});

// Add t() hook to mobile-header
const mobHdrPath = path.join(uiDir, "mobile-header.tsx");
let mobHdrContent = fs.readFileSync(mobHdrPath, "utf8");
if (!mobHdrContent.includes("const t = useTranslations")) {
  mobHdrContent = mobHdrContent.replace(
    "export function MobileHeader({",
    "const t = useTranslations(\"sharedUi\");\n\nexport function MobileHeader({"
  );
  fs.writeFileSync(mobHdrPath, mobHdrContent);
  console.log("✅ Added t() hook to mobile-header.tsx");
}

// mobile-layout.tsx
fixFile("mobile-layout.tsx", {
  'aria-label={isGhostMode ? "Switch to Civic mode" : "Switch to Ghost mode"}':
    'aria-label={isGhostMode ? t("switchToCivic") : t("switchToGhost")}',
  'aria-label="Notifications"': 'aria-label={t("notifications")}',
  'aria-label="Back"': 'aria-label={t("back")}',
});

// Add t() hook to mobile-layout
const mobLayoutPath = path.join(uiDir, "mobile-layout.tsx");
let mobLayoutContent = fs.readFileSync(mobLayoutPath, "utf8");
if (!mobLayoutContent.includes("const t = useTranslations")) {
  // Add after LanguageDropdown import
  mobLayoutContent = mobLayoutContent.replace(
    "import { LanguageDropdown } from \"./language-dropdown\";",
    "import { LanguageDropdown } from \"./language-dropdown\";\nconst t = useTranslations(\"sharedUi\");"
  );
  // Add import
  mobLayoutContent = mobLayoutContent.replace(
    'import { usePathname } from "next/navigation";',
    'import { usePathname } from "next/navigation";\nimport { useTranslations } from "next-intl";'
  );
  fs.writeFileSync(mobLayoutPath, mobLayoutContent);
  console.log("✅ Added t() hook to mobile-layout.tsx");
}

// theme-toggle.tsx
fixFile("theme-toggle.tsx", {
  'aria-label={`Switch to ${isGhostMode ? "Civic" : "Ghost"} mode`}':
    'aria-label={`Switch to ${isGhostMode ? t("switchToCivic") : t("switchToGhost")} mode`}',
});

// Add useTranslations and t("ghostMode") to theme-toggle
const themeTogglePath = path.join(uiDir, "theme-toggle.tsx");
let themeToggleContent = fs.readFileSync(themeTogglePath, "utf8");
if (!themeToggleContent.includes("useTranslations")) {
  themeToggleContent = themeToggleContent.replace(
    'import { useEffect, useState } from "react";',
    'import { useEffect, useState } from "react";\nimport { useTranslations } from "next-intl";'
  );
  themeToggleContent = themeToggleContent.replace(
    "export function ThemeToggle({",
    "const t = useTranslations(\"sharedUi\");\n\nexport function ThemeToggle({"
  );
  themeToggleContent = themeToggleContent.replace(
    "Ghost Mode",
    "{t(\"ghostMode\")}"
  );
  fs.writeFileSync(themeTogglePath, themeToggleContent);
  console.log("✅ Added t() hook to theme-toggle.tsx");
}

// toast.tsx — aria-label fix
fixFile("toast.tsx", {
  'aria-label="Dismiss notification"': 'aria-label={t("dismissNotification")}',
});

// Add t() hook to toast
const toastPath = path.join(uiDir, "toast.tsx");
let toastContent = fs.readFileSync(toastPath, "utf8");
if (!toastContent.includes("const t = useTranslations")) {
  toastContent = toastContent.replace(
    "function ToastContainerUI({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {",
    "const t = useTranslations(\"sharedUi\");\nfunction ToastContainerUI({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {"
  );
  fs.writeFileSync(toastPath, toastContent);
  console.log("✅ Added t() hook to toast.tsx");
}

// pull-to-refresh.tsx
fixFile("pull-to-refresh.tsx", {
  'refreshing ? "Refreshing..." : pullDistance >= THRESHOLD ? "Release to refresh" : "Pull to refresh"':
    'refreshing ? t("refreshing") : pullDistance >= THRESHOLD ? t("releaseToRefresh") : t("pullToRefresh")',
  'return "Refreshing..."': 'return t("refreshing")',
});

// Add t() hook to pull-to-refresh
const ptrPath = path.join(uiDir, "pull-to-refresh.tsx");
let ptrContent = fs.readFileSync(ptrPath, "utf8");
if (!ptrContent.includes("const t = useTranslations")) {
  ptrContent = ptrContent.replace(
    "export function PullToRefresh({",
    "const t = useTranslations(\"sharedUi\");\n\nexport function PullToRefresh({"
  );
  fs.writeFileSync(ptrPath, ptrContent);
  console.log("✅ Added t() hook to pull-to-refresh.tsx");
}

// sidebar.tsx
fixFile("sidebar.tsx", {
  'placeholder="Search..."': 'placeholder={t("search")}',
  'placeholder="Search"': 'placeholder={t("search")}',
  '>Collapse Sidebar<': ">{t(\"collapseSidebar\")}<",
  'title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}':
    'title={isDesktopCollapsed ? t("expandSidebar") : t("collapseSidebar")}',
  'title={isDesktopCollapsed ? "Back to Home" : undefined}':
    'title={isDesktopCollapsed ? t("backToHome") : undefined}',
  '>Back to Home<': ">{t(\"backToHome\")}<",
  'aria-label="Close sidebar"': 'aria-label={t("closeSidebar")}',
  '<span>Collapse Sidebar</span>': '<span>{t("collapseSidebar")}</span>',
});

// Add t() hook to sidebar
const sidebarPath = path.join(uiDir, "sidebar.tsx");
let sidebarContent = fs.readFileSync(sidebarPath, "utf8");
if (!sidebarContent.includes("const t = useTranslations")) {
  sidebarContent = sidebarContent.replace(
    "export function Sidebar({",
    "const t = useTranslations(\"sharedUi\");\n\nexport function Sidebar({"
  );
  fs.writeFileSync(sidebarPath, sidebarContent);
  console.log("✅ Added t() hook to sidebar.tsx");
}

console.log("\n✅ All shared UI component fixes applied!");
