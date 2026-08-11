#!/usr/bin/env node
// Builds the Version Packages pull request body from the release plan captured
// before `changeset version` and the changelog entries generated afterward.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_MAX_BODY_LENGTH = 60_000;
const BODY_INTRO =
  "This pull request was opened by the release workflow. Merge it to publish the versions below. Pending changesets on `main` will update this pull request.";

export function extractChangelogEntry(changelog, version) {
  const lines = changelog.split("\n");
  let start;
  let fence;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (fence === undefined) {
        fence = marker;
      } else if (marker[0] === fence[0] && marker.length >= fence.length) {
        fence = undefined;
      }
      continue;
    }

    if (fence !== undefined) continue;

    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (!heading) continue;

    if (start === undefined) {
      if (heading[1] === version) start = index + 1;
      continue;
    }

    return lines.slice(start, index).join("\n").trim();
  }

  if (start !== undefined) return lines.slice(start).join("\n").trim();
  throw new Error(`Could not find changelog entry for version ${version}`);
}

export function renderVersionPullRequestBody(releases, maxLength = DEFAULT_MAX_BODY_LENGTH) {
  const headings = releases.map(({ name, version }) => `## ${name}@${version}`);
  const sections = releases.map(
    ({ name, version, content }) => `## ${name}@${version}\n\n${content}`,
  );
  const fullBody = `${BODY_INTRO}\n\n# Releases\n\n${sections.join("\n\n")}`;

  if (fullBody.length <= maxLength) return fullBody;

  const compactBody = `${BODY_INTRO}\n\n# Releases\n\n> The changelog entries were omitted because the pull request body exceeded GitHub's size limit.\n\n${headings.join("\n\n")}`;
  if (compactBody.length <= maxLength) return compactBody;

  return `${BODY_INTRO}\n\n# Releases\n\n> The release summary was omitted because the pull request body exceeded GitHub's size limit.`;
}

function workspacePatterns(root) {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  return Array.isArray(manifest.workspaces) ? manifest.workspaces : manifest.workspaces?.packages;
}

function workspaceDirectories(root) {
  const directories = [];

  for (const pattern of workspacePatterns(root) ?? []) {
    if (pattern.endsWith("/*")) {
      const parent = pattern.slice(0, -2);
      for (const entry of readdirSync(join(root, parent), { withFileTypes: true })) {
        if (entry.isDirectory()) directories.push(join(parent, entry.name));
      }
      continue;
    }

    if (!pattern.includes("*")) directories.push(pattern);
  }

  return directories;
}

export function buildVersionPullRequestBody(status, root = process.cwd()) {
  const packages = new Map();

  for (const directory of workspaceDirectories(root)) {
    try {
      const manifest = JSON.parse(readFileSync(join(root, directory, "package.json"), "utf8"));
      packages.set(manifest.name, { directory, manifest });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  const releases = status.releases
    .filter(({ type }) => type !== "none")
    .map(({ name, newVersion }) => {
      const pkg = packages.get(name);
      if (!pkg) throw new Error(`Could not find workspace package ${name}`);
      if (pkg.manifest.version !== newVersion) {
        throw new Error(
          `Expected ${name} to be version ${newVersion}, found ${pkg.manifest.version}`,
        );
      }

      const changelog = readFileSync(join(root, pkg.directory, "CHANGELOG.md"), "utf8");
      return {
        name,
        version: newVersion,
        content: extractChangelogEntry(changelog, newVersion),
      };
    });

  return renderVersionPullRequestBody(releases);
}

function main() {
  const [statusPath, outputPath] = process.argv.slice(2);
  if (!statusPath || !outputPath) {
    throw new Error("Usage: changeset-pr-body.mjs <changeset-status.json> <output.md>");
  }

  const status = JSON.parse(readFileSync(statusPath, "utf8"));
  const body = buildVersionPullRequestBody(status);
  writeFileSync(outputPath, `${body}\n`);
  console.log(`wrote Version Packages pull request body to ${outputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
