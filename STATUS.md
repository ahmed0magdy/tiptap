STATUS: WAITING - #8479 tested against my cases (2 gaps found); proposing #8489 as next task
UPDATED: 2026-10-13T14:12:15Z
BRANCH: contrib/markdown-consecutive-hard-breaks (a713bf2, left as is; no PR)
MODE: auto

## 1. PR #8479 tested against my fixture and table test

**Setup:** the #8479 diff was applied with `git apply` (clean) on a local branch `scratch/pr8479` from `origin/main` (5e4c112). That branch is **not pushed**; its changes are in a local git stash. My contrib branch is untouched (still `a713bf2`).

**My tests under #8479:**
- **My table test** (`round trips hard breaks at the start of a cell and in a row`): **pass**. Table cells turn every newline into `<br>`, so a single leading break survives in a cell under both approaches.
- **My fixture** (`hard-break-consecutive.ts`, exact bytes both ways):
  - Markdown → JSON: **pass**. The fixture's backslash input is still parsed correctly.
  - JSON → Markdown: **fail**. Most of the differences are only format: #8479 writes `<br><br>` where I write `  \n\`. One difference is real loss: the single break at the start of a paragraph.
- #8479's own new tests, plus all markdown, table, hard-break and static-renderer tests, pass on that tree.

**Round trip per case.** Each row: serialize, parse back, compare with the original JSON. The format is ignored.

| case | main | #8479 | mine |
|---|---|---|---|
| one break `a⏎b` | ok | ok | ok |
| two breaks | LOST | ok | ok |
| three breaks | LOST | ok | ok |
| **single break at START** | LOST | **LOST** | ok |
| two breaks at start | LOST | ok | ok |
| **single break at END** | LOST | **LOST** | LOST |
| two breaks at end | LOST | ok | **LOST** |
| two breaks between bold | LOST | ok | ok |
| two breaks between italic | LOST | ok | ok |
| one break between bold | ok | ok | ok |
| space-only text between two breaks | LOST | LOST | LOST |

**Real gaps in #8479 (both are single breaks at a paragraph edge):**
- **Start:** JSON `paragraph[hardBreak, text "a"]` → Markdown `"  \na"` → parsed back `paragraph[text "a"]`. The break is lost.
- **End:** JSON `paragraph[text "a", hardBreak]` → Markdown `"a  \n"` → parsed back `paragraph[text "a  "]`. The break is lost, and two stray spaces end up in the text.
- Both behave the same as on main, so #8479 doesn't make them worse. It just doesn't cover them, although its own tests cover leading and trailing *runs* of two breaks.
- Cause: #8479 uses `<br>` only when a neighbor is also a hard break (`previousNode` or `nextNode` is `hardBreak`). A single edge break still gets the two-space form, which needs text on the same line before it and a following line after it.

**Fact that may help a review comment:** on the #8479 tree, the parser already reads a lone edge `<br>` correctly:
- `<br>a` → `[hardBreak, text "a"]`
- `a<br>` → `[text "a", hardBreak]`

I tried a one-line change on the scratch tree: also use `<br>` when the break is first or last in its parent (`!ctx?.previousNode || !ctx?.nextNode`).
- Result: every row above round-trips except "space-only text between two breaks".
- Tests: all markdown, table, hard-break and static-renderer tests pass (515). The only failure is my fixture's exact-bytes check, which fails only on format.
- Output for normal single breaks is unchanged (`a  \nb`).

**Where #8479 is better than mine:** it keeps trailing runs. Two breaks at the end of a paragraph survive under #8479. On my branch they come back as `a`, break, literal text `\`, because CommonMark ignores a backslash break at the end of a block.

**Not covered by any approach:** whitespace-only text between two breaks (`a`, break, `" "`, break, `b` → `"a  \n   \nb"` → two paragraphs).

## 2. Proposed next task (not started)

**#8489: `updateAttributes` on a mark does nothing when the selection starts inside a text node.** Opened today, 0 comments, unassigned; labels area: core, complexity: medium, impact: medium.

- **Why this one:** It's a fresh, clearly scoped core bug with no comments, so asking for assignment is reasonable. I reproduced it on main: with a link over "hello world", selecting 3–8 or 3–12 makes `updateAttributes('link', {href})` return `false` and leaves the link unchanged; selecting from 1 works. It's unit-testable in `packages/core/src/commands/updateAttributes.ts`, and none of the open PRs on your list touch that file.
- **Likely cause:** in the non-empty selection branch, marks are only updated on text nodes with `pos >= from`. A text node that starts before the selection is skipped, and the fallback for the first node only handles node types, not marks.
- **Size:** small to medium, one file plus a test.
- **Before I start:** comment on #8489 and ask to be assigned (TipTap requires that before a PR). Then tell me to go ahead.

Other options if you prefer:
- #7272 (table: can add a row above the header row; easy)
- #6768 (static renderer: Markdown table header issue; easy)
- #8176 (default `colspan="1"`): I couldn't reproduce it in HTML output earlier, so I'd need the issue text first.
