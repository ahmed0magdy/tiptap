STATUS: WORKING - #8478 fix committed locally; waiting for e2e to finish before pushing
UPDATED: 2026-10-13T07:29:19Z
BRANCH: contrib/markdown-consecutive-hard-breaks (local only, not pushed yet)
MODE: auto

## Progress on #8478 (consecutive hard breaks lost in a Markdown round trip)

**Done so far:**
- Branched `contrib/markdown-consecutive-hard-breaks` from `main` (5e4c112).
- Committed `1d51eea`: `fix(extension-hard-break): keep consecutive hard breaks in Markdown`. It has `Fixes #8478` and a `Co-authored-by` trailer.
- **Not pushed yet.** I'll push after the e2e run finishes.

**What changed:**
- `packages/extension-hard-break/src/hard-break.ts`: a hard break still serializes as two spaces + newline. When the break would be alone on its line (it follows another break, or it starts the paragraph), it uses the CommonMark backslash form `\` + newline instead. The parser already reads the backslash form as a hardBreak, so no parser change was needed.
- `packages/extension-table/src/table/utilities/markdown.ts`: table cells turn newlines into `<br>`. Without this change, the new form produced `foo<br>\<br>bar`, which an existing test caught. Cells now drop the lone `\` line, so table output is the same as before.
- Tests: a Markdown fixture (`packages/markdown/tests/fixtures/markdown/hard-break-consecutive.ts`) covers 1, 2 and 3 breaks, a break at the start of a paragraph, and bold and italic. `conversion.test.ts` checks it both ways with exact bytes. One added table test covers breaks at the start of a cell and in a row. The existing `hard-break-marks` fixture still passes unchanged, which proves single-break output is identical to before.
- Changeset: `@tiptap/extension-hard-break` patch.

**Not fixed: break at the end of a paragraph.** I confirmed the bug: `a  \n` reads back as the text `"a  "`. A backslash doesn't help there, because CommonMark ignores a hard break at the end of a block and `a\` reads back as a literal backslash. Only an HTML `<br>` would round-trip, which is outside the agreed approach. This is a decision for you.

**Results so far (final tree):**
- `vp run lint`: 0 warnings, 0 errors. `vp fmt --check` on changed files: clean.
- `vp run build`: pass.
- `vp run test:unit`: 219 files, 2169 tests, all pass. Before the fix, the new fixture's serialize test fails.
- `fallow audit`: **pass** (0 introduced, 31 dead-code and 2 complexity findings inherited from main). An earlier test layout gave a "fail", because fallow treats a moved `vite-plus` import line as a new finding. I moved the tests into the fixture pattern rather than suppress it.
- `vp run test:e2e`: the first run failed all 692 tests because Chromium never launched. The repo's Playwright wants `chromium_headless_shell-1234`, and this VM has build 1194. I'm rerunning it now with a temporary config in my scratch folder that points at the preinstalled Chromium. Repo files are unchanged. Running: about 306/692 so far.

**Also for you to check:** the commit author is the VM default (`Claude <noreply@anthropic.com>`), not you. Before the upstream PR, you may want `git commit --amend --reset-author` so you are the author. The commit also has a `Claude-Session:` trailer linking this private session, which you can drop.

Next update: when e2e finishes and the branch is pushed, with full PR notes.
