# Issue Tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` — never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (`ready-for-agent`, `claimed`, `resolved`)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## Active Effort

- **Architecture Refactor**: `.scratch/architecture-refactor/`
  - Spec: `.scratch/architecture-refactor/spec.md`
  - Tracker: `.scratch/architecture-refactor/TRACKER.md`
  - Issues: `.scratch/architecture-refactor/issues/`
