# Docscribe

## Agent skills

### Issue tracker

GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout. See `docs/agents/domain.md`.

## Implementation workflow

After completing a ticket:

1. Run the full test suite (`python -m pytest` in `backend/`, `npm run build` in `frontend/`)
2. Commit with a descriptive message referencing the ticket (e.g. `#3 — Auth endpoints`)
3. Push to a feature branch named after the ticket (e.g. `ticket/3-auth-endpoints`)
4. Create a Pull Request targeting `main` with the ticket title and a summary of what was built
5. Merge the PR before moving to the next ticket

Branch naming: `ticket/<number>-<slug>` (e.g. `ticket/3-auth-endpoints`)
