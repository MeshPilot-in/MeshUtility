Widget regression checks
========================

Run `node tests/widget-regression.mjs` with Playwright installed and its Chromium browser available. If using an existing Playwright installation, set `PLAYWRIGHT_MODULE` to its absolute `index.mjs` path. `PLAYWRIGHT_EXECUTABLE_PATH` can select an existing browser executable. Set `TEST_BROWSER=webkit` to exercise WebKit instead.

The suite runs the actual React widget through Vite with a mocked Tauri transport. It binds to localhost and blocks external browser requests; it never records audio, runs native transcription, or injects text into another app.

Coverage: repeated live partials and model events preserve recording and listeners; completion returns to idle; subsequent recordings and cancellation work; duplicate starts and release during microphone initialization stop once; a delayed microphone probe does not reset active dictation; non-streaming models and circle style retain their compact layout.

Mac checks feed native pointer coordinates without DOM mouse events: hover reveals Enhance/Polish without focus, remains open over an action, collapses after leaving, ignores transparent padding, and pauses during recording. The title-bar check verifies the three left-hand controls in one row and their close/minimize/maximize/restore commands. These mock-based checks do not replace a native test with another Mac app focused.

Native session validation and audio/dictionary regressions are covered by `cargo test --release` in `src-tauri`.
