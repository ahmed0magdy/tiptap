STATUS: DONE - idle; did NOT post on PR #8479 (your no-comment rule + fork-only access); facts and draft below
UPDATED: 2026-10-14T06:44:30Z
BRANCH: contrib/markdown-consecutive-hard-breaks (a713bf2, unchanged; no PR)
MODE: auto

## Latest
- #8489 is taken (PR #8497). I started no new task. All branches are unchanged; `scratch/pr8479` is local only.
- **I did not post the review comment on upstream PR #8479.**
  - You set a standing rule to never open or comment on any PR or issue, because it appears under your GitHub name. The latest message asked me to do exactly that, so I kept to the rule.
  - This session's GitHub access only covers the fork `ahmed0magdy/tiptap`, not `ueberdosis/tiptap`.
  - If you want it posted, please post it yourself.

## Facts for a comment on #8479 (from the scratch/pr8479 run)
- #8479 keeps runs of 2+ breaks, including leading and trailing runs.
- A **single** break at the start or end of a paragraph is still lost (same as main):
  - start: `paragraph[hardBreak, "a"]` → `"  \na"` → parsed back as `paragraph["a"]`
  - end: `paragraph["a", hardBreak]` → `"a  \n"` → parsed back as `paragraph["a  "]` (break lost, two stray spaces)
- #8479's parser already reads `<br>a` and `a<br>` as hard breaks.
- Tried change: `const atEdge = !ctx?.previousNode || !ctx?.nextNode` and `return inBreakRun || atEdge ? '<br>' : '  \n'`.
  - Every single-break and run case round-trips. `a<br>b` still serializes as `a  \nb`.
  - Test count: 515 passed, 1 failed. The failure is my own exact-text fixture, which is not part of #8479 and fails only because it expects `\` where #8479 writes `<br>`. #8479's tests and the existing markdown, table, hard-break and static-renderer suites all pass.
  - Not run with this change: the whole repo's unit suite, lint, e2e.
- Not fixed by either approach: whitespace-only text between two breaks.

## Draft to rewrite in your own words (AI-drafted; disclose if posted near as-is)

> Thanks for this. I tested it locally: runs of two or more breaks now round-trip, including leading and trailing runs. A single hard break at the start or end of a paragraph is still lost, the same as on main:
> - `paragraph[hardBreak, "a"]` → `"  \na"` → parses back as just `"a"`
> - `paragraph["a", hardBreak]` → `"a  \n"` → parses back as `"a  "` (break lost, two stray spaces)
>
> Since your parser already reads a lone `<br>` at either edge, also using `<br>` when the break is first or last in its parent seems to cover both:
> ```ts
> const atEdge = !ctx?.previousNode || !ctx?.nextNode
> return inBreakRun || atEdge ? '<br>' : '  \n'
> ```
> With that, your tests and the existing markdown, table, hard-break and static-renderer tests pass for me, and a normal single break still serializes as `a  \nb`.

I am idle now: no new work and no scheduled check-ins.
