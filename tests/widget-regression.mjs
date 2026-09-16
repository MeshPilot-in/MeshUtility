// Run with Node and Playwright installed, or set PLAYWRIGHT_MODULE to its index.mjs.
// Exercises the real React widget with a mocked Tauri transport (no microphone/injection).
import assert from 'node:assert/strict';
import { createServer } from 'vite';
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browserType = process.env.TEST_BROWSER === 'webkit' ? webkit : chromium;
const server = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: false, hmr: false, watch: { ignored: ['**/src-tauri/target/**'] } } });
await server.listen();
const browser = await browserType.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
const base = server.resolvedUrls.local[0];
const errors = [];

async function widget(options = {}) {
  const page = await browser.newPage({ viewport: options.main ? { width: 1280, height: 720 } : { width: 320, height: 36 } });
  page.setDefaultTimeout(10_000);
  await page.exposeFunction('testResizeWidget', async size => {
    if (!options.main) await page.setViewportSize(size);
  });
  // Keep these tests entirely local, including fonts or images in the app.
  await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript((options) => {
    Object.defineProperty(navigator, 'platform', { value: options.platform || 'Linux x86_64' });
    let next = 1;
    const callbacks = new Map();
    const listeners = new Map();
    const calls = [];
    let session = 0;
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const emit = (event, payload) => {
      for (const id of [...(listeners.get(event) || [])]) callbacks.get(id)?.({ event, payload, id });
    };
    window.testWidget = { calls, emit, listeners, session: () => session, pointer: null };
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
      unregisterListener(event, id) { listeners.get(event)?.delete(id); callbacks.delete(id); },
    };
    window.__TAURI_INTERNALS__ = {
      metadata: { currentWindow: { label: 'widget' }, currentWebview: { label: 'widget' } },
      transformCallback(callback) { const id = next++; callbacks.set(id, callback); return id; },
      async invoke(cmd, args = {}) {
        calls.push({ cmd, args });
        if (cmd === 'resize_widget') return window.testResizeWidget(args);
        if (cmd === 'widget_pointer_position') return window.testWidget.pointer;
        if (['get_available_models', 'get_downloaded_models', 'get_history', 'get_dictionary', 'get_audio_devices'].includes(cmd)) return [];
        if (cmd === 'check_for_updates') return { updateAvailable: false };
        if (cmd === 'get_app_state') return {
          settings: { provider: { provider: 'groq', model: 'test' }, defaultActionId: 'enhance-prompt', closeToTray: true },
          history: [], keyStatus: {},
        };
        if (cmd === 'plugin:app|version') return '1.0.11';
        if (cmd === 'plugin:window|is_maximized') return window.testWidget.maximized || false;
        if (cmd === 'plugin:window|maximize') { window.testWidget.maximized = true; return; }
        if (cmd === 'plugin:window|unmaximize') { window.testWidget.maximized = false; return; }
        if (cmd === 'plugin:event|listen') {
          if (!listeners.has(args.event)) listeners.set(args.event, new Set());
          listeners.get(args.event).add(args.handler);
          return args.handler;
        }
        if (cmd === 'plugin:event|unlisten') { listeners.get(args.event)?.delete(args.eventId); return; }
        if (cmd === 'get_setting') {
          return { model: options.model || 'parakeet', widget_enabled: 'true', widget_style: options.style || 'pill' }[args.key] ?? null;
        }
        if (cmd === 'check_microphone_status') {
          await delay(options.micDelay || 0);
          return { ready: true, available: true, selected_device: 'Test microphone' };
        }
        if (cmd === 'start_recording') { await delay(options.startDelay || 0); return ++session; }
        if (cmd === 'stop_recording_and_transcribe') { await delay(options.stopDelay || 0); return 'This is a complete dictation.'; }
        return null;
      },
    };
  }, options);
  await page.goto(`${base}${options.main ? '?view=about' : 'widget.html'}`);
  if (options.main) await page.locator('.utility-titlebar').waitFor();
  else await page.waitForFunction(() => window.testWidget.listeners.get('hotkey-pressed')?.size === 1);
  if (!options.micDelay) await page.waitForTimeout(80);
  return page;
}
const emit = (page, event, payload) => page.evaluate(({event, payload}) => window.testWidget.emit(event, payload), { event, payload });
const calls = (page, cmd) => page.evaluate(cmd => window.testWidget.calls.filter(c => c.cmd === cmd), cmd);
const hasText = (page, text) => page.waitForFunction(text => document.body.innerText.includes(text), text);
const assertIdle = async page => {
  await page.waitForFunction(() => window.testWidget.calls.filter(c => c.cmd === 'resize_widget').at(-1)?.args.height === 36);
  assert.ok(!(await page.locator('body').innerText()).includes('Listening...'));
};

try {
  const hover = await widget({ platform: 'MacIntel' });
  const actionOpacity = () => hover.locator('.mv-side-pill-left').evaluate(el => getComputedStyle(el.parentElement).opacity);
  assert.equal(await actionOpacity(), '0');
  // Feed native pointer coordinates without dispatching a DOM mouse event or
  // activating the page, matching a hover while the browser/editor is focused.
  await hover.evaluate(() => {
    const rect = document.querySelector('[data-widget-hover-target]').getBoundingClientRect();
    window.testWidget.pointer = [rect.x + rect.width / 2, rect.y + rect.height / 2];
  });
  await hover.waitForFunction(() => getComputedStyle(document.querySelector('.mv-side-pill-left').parentElement).opacity === '1');
  if (process.env.WIDGET_SCREENSHOT_DIR) await hover.screenshot({ path: `${process.env.WIDGET_SCREENSHOT_DIR}/actions.png` });
  assert.equal((await calls(hover, 'plugin:window|set_focus')).length, 0);
  await hover.evaluate(() => {
    const rect = document.querySelector('.mv-side-pill-left').getBoundingClientRect();
    window.testWidget.pointer = [rect.x + rect.width / 2, rect.y + rect.height / 2];
  });
  await hover.waitForTimeout(450);
  assert.equal(await actionOpacity(), '1', 'action stays open while pointer moves onto Enhance');
  await hover.evaluate(() => { window.testWidget.pointer = null; });
  await hover.waitForFunction(() => getComputedStyle(document.querySelector('.mv-side-pill-left').parentElement).opacity === '0');
  // Transparent window padding must not reveal the actions.
  await hover.evaluate(() => { window.testWidget.pointer = [1, 1]; });
  await hover.waitForTimeout(350);
  assert.equal(await actionOpacity(), '0');
  await emit(hover, 'hotkey-pressed');
  await hasText(hover, 'Listening...');
  if (process.env.WIDGET_SCREENSHOT_DIR) {
    await emit(hover, 'transcription-partial', 'A compact live preview while you dictate.');
    await hover.waitForTimeout(300);
    await hover.screenshot({ path: `${process.env.WIDGET_SCREENSHOT_DIR}/dictation.png` });
  }
  const pointerChecks = (await calls(hover, 'widget_pointer_position')).length;
  await hover.waitForTimeout(350);
  assert.equal((await calls(hover, 'widget_pointer_position')).length, pointerChecks, 'hover polling pauses during recording');
  console.log('PASS: inactive Mac hover opens actions, follows action buttons, closes on exit, never focuses, pauses during recording');
  await hover.close();

  const main = await widget({ platform: 'MacIntel', main: true });
  assert.equal(await main.locator('.utility-titlebar').count(), 1);
  assert.equal(await main.locator('.utility-window-controls').count(), 0);
  const controls = main.locator('.utility-mac-controls');
  assert.deepEqual(await controls.locator('button').evaluateAll(buttons => buttons.map(b => b.getAttribute('aria-label'))), ['Close', 'Minimize', 'Maximize']);
  const bar = await main.locator('.utility-titlebar').boundingBox();
  const buttons = await controls.boundingBox();
  assert.ok(buttons.x < 30 && buttons.y >= bar.y && buttons.y + buttons.height <= bar.y + bar.height);
  await controls.getByRole('button', { name: 'Minimize', exact: true }).click();
  await controls.getByRole('button', { name: 'Maximize', exact: true }).click();
  await controls.getByRole('button', { name: 'Maximize', exact: true }).click();
  await controls.getByRole('button', { name: 'Close', exact: true }).click();
  for (const command of ['minimize', 'maximize', 'unmaximize', 'close']) assert.equal((await calls(main, `plugin:window|${command}`)).length, 1);
  assert.equal((await calls(main, 'plugin:window|start_dragging')).length, 0, 'controls must not drag the title bar');
  if (process.env.SCREENSHOT_PATH) await main.screenshot({ path: process.env.SCREENSHOT_PATH });
  console.log('PASS: single Mac title bar, left-hand controls, minimize/maximize/restore/close commands');
  await main.close();

  const page = await widget();
  const initialProbes = (await calls(page, 'check_microphone_status')).length;
  const initialListeners = (await calls(page, 'plugin:event|listen')).length;
  await emit(page, 'hotkey-pressed');
  await hasText(page, 'Listening...');
  for (let i = 0; i < 8; i++) {
    await emit(page, 'transcription-partial', `Live dictation update ${i}`);
    await page.waitForTimeout(180);
    assert.ok((await page.locator('body').innerText()).includes(`Live dictation update ${i}`));
    assert.ok((await page.locator('body').innerText()).includes('Listening...'));
  }
  await emit(page, 'model-loaded', 'parakeet-updated');
  await page.waitForTimeout(100);
  assert.equal((await calls(page, 'check_microphone_status')).length, initialProbes, 'live updates must not re-probe microphone');
  assert.equal((await calls(page, 'plugin:event|listen')).length, initialListeners, 'live updates must not re-register listeners');
  await emit(page, 'hotkey-released');
  await hasText(page, 'Injected');
  assert.equal((await calls(page, 'stop_recording_and_transcribe')).length, 1);
  await page.waitForTimeout(1250);
  await assertIdle(page);
  await emit(page, 'transcription-partial', 'STALE TEXT');
  assert.ok(!(await page.locator('body').innerText()).includes('STALE TEXT'));
  await emit(page, 'hotkey-pressed');
  await hasText(page, 'Listening...');
  await page.getByRole('button', { name: 'Cancel recording' }).click();
  await assertIdle(page);
  assert.equal((await calls(page, 'stop_recording')).at(-1).args.sessionId, 2);
  console.log('PASS: sustained streaming, model events, final stop, idle timer, restart, cancellation');
  await page.close();

  const quick = await widget({ startDelay: 250 });
  await emit(quick, 'hotkey-pressed');
  await emit(quick, 'hotkey-pressed');
  await emit(quick, 'hotkey-released');
  await hasText(quick, 'Injected');
  assert.equal((await calls(quick, 'start_recording')).length, 1, 'duplicate press during startup');
  assert.equal((await calls(quick, 'stop_recording_and_transcribe')).length, 1, 'release during startup must stop once');
  console.log('PASS: rapid release while microphone opens and duplicate start');
  await quick.close();

  const delayed = await widget({ micDelay: 700 });
  await emit(delayed, 'hotkey-pressed');
  await hasText(delayed, 'Listening...');
  await pageDelay(delayed, 900);
  assert.ok((await delayed.locator('body').innerText()).includes('Listening...'), 'late startup probe must not reset recording');
  await emit(delayed, 'hotkey-released');
  await hasText(delayed, 'Injected');
  console.log('PASS: delayed startup microphone probe');
  await delayed.close();

  const whisper = await widget({ model: 'ggml-base.en.bin', style: 'circle' });
  if (process.env.WIDGET_SCREENSHOT_DIR) await whisper.screenshot({ path: `${process.env.WIDGET_SCREENSHOT_DIR}/circle.png` });
  await emit(whisper, 'hotkey-pressed');
  await pageDelay(whisper, 200);
  assert.equal((await calls(whisper, 'resize_widget')).at(-1).args.height, 36);
  await emit(whisper, 'hotkey-released');
  await pageDelay(whisper, 1300);
  await assertIdle(whisper);
  assert.equal((await calls(whisper, 'stop_recording_and_transcribe')).length, 1);
  console.log('PASS: non-streaming model and circle widget');
  await whisper.close();
  assert.deepEqual(errors, [], 'browser runtime errors');
} finally {
  await browser.close();
  await server.close();
}
function pageDelay(page, ms) { return page.waitForTimeout(ms); }
