# Output Formats - {{ project_name }}

This document defines output formats for code reviews and other automated reports.

## Component Review Format

```markdown
# Component Review: [ComponentName]

## Summary
[One-line summary of findings]

## Findings by Severity

### Critical Issues
- **Issue**: [Description]
- **File**: `path/to/file.tsx:123`
- **Impact**: [Why this matters]
- **Fix**: [Specific action to resolve]

### Major Concerns
[Same format as above]

### Low Priority
- **[Area]**: [What to consider]

## Checklist Results
- [x] TypeScript types complete
- [x] Props have default values
- [ ] Missing: keyboard accessibility
- [ ] Missing: error boundary

## Metrics
- Lines of code: X
- Complexity: Low/Medium/High
- Test coverage: X%
```

## Test Review Format

```markdown
# Test Review: [Feature/Component]

## Coverage Summary
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Lines | 85% | 80% | PASS |
| Branches | 72% | 80% | FAIL |
| Functions | 90% | 80% | PASS |

## Test Quality

### Well-Tested Areas
- User authentication flow
- Form validation
- Error states

### Under-Tested Areas
- Loading states (no tests)
- Keyboard navigation (partial)
- Edge cases: empty list

### Test Improvements Needed
1. **Add loading state tests** - [file.test.tsx]
2. **Add keyboard navigation tests** - [file.test.tsx]
3. **Test empty state** - [file.test.tsx]

## Test Patterns

### Good Patterns Found
- AAA pattern followed
- MSW for API mocking
- User-centric queries

### Anti-Patterns Found
- **[file:line]**: Testing implementation details
- **[file:line]**: Missing async/await
```

## Accessibility Audit Format

```markdown
# Accessibility Audit: [Page/Feature]

## WCAG 2.1 AA Compliance

### Critical Violations
| Issue | Element | WCAG | Fix |
|-------|---------|------|-----|
| Missing alt text | `img.avatar` | 1.1.1 | Add descriptive alt |
| No focus indicator | `.custom-btn` | 2.4.7 | Add focus-visible styles |

### Warnings
| Issue | Element | WCAG | Recommendation |
|-------|---------|------|----------------|
| Low contrast | `.muted-text` | 1.4.3 | Increase to 4.5:1 |

### Passed Checks
- [x] Heading hierarchy (1.3.1)
- [x] Link purpose (2.4.4)
- [x] Language of page (3.1.1)

## Manual Testing Required
- [ ] Screen reader navigation
- [ ] Keyboard-only operation
- [ ] Color blindness simulation

## Automated Scores
- Lighthouse: X/100
- axe DevTools: X violations
```

## Performance Report Format

```markdown
# Performance Report: [Page/Feature]

## Lighthouse Scores
| Metric | Score | Target | Status |
|--------|-------|--------|--------|
| Performance | 85 | 90 | WARN |
| FCP | 1.2s | 1.8s | PASS |
| LCP | 2.8s | 2.5s | FAIL |
| TTI | 3.5s | 3.9s | PASS |

## Bundle Analysis
| Chunk | Size | % of Total |
|-------|------|------------|
| vendor | 180KB | 45% |
| main | 120KB | 30% |
| [feature] | 100KB | 25% |

## Issues Found

### Critical
- **Large bundle**: vendor.js is 180KB
- **Fix**: Split [library] into separate chunk

### Opportunities
- **Code splitting**: [Feature] could be lazy loaded
- **Image optimization**: [image.png] is 2MB, should be <200KB

## Re-render Analysis
- **Component**: [Name]
- **Renders**: 15 times on initial load
- **Cause**: Inline object prop
- **Fix**: Memoize with useMemo

## Recommendations
1. Implement route-based code splitting
2. Add image compression pipeline
3. Memoize expensive calculations
```

## API Integration Review Format

```markdown
# API Integration Review: [Feature]

## Query Patterns

### Queries
| Hook | Key | Stale Time | Status |
|------|-----|------------|--------|
| useUsers | ['users', filters] | 5m | OK |
| useUser | ['user', id] | 5m | OK |

### Mutations
| Hook | Invalidates | Optimistic | Status |
|------|-------------|------------|--------|
| useCreateUser | ['users'] | No | OK |
| useUpdateUser | ['users', 'user'] | Yes | OK |

## Issues Found

### Missing Error Handling
- **[hook:line]**: No onError callback
- **Fix**: Add toast notification

### Missing Loading States
- **[component:line]**: No loading indicator
- **Fix**: Add Skeleton component

## MSW Handler Coverage
| Endpoint | GET | POST | PATCH | DELETE |
|----------|-----|------|-------|--------|
| /users | OK | OK | OK | OK |
| /orgs | OK | OK | Missing | Missing |

## Type Safety
- [x] Response types from OpenAPI
- [x] Request types from OpenAPI
- [ ] Missing: Error response types
```

## Quick Review Summary

For small changes, use condensed format:

```markdown
## Quick Review: [PR Title]

**Status**: APPROVED / CHANGES REQUESTED

**Files**: 3 files changed (+50/-20)

### Issues
1. [Critical] [file:line]: Issue description
2. [Minor] [file:line]: Issue description

### Good
- Clean component structure
- Tests included

### Action Items
- [ ] Fix critical issue #1
- [ ] Consider addressing minor issue #2
```

## No Issues Format

When review finds no issues:

```markdown
# Code Review: [Feature]

## Status
No issues found. Code passes all checks:
- Biome: 0 violations
- TypeScript: 0 type errors
- Tests: 100% passing
- Coverage: 85% (target: 80%)

Ready to merge.
```