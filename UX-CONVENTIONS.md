# UX conventions

This project **extends** [docs/ux-baseline.md](docs/ux-baseline.md) (a pinned copy of the shared baseline;
`harness.lock` records which one). Read the baseline first. This file lists only what this project adds or
overrides. Every convention here has a test, named in parentheses; a convention without a test is not one yet.

## Project conventions

- Destructive row actions open the shared `DeleteConfirmDialog` (`src/components/shared/DeleteConfirmDialog.tsx`) with Cancel and Delete buttons; Cancel closes it and leaves the rows unchanged (`should delete user via actions dropdown`, `can cancel delete operation` in `tests/e2e/users.spec.ts`).
- Icon-only controls, such as the back links on the detail pages, carry an accessible name via `aria-label` (`src/features/users/UserDetailPage.tsx`, `src/features/organizations/OrganizationDetailPage.tsx`; `user-detail-back-link`, `organization-detail-back-link` in `tests/e2e/accessibility.spec.ts`).
- Dialogs and menus are axe-scanned open, each under its own label. The axe allowlist `tests/e2e/axe-allowlist.json` is `[]` and shrink-only (`scripts/check-ratchets.mjs`) (`users-create-dialog`, `organizations-create-dialog`, `documents-upload-dialog`, `documents-upload-select-open`, `user-menu`, `org-switcher-menu` in `tests/e2e/accessibility.spec.ts`).

## Shared controls

- `src/components/ui/` holds shadcn/ui primitives, exempt from the token gate (`tokens.exemptPrefixes`).
- `src/components/shared/` holds composites, for example `DataTable`, `DeleteConfirmDialog`, `Pagination`, `UserMenu` and `OrganizationSwitcher`.
- `src/features/` holds per-feature dialogs, for example `UserDialog`, `OrganizationDialog` and `UploadDialog`.

## Known gaps

Conventions above or in the baseline that the app does not yet implement. Each line is tagged with the work
that delivers it; that work deletes its own line when it lands.

- Dark-theme destructive colour pairs cannot both reach 4.5:1 with one value, and no dark-mode switch exists yet (#50).
