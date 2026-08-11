import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  buildVersionPullRequestBody,
  extractChangelogEntry,
  renderVersionPullRequestBody,
} from "./changeset-pr-body.mjs";

test("extractChangelogEntry returns one version and ignores headings in code blocks", () => {
  const changelog = `# package

## 2.0.0

### Minor Changes

- Add the release flow.

\`\`\`md
## not-a-version-boundary
\`\`\`

## 1.0.0

- Initial release.
`;

  assert.equal(
    extractChangelogEntry(changelog, "2.0.0"),
    `### Minor Changes

- Add the release flow.

\`\`\`md
## not-a-version-boundary
\`\`\``,
  );
});

test("renderVersionPullRequestBody includes each released package and its changelog entry", () => {
  const body = renderVersionPullRequestBody([
    {
      name: "@cloudflare/computer",
      version: "0.2.0",
      content: "### Minor Changes\n\n- Add package previews.",
    },
    {
      name: "@cloudflare/dofs",
      version: "0.1.0",
      content: "### Patch Changes\n\n- Fix links.",
    },
  ]);

  assert.match(body, /# Releases/);
  assert.match(body, /## @cloudflare\/computer@0\.2\.0/);
  assert.match(body, /- Add package previews\./);
  assert.match(body, /## @cloudflare\/dofs@0\.1\.0/);
  assert.match(body, /- Fix links\./);
});

test("renderVersionPullRequestBody omits changelog entries when the body is too long", () => {
  const body = renderVersionPullRequestBody(
    [
      {
        name: "@cloudflare/computer",
        version: "0.2.0",
        content: "x".repeat(1_000),
      },
    ],
    400,
  );

  assert.match(body, /## @cloudflare\/computer@0\.2\.0/);
  assert.match(body, /changelog entries were omitted/);
  assert.doesNotMatch(body, /x{100}/);
});

test("buildVersionPullRequestBody excludes workspaces that are not being released", () => {
  const root = mkdtempSync(join(tmpdir(), "changeset-pr-body-"));
  try {
    mkdirSync(join(root, "packages/computer"), { recursive: true });
    mkdirSync(join(root, "examples/demo"), { recursive: true });
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ workspaces: ["packages/*", "examples/*"] }),
    );
    writeFileSync(
      join(root, "packages/computer/package.json"),
      JSON.stringify({ name: "@cloudflare/computer", version: "0.2.0" }),
    );
    writeFileSync(
      join(root, "packages/computer/CHANGELOG.md"),
      "# @cloudflare/computer\n\n## 0.2.0\n\n- Release it.\n",
    );
    writeFileSync(
      join(root, "examples/demo/package.json"),
      JSON.stringify({ name: "@example/demo", version: "0.0.0" }),
    );

    const body = buildVersionPullRequestBody(
      {
        releases: [
          {
            name: "@cloudflare/computer",
            type: "minor",
            newVersion: "0.2.0",
          },
          { name: "@example/demo", type: "none", newVersion: "0.0.0" },
        ],
      },
      root,
    );

    assert.match(body, /## @cloudflare\/computer@0\.2\.0/);
    assert.doesNotMatch(body, /@example\/demo/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
