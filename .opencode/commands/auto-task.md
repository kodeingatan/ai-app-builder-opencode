---
description: Looping engine — plan, implementasi, verify, review satu task sampai [x][x][x] di task-logs.md
---

Looping engine untuk menyelesaikan satu task sampai tuntas: plan → implementasi → verify → review → fix issue → cek gate → ulang bila perlu.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the task identifier: a task number (e.g., `04`), a folder path (e.g., `tasks/04-redesign/`), a README path (e.g., `tasks/04-redesign/README.md`), or a task name (e.g., `redesign`).

---

# 0. Resolve the Task

1. If `$ARGUMENTS` is a folder → entrypoint is `README.md` inside it (folder mode, opsi B).
2. If `$ARGUMENTS` is a number/name → match against BOTH `tasks/NN-*.md` files AND `tasks/NN-*/` folders (folder wins if both exist). The entrypoint for folder-mode tasks is `tasks/NN-slug/README.md`.
3. If `$ARGUMENTS` is empty → read `tasks/task-logs.md` § Overview and pick the first task whose row is not `[x] [x] [x]`; report the choice and continue (do not ask).
4. Read the task entrypoint completely, then the split files as needed (`spec.md`, `flow-requirements.md`, `domain-api-ui.md`, `acceptance-tasks.md`, `verification.md`).
5. Read `tasks/task-logs.md` and snapshot the current task's gate: `Implemented | Verified | Reviewed`.

---

# 1. Fase PLAN — putuskan sendiri, jangan bertanya

Read and follow `.opencode/commands/plan.md` end to end for the resolved task.

Autonomy rules for this phase:

- NEVER use the `question` tool. Every open question, ambiguity, or tradeoff is decided by you.
- Base decisions on (in order): current source code → task specification → permanent knowledge (`docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`).
- Document every self-made decision under the task's `Assumptions` / `Open Questions` (mark as `decided by /auto-task`).
- Output the implementation plan exactly as `plan.md` #7 specifies. Do NOT write application code in this phase.

---

# 2. Fase IMPLEMENTASI — izinkan semuanya, jangan bertanya

Read and follow `.opencode/commands/implementasi.md` end to end for the resolved task.

Autonomy rules for this phase:

- NEVER ask for confirmation. All edits, file creation, bash commands, test runs, and builds needed to reach the task goals are pre-authorized.
- NEVER use the `question` tool.
- Follow the plan from Fase 1 (or `## Tasks` in the task file if no separate plan exists).
- Finish with the mandatory task-logs update: `Implemented` → `[x]` for this task only (per `implementasi.md` #13). Do NOT touch `Verified` or `Reviewed`.

---

# 3. Fase VERIFY + REVIEW — kumpulkan semua issue

1. Read and follow `.opencode/commands/verify.md` end to end. Collect every FAIL / gap / missing traceability item into an issue list.
2. Read and follow `.opencode/commands/review.md` end to end. Append every finding (blocking, major, minor) to the same issue list.
3. Each phase updates only its own column (`Verified`, `Reviewed`) in `tasks/task-logs.md` — never reset an existing `[x]` to `[ ]`.

---

# 4. Fix Loop — perbaiki semua issue, ulangi maksimal 3 siklus

```
siklus = 0
while issue list is non-empty AND siklus < 3:
  siklus += 1
  Fix SEMUA issue (blocking + major + minor yang actionable).
  Re-run implementasi seperlunya untuk fix tersebut (follow implementasi.md, update Implemented stays [x]).
  Re-run verify (follow verify.md), then review (follow review.md).
  Refresh the issue list from the new reports.
```

- If after 3 siklus issues remain → STOP looping. Keep the remaining issues in the final report with file:line references and a concrete suggested fix for each. Do NOT loop forever.
- Infrastructure blockers (missing browser binary, missing tooling, failing external service) are NOT code issues: record them under the task's Detail `Notes` in `tasks/task-logs.md` and continue with everything else.

---

# 5. Gate Check — loop luar sampai [x][x][x]

After the fix loop, re-read the task's row in `tasks/task-logs.md` § Overview:

| Gate | State `[ ]` → action |
|------|----------------------|
| `Implemented` | Re-run Fase 2 (implementasi.md) for the missing scope only |
| `Verified` | Re-run Fase 3-verify (verify.md) |
| `Reviewed` | Re-run Fase 3-review (review.md) |

Repeat the gate check until the row reads `[x] [x] [x]` — then STOP.

- Do NOT mark `[x]` for work that failed or was aborted; leave `[ ]` and note the reason under Detail `Notes`.
- Do NOT touch any other task's row or checklists.
- Do NOT commit changes (same rule as `implementasi.md` #11).

---

# 6. Final Response

```text
Auto-Task Complete — tasks/NN-slug/README.md

Gate: Implemented [x] Verified [x] Reviewed [x]   (atau state sebenarnya + alasan sisa [ ])

Phases executed:
- plan: {1-line summary}
- implementasi: {files created N, modified M}
- verify: {result, e.g. PASS / n FAIL fixed}
- review: {result, e.g. APPROVED / CHANGES REQUESTED → fixed in siklus k}
- fix siklus used: k/3

Remaining issues (if any):
- file:line — {issue} — {suggested fix}

Task logs: tasks/task-logs.md updated.
```

---

# 7. Hard Rules

- One task per invocation. Never switch tasks mid-run.
- Never reset an existing `[x]` in `tasks/task-logs.md`.
- Never modify the command files themselves (`plan.md`, `implementasi.md`, `verify.md`, `review.md`) or `opencode.json` during a run.
- Never commit. The user commits explicitly.
- Stop conditions (whichever comes first): gate `[x][x][x]` reached, 3 fix siklus exhausted, or a human-only blocker (secret, external approval, destructive action outside task scope) — report and stop.
