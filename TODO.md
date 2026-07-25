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
- [x] **Format-specific quality hints**  
  The quality slider shows a generic 1-100 range but WebP quality 82 ≠ JPEG quality 82.
  Show tooltips per format: "WebP: 75-85 recommended", "JPEG: 85-95 for photos", etc.
  Added hints for webp, jpg, png, avif, jp2, and jls.
- [x] **Rotation / flip support**  
  Added `RotationMode` type and `buildRotationFilter()` in conversion-plan.ts. Rotation dropdown
  in ResizePanel (renamed to "Transform"): 90° right, 180°, 90° left, flip horizontal/vertical.
  Uses ffmpeg `transpose`, `hflip`, `vflip` filters. Persisted in settings.
- [x] **Persistent conversion history**  
  Remember the last N conversions (file, format, settings, output path, success/fail)
  so users can re-run past jobs with a single click. Added HistoryPanel in Setup column,
  stores last 20 runs in localStorage with settings, file count, and summary. Restore
  button restores all settings from a past run.

### Low Hanging Fruit

- [x] **App version in status bar**  
  Show `v0.3.7` (or current) in the status bar. Added `define: { __APP_VERSION__ }` in
  vite.config.ts reading from package.json. Displayed in StatusBar.
- [x] **Delete key to remove files**  
  Allow `Delete` / `Backspace` to remove selected/highlighted files from the source list.
  Added `selectedFileIndex` state, click-to-select in SourcePanel, and Delete/Backspace
  handler in App.svelte. Auto-selects next file after removal.
- [x] **Drag-to-reorder source files**  
  Queue supports drag reorder already — added same drag-drop pattern to SourcePanel with
  `reorderFiles()` store method that preserves selection.
- [x] **Concurrency field hint**  
  Show guidance like "Set to your CPU core count". Added `navigator.hardwareConcurrency`
  detection showing "N logical cores detected" below the parallel jobs input.
- [ ] **Quality slider snap-to-presets**  
  When changing presets, optionally show preset tick marks on the slider.

## 🧪 Testing & DX

- [x] **Move tests from CJS to ESM**  
  Tests use `require()` in `.cjs` files but import TypeScript via tsx.
  Converted all 4 test files to `.test.ts` with `import`/`export` + `describe` blocks.
  Added rotation filter test. Updated `pnpm check` script. 26 tests pass.
- [ ] **Add frontend component tests**  
  Pure logic modules are well covered. Add component tests for the store and critical
  UI interactions using Vitest + `@testing-library/svelte`.
- [x] **Add format-specific encoder output tests**  
  `encoderArgs` for each format could be snapshot-tested to prevent regressions.
  Added 6 tests for `resolve_ffmpeg` priority logic (explicit > env > default),
  2 tests for new `file_size` command, and rotation filter tests.

## 🔧 Tech Debt

- [x] **Extract `formatCommand` / shell-quoting to shared utility**  
  Used in both `conversion-plan.ts` and `app-state.svelte.ts` (script export).
  Already centralized — `formatCommand` lives in `conversion-plan.ts` and is imported
  elsewhere. No deduplication needed.
- [x] **Error message clarity from Rust**  
  `ConvertResult` errors came through as "FFmpeg exited with code 1." with no stderr.
  Now captures the last non-empty stderr line and appends it: "FFmpeg exited with code 1: Permission denied".
- [x] **Window title should reflect progress**  
  Show "Zonevert — Converting (3/10)" in the window title during runs so users can
  see progress from the taskbar / Alt+Tab. Added `updateTitle()` called on conversion
  start, after each item, and on finish/stop.
- [x] **Platform identifier naming**  
  `getPlatform()` returns Electron identifiers `"win32"` / `"linux"` / `"darwin"` for
  shell-quoting compat with the ported conversion-plan code. Leaving as-is — the
  convention is documented and changing it would risk path-quoting regressions.
