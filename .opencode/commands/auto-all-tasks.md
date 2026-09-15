---
description: Batch looping engine — jalankan auto-task.md berurutan dari task incomplete pertama sampai semua [x][x][x] di task-logs.md
---

Batch looping engine untuk menyelesaikan SEMUA task berurutan sampai tuntas: untuk tiap task jalankan `auto-task.md` → cek gate `[x][x][x]` di `tasks/task-logs.md` → ulangi task yang sama bila belum `[x][x][x]` → lanjut ke task berikutnya bila sudah `[x][x][x]`.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the optional start point: a task number (e.g., `05`), a folder path (e.g., `tasks/05-document-engine/`), a README path (e.g., `tasks/05-document-engine/README.md`), or a task name (e.g., `document-engine`). If empty → start from the first incomplete task (see #0).

---

# 0. Resolve Daftar Task (sekali di awal, jangan bertanya)

1. Baca `tasks/task-logs.md` § Overview secara utuh. Jadikan tabel ini sebagai sumber kanonis urutan dan gate (`Implemented | Verified | Reviewed`). Urutan = numerik NN menaik sesuai baris Overview.
2. Baca `tasks/README.md` sebagai cross-check daftar folder `tasks/NN-slug/`. Jika ada selisih dengan Overview, Overview menang; catat selisih di Final Response.
3. Tentukan task awal:
   - Jika `$ARGUMENTS` kosong → task awal = baris Overview pertama yang belum `[x] [x] [x]` (task incomplete pertama). Laporkan pilihan dan lanjutkan tanpa bertanya.
   - Jika `$ARGUMENTS` adalah folder → entrypoint = `README.md` di dalamnya (folder mode, opsi B).
   - Jika `$ARGUMENTS` adalah nomor/nama → match terhadap BOTH `tasks/NN-*.md` files AND `tasks/NN-*/` folders (folder wins). Entrypoint folder-mode = `tasks/NN-slug/README.md`.
   - Jika `$ARGUMENTS` adalah path README langsung → pakai file itu.
4. Daftar kerja = task awal + SEMUA task setelahnya dalam urutan numerik (tidak termasuk task sebelum task awal, karena diasumsikan sudah `[x][x][x]`).
5. Untuk tiap task di daftar kerja, snapshot gate awal dari Overview: `Implemented | Verified | Reviewed` + `Status` + `Fase`.

Autonomy rules untuk seluruh run:

- NEVER use the `question` tool. Setiap ambiguitas diputuskan sendiri.
- Base decisions on (in order): current source code → task specification (`README.md` + `spec.md` → `flow-requirements.md` → `domain-api-ui.md` → `acceptance-tasks.md` → `verification.md`) → permanent knowledge (`docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`).
- Document setiap self-made decision di task tersebut di bawah `Assumptions` / `Open Questions` (mark as `decided by /auto-all-tasks`).

---

# 1. Loop Utama — berurutan, satu task dalam satu waktu

```
task_list = [task_awal ... task_terakhir] (numerik menaik, dari #0)
for each task in task_list (SEQUENTIAL, JANGAN paralel):
  execute #2 (auto-task untuk task ini sampai gate-nya [x][x][x])
  only then continue to next task
```

- One task per turn. NEVER switch tasks mid-run. NEVER kerjakan dua task paralel.
- Selesaikan task saat ini sampai `Implemented [x] Verified [x] Reviewed [x]` baru pindah ke task berikutnya.
- Jangan lompat task yang belum `[x][x][x]`, kecuali human-only blocker (lihat #5).

---

# 2. Eksekusi Per Task — delegasikan penuh ke auto-task.md

Untuk task saat ini (`tasks/NN-slug/README.md`), read and follow `.opencode/commands/auto-task.md` end to end, yaitu:

1. **Fase PLAN** — follow `.opencode/commands/plan.md`. Output implementation plan sesuai `plan.md` #7. Do NOT write application code di fase ini.
2. **Fase IMPLEMENTASI** — follow `.opencode/commands/implementasi.md`. Finish dengan `Implemented` → `[x]` untuk task ini saja di `tasks/task-logs.md`. Do NOT touch `Verified` / `Reviewed`.
3. **Fase VERIFY + REVIEW** — follow `.opencode/commands/verify.md` lalu `.opencode/commands/review.md`. Kumpulkan semua FAIL / gap / finding ke satu issue list. Tiap fase update hanya kolomnya sendiri (`Verified`, `Reviewed`) — never reset `[x]` yang sudah ada.
4. **Fix Loop (maks 3 siklus per auto-task run)** — fix SEMUA issue, re-run implementasi seperlunya, re-run verify lalu review, refresh issue list. Jika setelah 3 siklus masih ada issue → catat dengan referensi `file:line` + suggested fix konkret, tapi TETAP lanjut ke Gate Check #3 (yang akan memicu pengulangan auto-task bila gate belum penuh — sesuai tujuan poin 3 user).
5. **Gate Check auto-task** — re-read baris Overview task ini sampai `[x] [x] [x]` (per `auto-task.md` #5).

---

# 3. Gate Check Batch — poin 2 + poin 3 user (ulangi sampai [x][x][x])

Setelah satu run `auto-task.md` selesai untuk task saat ini, re-read baris task tersebut di `tasks/task-logs.md` § Overview DAN § Detail per Task:

| Gate | State `[ ]` → action |
|------|----------------------|
| `Implemented` | Re-run `auto-task.md` untuk task YANG SAMA (fokus pada missing scope saja) |
| `Verified` | Re-run `auto-task.md` untuk task YANG SAMA (fokus verify + fix) |
| `Reviewed` | Re-run `auto-task.md` untuk task YANG SAMA (fokus review + fix) |

Aturan pengulangan (tujuan user poin 3 — kerjakan sampai selesai):

```
while gate task_ini != [x][x][x]:
  re-run .opencode/commands/auto-task.md untuk task_ini
  re-read gate di tasks/task-logs.md § Overview
```

- TIDAK ada batas outer retry — ulangi terus untuk task yang sama sampai `[x][x][x]`, sesuai instruksi user ("kerjakan sampai selesai sampai goals tercapai").
- Do NOT mark `[x]` untuk work yang failed/aborted; biarkan `[ ]` + tulis alasan di Detail `Notes` task tersebut, lalu COBA LAGI (perbaiki penyebabnya, bukan memalsukan gate).
- Do NOT touch baris task lain selama mengulang task ini.
- Setiap pengulangan HARUS menghasilkan progres nyata (fix, test, docs) — jangan spin kosong. Jika dua pengulangan berturut-turut tanpa perubahan file/kolom, lakukan diagnosa lebih dalam (baca ulang spec + source + permanent knowledge) sebelum mengulang lagi.
- Satu-satunya alasan berhenti mengulang task ini adalah human-only blocker (lihat #5) — catat dan laporkan, jangan lompat diam-diam.

---

# 4. Lanjut ke Task Berikutnya — poin 4 user

Hanya bila gate task saat ini sudah `[x] [x] [x]`:

1. Verifikasi sekali lagi baris Overview-nya benar-benar `[x] [x] [x]`.
2. Lanjutkan ke `task berikutnya` dalam `task_list` (#1) — resolve entrypoint `tasks/NN-slug/README.md` + baca split files-nya (`spec.md`, `flow-requirements.md`, `domain-api-ui.md`, `acceptance-tasks.md`, `verification.md`) + snapshot gate-nya.
3. Kembali ke #2 untuk task berikutnya.
4. Ulangi sampai SEMUA task di `task_list` berstatus `[x] [x] [x]` — itulah goals tercapai.

---

# 5. Stop Conditions

Berhenti (whichever comes first):

1. **GOALS TERCAPAI** — semua baris Overview di `task_list` (dan idealnya seluruh Overview) reads `[x] [x] [x]` → STOP dengan sukses.
2. **Human-only blocker** — secret yang tidak ada, approval eksternal, aksi destruktif di luar scope task, tooling/infra yang benar-benar tidak bisa di-workaround (contoh: registry down total, kredensial produksi). Catat di Detail `Notes` task tersebut di `tasks/task-logs.md`, laporkan di Final Response, STOP untuk task itu (jangan lompat diam-diam ke task berikutnya bila task berikutnya depends on task yang blocked — laporkan dependency impact-nya).
3. Infrastructure blocker parsial (misal: Playwright browser binary belum install, Storybook binary missing) BUKAN alasan berhenti total: record di Detail `Notes`, kerjakan semua yang lain, coba workaround (`npx playwright install`, verifikasi file-level), dan tetap kejar `[x][x][x]` via jalur yang tersedia.

Yang BUKAN stop condition: lelah mengulang, 1–2x fix gagal, test flaky, build cache stale — semua itu WAJIB diatasi (clean `.nuxt/.output`, `npx nuxt prepare`, rebuild, re-run test) sampai gate penuh.

---

# 6. Final Response

```text
Auto-All-Tasks Complete — started from {tasks/NN-slug/README.md}

Per-task gates:
- tasks/01-.../README.md: Implemented [x] Verified [x] Reviewed [x]
- tasks/05-document-engine/README.md: Implemented [x] Verified [x] Reviewed [x]
- ...

Phases executed per task (ringkas 1 baris per fase):
- tasks/05-...: plan {summary} / implementasi {created N, modified M} / verify {PASS} / review {APPROVED} / auto-task reruns: k

Remaining issues (if any):
- tasks/NN-... — file:line — {issue} — {suggested fix} — {alasan masih [ ] bila ada}

Task logs: tasks/task-logs.md updated.
Goals tercapai: YA / BELUM (alasan + blocker + next action konkret).
```

---

# 7. Hard Rules

- Satu task dalam satu waktu. Never switch/paralel tasks.
- Never reset an existing `[x]` in `tasks/task-logs.md` menjadi `[ ]`.
- Never modify baris/kolom task lain saat mengerjakan task saat ini (kecuali snapshot baca).
- Never modify command files (`plan.md`, `implementasi.md`, `verify.md`, `review.md`, `auto-task.md`, file ini sendiri) atau `opencode.json` selama run.
- Never commit. User commits explicitly (sama seperti `implementasi.md` #11 dan `auto-task.md` #7).
- NEVER use the `question` tool selama run.
- Goals = SEMUA task di daftar kerja memiliki `Implemented [x] Verified [x] Reviewed [x]` di `tasks/task-logs.md` § Overview. Bekerja sebagai senior fullstack developer profesional sampai goals tercapai.
