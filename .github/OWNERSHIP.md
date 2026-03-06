# Ownership Policy

## Hard Ownership Mapping

### Operations control plane
- **Primary:** `samuelz-platform`
- **Scope:** shared CI policy, governance files, and the common repository baseline.
- **Reviewer:** `@samuelzcom`

### Product delivery
- **Primary:** `samuelz-web`
- **Scope:** feature work, product behavior, and release intent.
- **Reviewer:** `@samuelzcom`

## Drift-Prevention Rules

1. No sibling repository should drift on shared baseline files without an intentional rollout.
2. Shared baseline files originate in `samuelz-platform` and are propagated by deliberate copy/update work, not recurring GitHub Actions sync.
3. Repo-specific workflows stay explicit inside each consumer repo; only the common baseline should be mirrored from `samuelz-platform`.

## Non-Override Clause

If an ownership decision conflicts across repos, operations decisions in `samuelz-platform`
take precedence until a new baseline rollout is applied.
