---
name: ui-change
description: Use for ANY change to the user interface under src/ (layout, styling, components, navigation, status display, keyboard behaviour), for "add a feature", and when reviewing such a change. Encodes the change loop that keeps the app consistent, accessible and modular - read the architecture and conventions, reuse before inventing, write the e2e flow first, read the screenshots, run scripts/ci-local.sh.
---

# ui-change

The contract for changing this app's interface. It is written for Claude and for other coding agents alike
(AGENTS.md points here); it is plain instructions, so follow it from the file if your tool has no skill
loader. The operator speaks in product terms and cannot police consistency, so this loop and the gates do.

## From product request to acceptance test

The operator describes features as product behaviour. Everything technical is yours to decide.
1. **Restate the request as acceptance criteria**: a short list of things a user can see and do, each
   checkable. Not implementation steps.
2. **Check `UX-CONVENTIONS.md`** (it extends `docs/ux-baseline.md`): list the conventions that apply. If the
   request implies a convention that is not written down, add it with a test and **flag it to the operator**
   in your report so they can object. Read its "Known gaps"; do not build on behaviour that does not exist.
3. **Decide every technical question yourself**: module layout, naming, state shape, which existing
   component to reuse, which token, how to test. Do not ask the operator about these; say what you picked.
4. **Ask the operator only genuine product questions** (what should happen, for whom, what is out of scope),
   and only when the answer changes what a user sees. Ask them together, each with 2-3 options and your
   recommendation; continue with the recommendation if the choice is reversible and no answer comes.
5. **Write the criteria at the top of your e2e test** as comments; the test is the acceptance test.

## The change loop

1. **Orient.** Read `ARCHITECTURE.md`, `UX-CONVENTIONS.md` and `docs/ux-baseline.md`, and the files you will
   touch. Re-check the tree and branch; do not rely on earlier orientation.
2. **Reuse before inventing.** Search `src/components/ui/, src/components/shared/, src/features/`, the tokens in `src/index.css` and the current UI
   wording. Same job, same control, same words. Extend a shared rule instead of adding an isolated style.
   Name what you reused in your report, or say why nothing fit.
3. **Plan the placement** with the rules in `ARCHITECTURE.md`. Layers, lowest first: lib < auth < realtime < api < hooks < components < features; a layer
   imports itself and layers to its left. Raw colours, font sizes and z-index values go in `src/index.css`
   only.
4. **E2E first.** Write `tests/e2e/<name>.spec.ts` (or extend one): drive the feature the way a user does
   (clicks and key presses, not internal calls), assert the criteria, call
   `assertAccessible(page, "<label>")` from `tests/e2e/support/axe.mjs` for each new surface or state (dialog, menu,
   drawer open), and save a screenshot for every state worth looking at
   (`page.screenshot({ path: "test-results/<name>/<state>.png" })`: default, empty, error, long content,
   focused). Put pure decisions in a plain module with a unit test written first. Run them and watch them
   **fail for the right reason** (the missing behaviour, not a typo).
5. **Implement** in small single-purpose modules. Tokens only. Every file under the size budget. Semantic
   elements, accessible names, visible focus, targets of at least 24x24 px, a keyboard route for every
   action, focus returned to the invoking control when a menu or dialog closes. Cover loading, empty, error
   and disconnected states where they apply.
6. **Run `npm run test:e2e`** (and `npm test` for logic changes). Then **read every screenshot your change touched**
   with the Read tool and describe what you see: layout, truncation, overlap, contrast, focus ring. A
   screenshot you did not open is unverified. If it looks wrong, fix it and rerun even though the test passed.
7. **Run `scripts/ci-local.sh`** until it prints `GATE PASSED`. Fix the cause of a failure; never loosen or suppress
   the check.
8. **Report**: the acceptance criteria and where each is tested; the screenshots you read and what they
   showed; keyboard and accessibility evidence (axe scan labels, keys exercised); what you reused;
   conventions you added; and **what you did not verify**. Do not claim usability or accessibility from code
   inspection alone.

## Do not

- No raw colours (hex, `rgb()`/`hsl()`/`oklch()`..., named colours), `font-size` px or `z-index` numbers
  outside `src/index.css`; no Tailwind arbitrary values that hold them (`text-[#fff]`, `text-[13px]`,
  `z-[999]`); no default-palette classes (`bg-blue-500`) where the gate forbids them
  (`tokens.forbidPaletteClasses`). No inline-style escapes either: no `el.style.color = ...`, no
  `setAttribute('style', ...)`, no `style=` attribute in a string or HTML. The JSX `style` prop must be an
  object literal carrying only computed geometry (`left`, `top`, `width`, `height`, `transform`, `flex`, ...) or
  `--custom` properties. To change look, use a token class.
- No file over the size budget. Never edit `scripts/size-budget.json` upward or add an exemption; split the
  file. If you shrink a ratcheted file, lower its entry.
- No new entry in the axe allowlist (`axe.allowlist` in `harness.config.json`, default
  `tests/e2e/axe-allowlist.json`), ever, without the operator's explicit approval. Fix the violation; when
  you fix one, delete its entry. `assertAccessible(page, label, { within })` scopes a scan to a selector; a
  scoped scan needs its own label, distinct from any unscoped scan of the same screen.
- No imports against the layer order, and no new import cycles (`scripts/import-cycles.json` only shrinks).
- No suppression comments (`@ts-ignore`, `biome-ignore`, `eslint-disable`, `# noqa`, ...), no weakened or
  skipped checks, no `--no-verify`.
- No new dependency younger than 14 days; pin exact versions.
- Never edit a ratchet file to make a failure disappear; the gate compares them with the merge base.

## What you usually cannot verify

State these in the report when relevant instead of implying coverage: real third-party backends (mocked in
e2e), browsers and devices you did not run, phone and narrow layouts unless you exercised them, screen-reader
output beyond what axe checks (axe cannot judge whether a label is meaningful or a focus order sensible), and
anything the token gate cannot see (see "Known gaps in the gates" in `ARCHITECTURE.md`).

## Reviewing a UI change

Use the `ux-reviewer` agent (`.claude/agents/ux-reviewer.md`) or follow its steps.
