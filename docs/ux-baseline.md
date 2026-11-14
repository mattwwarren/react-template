# UX conventions — baseline

Acceptance criteria for every interface change, in any project. A project extends this file in its own
`UX-CONVENTIONS.md` (it says "extends the baseline" and lists only what it adds or overrides); it does not
copy or rewrite it. The principles in Section 1 are review lenses; the conventions in Sections 2 and 3 are
testable statements, not tastes. Where a convention is enforced by a gate or an end-to-end test, the project's
conventions file names it.

The accessibility baseline is WCAG 2.2 AA; the interaction baseline is Nielsen's ten usability heuristics.
These are targets for implementation and review, not a claim that a given app already conforms.

## 1. Principles

- **Make importance visible.** Requests for input, failures and meaningful exceptions are more prominent
  than routine progress. Colour carries meaning only together with a label or another cue.
- **Group related information; support scanning.** Identity, status and the actions that apply sit together;
  comparable items align and use one field order. Use a small, deliberate set of type sizes, weights and
  spacings, all from the project's tokens.
- **Preserve orientation and control.** Live updates keep the user's place, focus, typed text and scroll
  position. Selection, keyboard focus and hover look different. Essential actions have a visible route;
  double-click, right-click, long-press and shortcuts are additional routes only.
- **Represent the real system state.** Loading, empty, unavailable, stale, disconnected and failed are
  different states with different words. Missing data never implies that work finished or that nothing exists.
- **Make interaction accessible.** Semantic elements, accessible names, labelled errors, correct expanded and
  selected state, a keyboard route for every action, visible unobscured focus, no keyboard traps.
- **Adapt to narrow screens.** Core tasks stay reachable at phone width through deliberate navigation, not by
  compressing the desktop layout. Nothing depends on hover.

## 2. Baseline conventions (every project)

Focus and keyboard:
- Every interactive control shows a visible focus indicator that is not clipped or covered.
- Tab order follows the visual and logical order. No keyboard trap: a documented way out exists wherever a
  widget captures keys.
- Esc closes a dialog, menu or popover that was opened by a user action; focus returns to the control that
  opened it. If that control is gone, focus goes to a logical neighbour, never to the document body. When
  several layers could handle Esc, the innermost open layer or the focused widget handles it first.
- A modal dialog moves focus inside on open, keeps it inside while open, has an accessible name, and
  returns it on close.
- Keys internal to a focused widget under a standard ARIA pattern (arrows in a tablist, listbox or menu;
  Enter and Esc on the focused control) stay with that widget and are not app-level shortcuts.
- An app-level shortcut is registered in one place, never bound by an ad-hoc key listener, and never shadows
  a key a focused widget needs (text fields, editors, embedded consoles).

Targets, text and colour:
- If the project has no token file yet, creating one is the first change a UI task makes, and its path is named
  in the project's conventions file.
- Targets are at least 24x24 CSS px (WCAG 2.2 target size), unless an applicable exception is recorded in the
  project's conventions file.
- Text contrast is at least 4.5:1 (3:1 for large text); required control and state indicators are at least 3:1.
  This holds in every supported colour scheme, checked by a test over the token pairs.
- Raw colours, font sizes and z-index values exist only in the token file; everything else references tokens.
- Text resizes and surrounding controls reflow; long names and paths wrap, or truncate with an accessible way
  to read the full value. Reduced-motion preferences are respected.

States and feedback:
- Each data-driven surface handles loading, empty, error and (where relevant) disconnected and stale states.
- An action gives prompt feedback when it starts and when it succeeds or fails; an error says what happened
  and the next available step.
- A consequential action has a recovery path or a confirmation whose safe answer has focus. Closing a view and
  destroying data are different controls with different words.
- Important asynchronous changes are announced to assistive technology without flooding it with routine updates.

Semantics:
- Controls are real buttons, links, inputs and landmarks; each has an accessible name that matches its
  visible text. Errors and hints are programmatically associated with their fields.
- A list of rows that is not a full ARIA tree is not marked up as one.

## 3. Shared controls

- One control per job. Before adding a button, menu, dialog or row style, search for the existing one; extend
  the shared rule rather than adding an isolated style. Same job, same control, same words.
- A glyph-only button has an accessible name and a tooltip or an adjacent visible label. A control that acts on
  a row or item sits beside it, not inside another interactive element.
- Component sizes come from the project's size tokens; spacing from its spacing scale.

## 4. Extending this list

A new convention is added to the project's conventions file **and** gets a test in the same change, or it is
not a convention yet. If a request implies a rule that is not written down, write it, flag it in your report so
the operator can object, and test it. A convention that is true only for part of the app names that part.

## 5. Known gaps

Conventions the app does not yet implement are listed in the project's conventions file under "Known gaps",
each tagged with the work that delivers it; that work deletes its own line when it lands. A behaviour not
listed there is expected to hold today. Gaps are recorded, not exploited.

## 6. What automation does not cover

Axe and similar scanners find a subset of accessibility problems. They cannot judge whether a name is
meaningful, whether a focus order is sensible, whether a screen reader's output makes sense, or whether a
layout is usable. Screenshots are review artifacts, not assertions: read every one a change touched and
describe what is there. A report states what was verified and what was not; it never claims usability or
accessibility from code inspection alone.

## 7. Review

A review names the trigger (what the user does), the user-visible problem, and the task it affects, and
separates **blocking** problems (inaccessible essential controls, misleading status, lost focus or input, broken
core flows, a violated convention, a bypassed gate) from **optional** refinements tied to a principle above.

## References

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Understanding WCAG 2.2: https://www.w3.org/WAI/WCAG22/Understanding/
- Nielsen's ten usability heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
