# Ownership Policy

## Hard Ownership Mapping

### Operations control plane
- **Primary:** `samuelz-platform`
- **Scope:** repository operation templates, operation workflows, CI policy, sync mechanics, and shared governance files.
- **Reviewer:** `@samuelzcom`

### Product delivery
- **Primary:** `samuelz-web`
- **Scope:** feature work, product behavior, and release intent.
- **Reviewer:** `@samuelzcom`

## Drift-Prevention Rules

1. No sibling repository may be edited directly for operational files.
2. All operational files are single source of truth in `samuelz-platform` and must be synchronized via:
   - `workflow_dispatch` of `.github/workflows/repo-operations-sync.yml`
   - or manual cherry-pick from `samuelz-platform`.
3. Operational files in sibling repos are synchronized only through `repo-operations-sync`.

## Non-Override Clause

If an ownership decision conflicts across repos, operations decisions in `samuelz-platform`
take precedence until a new source update is synced.
