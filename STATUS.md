STATUS: DONE - #8478 fix pushed as a713bf2 (authored by ahmed0magdy), ready for your review
UPDATED: 2026-10-13T13:53:10Z
BRANCH: contrib/markdown-consecutive-hard-breaks
MODE: auto

## Done: #8478 (consecutive hard breaks lost in a Markdown round trip)

Pushed `contrib/markdown-consecutive-hard-breaks` to origin as one commit, **`a713bf2`**, on top of `main` (5e4c112), authored by you. **No PR opened.**

### Results (final tree)
- `vp run lint`: 0 warnings, 0 errors. `vp fmt --check` on changed files: clean. The pre-commit hook (`vp check --fix`) and commitlint passed.
- `vp run build`: pass.
- `vp run test:unit`: 219 files, 2169 tests, all pass. Before the fix, the new fixture's serialize test fails; with the fix it passes.
- `fallow audit`: **pass**. 0 introduced findings; 31 dead-code and 2 complexity findings are inherited from main.
- `test:e2e` (Chromium): **689 passed, 3 failed.** The 3 failures are `demos/src/Examples/Default/index.spec.ts:107` "should set the correct type when Task list is pressed" for React, Vue and Svelte. **They fail the same way on unchanged `origin/main`** (expected "Hello world", got "Task item checkbox for Hello worldHello world"). This is the existing upstream issue #8456, not this change.
  - How e2e was run: the repo's Playwright wants `chromium_headless_shell-1234`, which this VM doesn't have, so a plain `vp run test:e2e` failed all 692 tests before any test code ran. I reran with a temporary config in my scratch folder that points at the preinstalled Chromium (build 1194). No repo files were changed. Firefox was not run.

### End-of-paragraph break: decided
- Per your decision, it's left out of this PR and listed as a known limit in the PR notes below.

### Authorship: done
- Re-authored as `ahmed0magdy <110637215+ahmed0magdy@users.noreply.github.com>` (author and committer). This repo's git config is set to the same identity.
- The `Co-authored-by: Claude Opus 5.5 <noreply@anthropic.com>` trailer is kept; the `Claude-Session:` trailer is removed.
- Content is identical to the old commit `1d51eea` (empty tree diff). Pushed with `--force-with-lease` (old SHA `1d51eea` -> new SHA `a713bf2`).
- Quick checks after amending: lint 0 warnings / 0 errors; hard-break, table and markdown tests 445 passed; `fallow audit` pass.

### Before you open the upstream PR
- **Comment on #8478 and get assigned first.** CONTRIBUTING requires the PR's issue to be assigned to you.
- **Review the diff yourself** so you can honestly tick the template's Responsibility box.

---

## PR notes (raw bullets; rewrite as you like)

**Title:** `fix(extension-hard-break): keep consecutive hard breaks in Markdown`

**Fixes**
- Fixes #8478

**Changes and Review**
- Bug: a hard break serializes as two spaces + newline. When two breaks are in a row, the second sits alone on its line, so the line reads as blank and the paragraph splits. `a<br><br>b` became `a  \n  \nb`, which parsed back as two paragraphs with stray spaces in the text. A break at the start of a paragraph was lost the same way.
- Fix (`packages/extension-hard-break/src/hard-break.ts`): when a break would be alone on its line (first in its parent, or right after another break), it uses the CommonMark backslash hard break, `\` + newline. Every other break keeps the two-space form, so normal output is byte-identical to before.
- No parser change: marked already parses `\` + newline as a hard break.
- Table cells (`packages/extension-table/src/table/utilities/markdown.ts`): cells turn newlines into `<br>`. They now drop the lone `\` line, so table output is unchanged (`foo<br><br>bar`, not `foo<br>\<br>bar`). An existing table test caught this.
- Known limit: a hard break at the end of a paragraph is still dropped. CommonMark drops a hard break at the end of a block, so no Markdown syntax keeps it; only `<br>` would. If maintainers want it, a follow-up can emit `<br>` there. This PR leaves it out to keep the scope small.
- How to review:
  - The new fixture `packages/markdown/tests/fixtures/markdown/hard-break-consecutive.ts` covers 1, 2 and 3 breaks, a break at the start of a paragraph, and bold and italic text. `conversion.test.ts` checks it in both directions with exact bytes.
  - The existing `hard-break-marks` fixture is unchanged and still passes, which shows single-break output didn't change.
  - One table test was added for breaks at the start of a cell and in a row.

**Testing**
- `vp run lint`, `vp run build`, `vp run test:unit` (2169 passed) and `fallow audit` (pass) all pass.
- Before the fix, the new fixture fails.
- e2e on Chromium: 689 passed, 3 failed. The 3 failing tests also fail on unchanged main (Default demo task list, #8456).

**Checklist**
- [x] Changeset added: `@tiptap/extension-hard-break` patch.
- [x] Tests added.
- [ ] Tested myself: tick this after you've checked it yourself.
- [ ] Critical fix for the stable release: not critical, so leave it unticked unless you want a `release/v3` backport.
- [x] Responsibility box (pre-ticked): only keep it if you've reviewed and understood the diff.

**AI disclosure (required by CONTRIBUTING)**
- Suggested wording: "This change was written with help from an AI coding assistant (Claude Code): it investigated the issue, wrote the fix and tests, and ran the checks. I reviewed and tested the changes and take responsibility for them."

**Docs (tiptap-docs repo)**
- Probably only a small note is needed; no API changed. Suggested line for the HardBreak node page (Markdown section) or the Markdown serialization docs: "A hard break serializes as two trailing spaces. When it would be alone on its line (after another break, or at the start of a paragraph), it uses a backslash (`\`) instead, so consecutive breaks survive a round trip. A break at the end of a paragraph cannot be kept in Markdown."

---

## Explain it to the owner

### 1. The bug
In Markdown, a hard break (a line break inside one paragraph, `<br>` in HTML) is written as **two spaces at the end of a line**. Tiptap always wrote it that way. With two breaks in a row, the second break's line contains *only* the two spaces, and Markdown treats a line with only spaces as a **blank line**, which ends the paragraph.

- Input (HTML): `<p>a<br><br>b</p>`
- Wrong Markdown: `a␣␣⏎␣␣⏎b` (␣ = space, ⏎ = newline). Reading it back gives **two paragraphs**, `a␣␣` (stray spaces in the text) and `b`. Both breaks are gone.
- Right Markdown: `a␣␣⏎\⏎b`. The second break uses the other standard Markdown hard-break syntax, a backslash at the end of the line. Reading it back gives one paragraph `a`, break, break, `b`.

A break at the very start of a paragraph had the same problem (its line is empty too) and is fixed the same way.

### 2. How the fix works
1. **`packages/extension-hard-break/src/hard-break.ts`, `renderMarkdown`.** This function returns the Markdown text for one hard-break node. It used to always return `'  \n'`. Now it asks: "Is this break alone on its line?" That's true when the break is the first node in its parent (`context.index === 0`) or the node right before it is also a hard break (`context.previousNode?.type === node.type`). If it is, it returns `'\\\n'` (backslash + newline); otherwise `'  \n'` as before.
   - `context` is built by `MarkdownManager.renderNodeToMarkdown` in `packages/markdown/src/MarkdownManager.ts`. It already passes `index` and `previousNode` (the sibling before this node). The fix only reads them; the manager is unchanged.
   - Comparing with `node.type` instead of the string `'hardBreak'` keeps it working if someone renames the extension.
2. **Parsing needs no change.** The Markdown parser (marked) already reads backslash + newline as a hard break (token `br`), which HardBreak's `parseMarkdown` turns into a `hardBreak` node. I checked this before writing the fix.
3. **`packages/extension-table/src/table/utilities/markdown.ts`, `renderTableToMarkdown`.** A table row must stay on one line, so this code turns every newline in a cell into `<br>`. With the new output, two breaks in a cell became `foo<br>\<br>bar` (a stray backslash). An existing test caught this. The fix first removes a line that is just `\`, then converts newlines as before, so cells still give `foo<br><br>bar`, the same as before this change.

**Why this approach rather than the alternatives:**
- *Always use the backslash:* this would change the Markdown output of every document with a single break, which works fine today. That's noisy diffs for users and many changed test fixtures. Using it only where two spaces fail keeps normal output byte-identical.
- *Use HTML `<br>`:* that's not plain Markdown, and some Markdown tools strip or escape HTML. The backslash form is standard CommonMark and GitHub-Flavored Markdown.
- *Fix it inside `MarkdownManager`:* that's a bigger, shared file that many open PRs touch. The hard-break extension already owns its own output, so the fix belongs there.

### 3. Why it is correct
**What the tests prove:**
- New fixture `packages/markdown/tests/fixtures/markdown/hard-break-consecutive.ts`, run by `packages/markdown/tests/integration/conversion.test.ts` in **both directions with exact text**: Markdown → JSON equals the expected JSON, and JSON → Markdown equals the expected Markdown, byte for byte. It covers 1, 2 and 3 breaks in a row, a break at the start of a paragraph, and 2 breaks between bold and between italic text.
- Before the fix, the JSON → Markdown test of this fixture fails; after it, it passes. The Markdown → JSON direction passed even before, which proves the parser already handled the backslash.
- The existing fixture `hard-break-marks.ts` (single breaks next to bold) is **unchanged and still passes**. That proves single-break output is identical.
- New table test in `packages/extension-table/tests/integration/tableMarkdown.test.ts`: a break at the start of a cell plus 3 breaks in a row gives `<br>foo<br><br><br>bar` and reads back to the same JSON. The existing test `keeps consecutive hard breaks as separate <br> tags` still passes.
- Full unit suite: 2169 passed. e2e: 689 passed, and the 3 failures also fail on unchanged main (#8456).

**What the tests do NOT cover** (I checked the first two by hand):
- **A break at the end of a paragraph.** It's still lost and is the known limit (CommonMark drops a hard break at the end of a block; only `<br>` would keep it).
- **Whitespace-only text between breaks**, for example `a`, break, `" "`, break, `b`. It gives `a␣␣⏎␣␣␣⏎b` and still splits the paragraph, because that line holds only spaces. Same root cause, rare, not fixed.
- **Marks on the break itself.** A bold hard break comes back as a plain hard break. This was already the case before the change.
- Breaks inside headings, list items and blockquotes are not tested directly. They use the same `renderMarkdown`, and the rule only looks at siblings in the same parent.
- The **static renderer's** separate Markdown output (`packages/static-renderer/src/pm/markdown/markdown.ts`, which writes a plain `\n` for breaks) is a different code path and is untouched.
- e2e was run on Chromium only, not Firefox.

### 4. Questions a maintainer will likely ask
1. **"Why not always write the backslash form?"** Normal single breaks already work. Always using the backslash would change output for every user and many fixtures, with no benefit.
2. **"Does this change Markdown output for existing documents?"** Only for documents with two or more breaks in a row, or a break at the start of a paragraph. Those cases were already lossy before (the breaks disappeared on reload). All other output is byte-identical; the unchanged `hard-break-marks` fixture shows that.
3. **"Why did you touch the table extension?"** Table cells turn newlines into `<br>`. Without the change, the new backslash would leak into cells as `\<br>`. The change keeps table output exactly as before, and an existing table test was what caught it.
4. **"Is the table regex safe? Could it eat a real backslash?"** It only removes a line that is exactly `\`. Plain text never produces that, because the serializer escapes every literal backslash in text to `\\` (`escapeMarkdownSyntax` in `MarkdownManager.ts`). Inline code is not escaped, but it is always wrapped in backticks on the same line, so it can't be a bare `\` line.
5. **"What about a break at the end of a paragraph?"** CommonMark drops a hard break at the end of a block, so neither two spaces nor a backslash can keep it; only an HTML `<br>` would. It's left out to keep this PR small, and a follow-up can use `<br>` there if the maintainers want it.

Also possible: "Why a fixture and not a new test file?" A new test file made `fallow audit` report a new finding (fallow tracks the `vite-plus` import line), and the fixture format is how this package already tests Markdown round trips.

### 5. Risks
- **Markdown tools that don't support the backslash break.** CommonMark and GitHub-Flavored Markdown do. Older or non-standard tools might show a literal `\`. This only affects the cases that were already broken before.
- **Changed output in a user's snapshots.** Users who saved Markdown snapshots with two or more breaks in a row will see a diff. Those snapshots held lossy output anyway.
- **Tables.** The new regex step could change a cell's output. Checked: all table Markdown tests pass, including the existing one for consecutive breaks, plus the new one.
- **Everything else.** Checked: full unit suite (2169 passed), lint, build, `fallow audit` (pass), e2e on Chromium (689 passed; the 3 failures are the same on main).
- **Overlap with open PRs.** No open upstream PR touches `hard-break.ts`. Several open Markdown PRs touch `MarkdownManager.ts`, which this change does not edit.

### 6. Read the diff in this order (about 10 minutes)
1. `packages/extension-hard-break/src/hard-break.ts` → `renderMarkdown`: the whole fix is the "alone on its line" check (`index === 0` or previous sibling is a break), then the backslash vs two-spaces choice.
2. `packages/markdown/src/MarkdownManager.ts` → `renderNodeToMarkdown` (read only, not changed): see where `index` and `previousNode` in `context` come from (`parentNode.content[index - 1]`).
3. `packages/markdown/tests/fixtures/markdown/hard-break-consecutive.ts` → the expected Markdown (top) next to the expected JSON (bottom). Check that each paragraph's Markdown makes sense: two spaces on the first break, `\` on each later one or a leading one.
4. `packages/markdown/tests/fixtures/markdown/index.ts` → the one-line export that adds the fixture to `conversion.test.ts`.
5. `packages/extension-table/src/table/utilities/markdown.ts` → the extra `.replace(/(^|\n)\\(?=\r?\n)/g, '$1')` before the existing newline-to-`<br>` replace. Confirm it only matches a line that is exactly `\`.
6. `packages/extension-table/tests/integration/tableMarkdown.test.ts` → the new test `round trips hard breaks at the start of a cell and in a row`.
7. `.changeset/2026-10-13-markdown-consecutive-hard-breaks.md` → the one-sentence user-facing note (patch for `@tiptap/extension-hard-break`).
