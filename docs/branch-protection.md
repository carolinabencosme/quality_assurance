# Branch Protection Checklist

Apply a GitHub ruleset to `main`, `develop`, `presentacion`, `cierre-proyecto-final-v3`, and `cierre/**`.

- [ ] Require a pull request before merging.
- [ ] Require at least one approval and dismiss stale approvals.
- [ ] Require conversation resolution.
- [ ] Block force pushes and branch deletion.
- [ ] Require branches to be up to date before merge.
- [ ] Require signed commits if the organization supports them.
- [ ] Restrict bypass permissions to repository administrators.
- [ ] Require these status checks after their first successful run:
  - `backend`
  - `frontend`
  - `Newman API Tests`
  - `Playwright E2E`
  - `Deploy Staging / deploy-and-smoke`
  - `Quality Gate (SonarQube)` when a reachable Sonar server and `SONAR_TOKEN` are configured

## Manual verification evidence

Repository settings cannot be committed as code in this project. A maintainer should open **Settings → Rules → Rulesets**, compare the active rules with this checklist, and attach a screenshot to the delivery PR. The checklist documents the intended control; only the GitHub settings screen proves that it is enabled remotely.
