import fs from "fs";
import path from "path";

export type ChangelogEntry = {
  type: string;
  scope: string;
  description: string;
};

export type ChangelogVersion = {
  version: string;
  date: string;
  entries: Record<string, ChangelogEntry[]>;
};

const SECTION_TYPES = ["Added", "Fixed", "Changed", "Removed", "Deprecated", "Security"];

export function getChangelog(): ChangelogVersion[] {
  const changelogPath = path.join(process.cwd(), "..", "..", "CHANGELOG.md");

  if (!fs.existsSync(changelogPath)) {
    return [];
  }

  const content = fs.readFileSync(changelogPath, "utf-8");
  const versions: ChangelogVersion[] = [];

  const versionBlocks = content.split(/^## \[/m).slice(1);

  for (const block of versionBlocks) {
    const headerMatch = block.match(/^\[?([^\]]+)\]?\s*-\s*(\d{4}-\d{2}-\d{2})/);
    if (!headerMatch) continue;

    const version = headerMatch[1];
    const date = headerMatch[2];

    if (version === "Unreleased") continue;

    const entries: Record<string, ChangelogEntry[]> = {};
    let currentSection = "";

    const lines = block.split("\n").slice(1);
    for (const line of lines) {
      const sectionMatch = line.match(/^### (\w+)/);
      if (sectionMatch && SECTION_TYPES.includes(sectionMatch[1])) {
        currentSection = sectionMatch[1];
        entries[currentSection] = [];
        continue;
      }

      if (currentSection && line.startsWith("- ")) {
        const entryText = line.slice(2);
        const scopeMatch = entryText.match(/^\*\*(.+?)\*\*:\s*(.+)/);

        entries[currentSection].push({
          type: currentSection,
          scope: scopeMatch ? scopeMatch[1] : "General",
          description: scopeMatch ? scopeMatch[2] : entryText,
        });
      }
    }

    versions.push({ version, date, entries });
  }

  return versions;
}
