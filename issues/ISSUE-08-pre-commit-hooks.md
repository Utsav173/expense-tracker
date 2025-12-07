# Add Pre-commit Hooks

**Description**
To ensure code quality, pre-commit hooks should be configured to run linting and formatting checks before a commit is allowed. `husky` and `lint-staged` are standard tools for this.

**Affected Files**
- `package.json`
- `.husky/` (new directory)

**Proposed Changes**
1. Install `husky` and `lint-staged`.
2. Configure `lint-staged` in `package.json` to run `eslint --fix` and `prettier --write` on staged files.
3. Add a `pre-commit` hook to run `lint-staged`.

**Labels**
- dev-experience
- quality
