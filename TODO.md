# Zonevert Improvement Plan

## 🚨 Bugs & Doc Drift

- [x] **README is stale — claims bundled FFmpeg**  
  Commit `50dbe30` dropped the sidecar. Code at `ffmpeg.rs:298` says "No bundled
  sidecar — the app relies on a system ffmpeg." Rewrite the FFmpeg section to
  reflect the current resolution order (custom path → `FFMPEG_PATH` env → `ffmpeg` on PATH).
- [x] **Log panel auto-scroll snaps away from reading position**  
  `LogPanel.svelte` calls `scrollTop = scrollHeight` on every log change.
  Only auto-scroll when the user is already at the bottom of the scroll area.
- [x] **`pnpm-workspace.yaml` has Electron leftovers**  
  Contains `electron: set this to true or false` and `electron-winstaller` entries.
  This file serves no purpose for a Tauri app — remove it entirely.
- [x] **apng encoder is single-frame only**  
  `conversion-plan.ts:92`: `apng: () => ["-c:v", "png", "-frames:v", "1"]` extracts one frame
  from animated inputs. Fixed to use `apng` codec with `-plays 0 -f apng` for proper
  multi-frame animation output.

## ✨ Features

### High Impact

- [x] **Output size summary after conversion**  
  After a queue finishes, show total input bytes → output bytes and compression ratio.
  Added `file_size` Rust command, `getFileSize` binding, and `computeSizeSummary()` in the
  store. Logs "Size: 12.4 MB → 3.2 MB (25.8%)" after each completed queue.
- [x] **Convert single file from source list**  
  Per-file "Convert" action (right-click or inline button) so users can test settings
  on one image without running the full queue. Added play button per file row with
  `convertSingleFile()` store method.
- [x] **"Stop after current" cancel mode**  
  `cancelCurrentJob` immediately SIGTERMs the running ffmpeg. Added `stopAfterCurrent` flag and
  `stopAfterCurrentJob()` method. "Cancel" button kills immediately (Esc), new "Stop after
  current" button lets running job finish then marks rest as canceled. Works with both
  sequential and parallel pools.

### Medium Impact

- [x] **Thumbnail loading concurrency cap**  
  `loadThumbnailsAndMeta()` uses `Promise.all` on every file at once — 100 files = 100 ffmpeg
  processes. Replaced with a worker pool capped at 4 concurrent ffmpeg processes.
- [ ] **Format-specific quality hints**  
  The quality slider shows a generic 1-100 range but WebP quality 82 ≠ JPEG quality 82.
  Show tooltips per format: "WebP: 75-85 recommended", "JPEG: 85-95 for photos", etc.
- [ ] **Rotation / flip support**  
  Add a rotation dropdown in ResizePanel: 90°, 180°, 270°, horizontal flip, vertical flip.
  Maps to `transpose`, `hflip`, `vflip` FFmpeg filters.
- [ ] **Persistent conversion history**  
  Remember the last N conversions (file, format, settings, output path, success/fail)
  so users can re-run past jobs with a single click.

### Low Hanging Fruit

- [ ] **App version in status bar**  
  Show `v0.3.7` (or current) in the status bar so users can report accurate versions in bugs.
- [ ] **Delete key to remove files**  
  Allow `Delete` / `Backspace` to remove selected/highlighted files from the source list.
- [ ] **Drag-to-reorder source files**  
  Queue supports drag reorder already — add the same to the source list for parity.
- [ ] **Concurrency field hint**  
  Show guidance like "Set to your CPU core count" or auto-detect via `navigator.hardwareConcurrency`.
- [ ] **Quality slider snap-to-presets**  
  When changing presets, optionally show preset tick marks on the slider.

## 🧪 Testing & DX

- [ ] **Move tests from CJS to ESM**  
  Tests use `require()` in `.cjs` files but import TypeScript via tsx.
  Move to `.test.ts` with `node:test` + tsx loader.
- [ ] **Add frontend component tests**  
  Pure logic modules are well covered. Add component tests for the store and critical
  UI interactions using Vitest + `@testing-library/svelte`.
- [ ] **Add format-specific encoder output tests**  
  `encoderArgs` for each format could be snapshot-tested to prevent regressions.

## 🔧 Tech Debt

- [ ] **Extract `formatCommand` / shell-quoting to shared utility**  
  Used in both `conversion-plan.ts` and `app-state.svelte.ts` (script export).
  Deduplicate into one location.
- [ ] **Error message clarity from Rust**  
  `ConvertResult` errors come through as "FFmpeg exited with code 1." with
  no stderr snippet. Pipe the last line of stderr into the error for faster debugging.
- [ ] **Window title should reflect progress**  
  Show "Zonevert — Converting (3/10)" in the window title during runs so users can
  see progress from the taskbar / Alt+Tab.
- [ ] **Platform identifier naming**  
  `getPlatform()` returns Electron identifiers `"win32"` / `"linux"` / `"darwin"` for
  shell-quoting compat. Confusing everywhere else. Consider a separate normalized string.
