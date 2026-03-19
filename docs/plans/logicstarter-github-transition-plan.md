---
description: GitHub transition plan for promoting Logicstarter while keeping final public repository replacement work isolated to the legacy starter identity
---

# Logicstarter GitHub Transition Plan

## Goal

Prepare a complete and low-risk handoff package for GitHub repository transition work.

This plan does not execute repository replacement inside Logicstarter.
It prepares the documentation and validation baseline so the actual GitHub cutover can be performed later against the legacy public starter repository with clear boundaries.

## Scope

This plan covers:

- defining the target GitHub transition model
- documenting what must happen in the legacy public starter repository versus what stays in `Logicstarter`
- defining the validation gate before any repository change
- defining rollback expectations
- defining the final handoff checklist

This plan does not cover:

- deleting a GitHub repository immediately
- force-pushing from Logicstarter into the starter remote
- renaming repositories without backup
- mixing `starter`, `Logicstarter`, and `sign` runtime responsibilities

## Current baseline

The following Logicstarter baseline must stay true before repository transition work starts:

- homepage alignment with starter is complete
- `pnpm typecheck` passes in the Logicstarter container
- `pnpm smoke:baseline` passes in the Logicstarter container
- migration and release-candidate docs exist in this repository
- Logicstarter is already the day-to-day starter baseline in active development
- GitHub still exposes the legacy starter repository as the public starter identity

## Ownership boundary

### Logicstarter owns

- new starter mainline implementation
- migration documentation
- runtime validation evidence
- cutover prerequisites
- replacement readiness notes
- mainline promotion preparation

### Legacy public starter repository owns

- the public GitHub repository history that is currently authoritative
- the final repository replacement or archive action
- the final upstream push sequence
- any rename, default branch, archive, or visibility change

## Required transition model

The preferred model is:

1. finish Logicstarter validation to release-candidate quality
2. freeze the legacy starter except required archive or backup work
3. back up the current legacy starter repository state
4. perform repository replacement, rename, or archive steps so the public starter identity points at this already-active baseline
5. re-run baseline validation against the promoted result
6. only then treat GitHub transition as complete

## Milestones

## 1. Documentation complete

Complete when:

- this plan exists
- `docs/github-transition-handoff.md` exists
- migration notes and release checklist stay aligned with the handoff steps

## 2. Validation complete

Complete when:

- `pnpm typecheck` passes
- `pnpm build` passes
- `pnpm smoke:baseline` passes
- auth real smoke is validated
- storage real smoke is validated
- billing real smoke is validated

## 3. Repository decision ready

Complete when:

- the target repository name is confirmed
- branch protection and default branch expectations are documented
- backup/archive expectations are documented
- rollback owner is identified

## 4. Public repository execution ready

Complete when:

- the legacy public starter repository owners have the final handoff doc available
- the exact push/rename/archive sequence is reviewed
- a post-cutover verification list is approved

## Risks

### Risk: wrong repository gets changed

Guardrail:

- all destructive GitHub actions must be executed against the legacy public starter repository context only
- do not treat Logicstarter as the place to archive or delete the upstream repository

### Risk: code promotion without runtime proof

Guardrail:

- require validation evidence before any repository replacement step
- do not promote Logicstarter on homepage parity alone

### Risk: secrets leak during transition

Guardrail:

- keep `.env`, `.env.runtime`, and any production secrets untracked
- rely on example env files and deployment-secret documentation only

### Risk: rollback path is undefined

Guardrail:

- require a legacy starter backup reference before cutover
- record the last known good starter commit and deployment state

### Risk: starter and sign boundaries get mixed

Guardrail:

- keep starter and sign isolation rules active during the whole transition
- do not use sign-specific env, port, or runtime assumptions as starter acceptance criteria

## Exit criteria

This plan is complete only when:

- GitHub handoff documentation is complete
- Logicstarter validation is fully documented
- public repository execution order is documented
- rollback expectations are documented
- remaining blockers are reduced to explicit go/no-go decisions

## Remaining blockers

- real billing smoke validation is still pending
- final public repository cutover action has not been executed yet
- final upstream naming/archival choice still needs confirmation
