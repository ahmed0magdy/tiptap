STATUS: DONE - #8478 fix pushed to contrib/markdown-consecutive-hard-breaks; one decision left for you
UPDATED: 2026-10-13T13:45:22Z
BRANCH: contrib/markdown-consecutive-hard-breaks
MODE: auto

## Done: #8478 (consecutive hard breaks lost in a Markdown round trip)

Pushed `contrib/markdown-consecutive-hard-breaks` to origin as one commit, `1d51eea`, on top of `main` (5e4c112). **No PR opened.**

### Results (final tree)
- `vp run lint`: 0 warnings, 0 errors. `vp fmt --check` on changed files: clean. The pre-commit hook (`vp check --fix`) and commitlint passed.
- `vp run build`: pass.
- `vp run test:unit`: 219 files, 2169 tests, all pass. Before the fix, the new fixture's serialize test fails; with the fix it passes.
- `fallow audit`: **pass**. 0 introduced findings; 31 dead-code and 2 complexity findings are inherited from main.
- `test:e2e` (Chromium): **689 passed, 3 failed.** The 3 failures are `demos/src/Examples/Default/index.spec.ts:107` "should set the correct type when Task list is pressed" for React, Vue and Svelte. **They fail the same way on unchanged `origin/main`** (expected "Hello world", got "Task item checkbox for Hello worldHello world"). This is the existing upstream issue #8456, not this change.
  - How e2e was run: the repo's Playwright wants `chromium_headless_shell-1234`, which this VM doesn't have, so a plain `vp run test:e2e` failed all 692 tests before any test code ran. I reran with a temporary config in my scratch folder that points at the preinstalled Chromium (build 1194). No repo files were changed. Firefox was not run.

### Decision for you
- **A break at the end of a paragraph is still lost.** I confirmed the bug: `a  \n` reads back as the text `"a  "`. A backslash can't fix it, because CommonMark ignores a hard break at the end of a block (`a\` reads back as a literal backslash). Only an HTML `<br>` would round-trip, which is outside the agreed approach. I left it unchanged. Options: mention it in the PR as a known limit, or ask maintainers whether they want `<br>` there in a follow-up.

### Before you open the upstream PR
- **Comment on #8478 and get assigned first.** CONTRIBUTING requires the PR's issue to be assigned to you.
- **Commit author:** the commit is authored by the VM default `Claude <noreply@anthropic.com>`. Run `git commit --amend --reset-author` so you are the author, then push with `--force-with-lease` (it's your own branch).
- **Trailers:** the commit has `Co-authored-by: Claude Opus 5.5 <noreply@anthropic.com>`, in the style of recent upstream commits, plus a `Claude-Session:` link to this private session. You can drop the session line when amending.
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
- Known limit: a break at the end of a paragraph is still dropped. CommonMark ignores a hard break at the end of a block, so no Markdown syntax keeps it; only `<br>` would.
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
