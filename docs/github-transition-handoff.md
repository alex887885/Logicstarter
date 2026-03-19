# Logicstarter GitHub Transition Handoff

This document is the complete handoff package for finishing the GitHub transition from the legacy starter public identity to the current Better Auth-based codebase that is already serving as the effective starter mainline.

## 1. Purpose

Use this document when the current codebase is already functioning as the practical starter baseline, but the GitHub public identity still needs to be switched away from the legacy starter repository.

This keeps the cutover auditable and makes the new Better Auth line the real mainline.

## 2. Current readiness summary

At the time of writing, Logicstarter has the following validated baseline:

- homepage structure and visual baseline aligned to the starter homepage
- `pnpm typecheck` passes in the `logicstarter` container
- `pnpm smoke:baseline` passes in the `logicstarter` container
- provider runtime, auth runtime, billing runtime, and storage runtime surfaces are available
- migration notes and release-candidate checklist already exist
- this repository is the starter baseline currently being developed and validated in practice
- the remaining gap is that GitHub still exposes the legacy starter repository as the old public identity

This means the current codebase is already the effective starter mainline in practice, but GitHub transition is still incomplete until the remaining real validations and repository cutover steps are finished.

## 3. What this handoff is for

This handoff covers:

- repository transition preparation
- operational checklist for the final GitHub mainline transition
- evidence requirements before cutover
- rollback planning
- post-cutover verification

This handoff does not itself authorize:

- deleting an existing GitHub repository without backup
- force-pushing over the current upstream without review
- skipping billing validation
- skipping deployment verification after the repository change

## 4. Boundary of responsibility

### Current codebase side

The current codebase should provide:

- clean implementation state
- validated runtime behavior
- updated docs
- example env alignment
- migration guidance
- release-candidate checklist
- GitHub transition handoff docs

The final GitHub cutover step should make the public starter identity point at this already-active baseline, while the old starter is archived, renamed, or otherwise preserved as legacy history.

## 5. Required preconditions before any GitHub cutover

Do not start repository transition until all of the following are true.

### Code and runtime gate

- `pnpm typecheck` passes
- `pnpm build` passes
- `pnpm smoke:baseline` passes
- runtime APIs return healthy snapshots for the intended environment

### Feature validation gate

- auth validation is complete
- storage validation is complete
- billing validation is complete, including a real Stripe test checkout path

### Documentation gate

- `README.md` reflects current project positioning
- `docs/migration-from-starter.md` reflects the actual env and rollout model
- `docs/release-candidate-checklist.md` reflects the real acceptance gate
- this handoff doc is reviewed and kept current

### Security gate

- no real secrets are committed
- `.env.runtime` stays untracked
- example env files are complete enough for operators

## 6. Recommended GitHub transition strategy

The safest recommended order is below.

### Phase 1: freeze and record

1. Freeze non-essential repository restructuring work.
2. Record the exact Logicstarter validation evidence.
3. Record the exact starter repository state that will be replaced or archived.
4. Record the last known good starter deployment and commit.

### Phase 2: back up the legacy starter

Before any destructive or hard-to-reverse action:

- create a backup branch or mirror reference for the legacy starter
- verify the current default branch and protected branch settings
- record repository visibility and webhook integrations
- record release tags and deployment hooks that depend on the current repository

### Phase 3: decide the promotion model

Choose one promotion model explicitly.

#### Model A: the public starter repository is replaced by this codebase

Use when you want to keep the existing public repository identity.

Typical outcome:

- starter repository name remains the main public identity
- this Better Auth-based code becomes the content baseline
- old starter implementation is preserved through backup branch, mirror, or archive reference

#### Model B: old starter is archived and this repository becomes the new public repository

Use when you want a cleaner identity separation.

Typical outcome:

- old starter repository is archived
- this repository becomes the active public home for starter
- migration notes point users from the legacy starter to the new starter mainline

Model A is usually lower-friction if existing consumers already depend on the starter repository URL.

### Phase 4: execute the reviewed mainline transition

Perform the final repository action using the reviewed promotion sequence for the new starter identity.

That sequence should include:

1. verify remotes
2. verify target branch
3. verify backup reference exists
4. perform the reviewed promotion action
5. verify GitHub metadata after the change

Do not improvise this step without the recorded backup and rollback package.

### Phase 5: validate after cutover

Immediately after repository transition:

- run baseline validation against the promoted starter identity
- verify docs render correctly in GitHub
- verify deployment workflows still point to the intended repository
- verify release/tag expectations still hold

## 7. Suggested starter-side execution checklist

Use this as the final operator checklist for promoting the new starter mainline.

### Repository safety

- confirm repository owner and remote URL
- confirm default branch
- confirm protected branch rules
- confirm backup branch or mirror exists
- confirm legacy tags/releases are preserved if needed

### Promotion execution

- confirm the exact commit to promote
- confirm the exact branch to receive the promotion
- confirm who approves the final action
- perform the repository update using the pre-reviewed sequence

### Post-action verification

- confirm repository homepage and description are still correct
- confirm docs and README render correctly
- confirm issue/pr templates if any still make sense
- confirm deployment automation still references the expected repository and branch

## 8. Validation evidence to attach to the cutover

Attach the following evidence to the final repository transition decision:

- container command result for `pnpm typecheck`
- container command result for `pnpm smoke:baseline`
- build result for `pnpm build`
- auth real smoke result
- storage real smoke result
- billing real smoke result
- screenshots or notes for provider runtime views if needed

Without this evidence, the repository transition should be treated as incomplete.

## 9. Rollback plan

A rollback plan must exist before cutover.

Minimum rollback expectations:

- the old starter code is recoverable by branch, mirror, tag, or archive
- the previous deployment target and commit are recorded
- the operator responsible for rollback is identified
- post-cutover verification has a maximum waiting window before rollback is triggered

Rollback should be triggered if any of the following happen:

- the promoted repository cannot build in the expected container/runtime
- smoke validation fails on the promoted target
- deployment automation points to the wrong source
- critical docs or env guidance are missing or misleading

## 10. Communication notes

Before public promotion, prepare a short internal note covering:

- what changed
- where the canonical repository now lives
- whether the old starter repository is archived or preserved as history
- where migration instructions are documented
- what validations were completed before cutover

## 11. Open items

The following items are still open at the current stage:

- real Stripe billing smoke validation in Logicstarter
- final decision on whether to reuse the current starter repository identity or publish this repository as the new public home
- exact command sequence for the repository cutover and legacy archive step

## 12. Final go/no-go rule

Do not declare the GitHub transition complete until:

- validation gates are complete
- legacy starter backup exists
- rollback is documented
- repository execution steps are reviewed
- billing real smoke is complete

Until then, this project should be treated as the effective starter mainline in day-to-day development, but not yet the final public GitHub starter identity.
