/**
 * Auto-injected by toPrompt. Do not edit by hand — will be overwritten.
 * Forwards JS runtime errors into Metro stdout so the server-side
 * detector can classify them.
 */
// @ts-ignore — ErrorUtils is a React-Native global.
const _eu: any = (globalThis as any).ErrorUtils;
if (_eu && typeof _eu.setGlobalHandler === 'function') {
  const _prev = typeof _eu.getGlobalHandler === 'function' ? _eu.getGlobalHandler() : null;
  _eu.setGlobalHandler((err: any, isFatal?: boolean) => {
    try {
      const payload = JSON.stringify({
        msg: err && err.message ? err.message : String(err),
        stack: err && err.stack ? String(err.stack).slice(0, 4000) : undefined,
        isFatal: Boolean(isFatal),
      });
      // eslint-disable-next-line no-console
      console.log('[TOPROMPT_FATAL] ' + payload);
    } catch { /* swallow */ }
    if (_prev) {
      try { _prev(err, isFatal); } catch { /* swallow */ }
    }
  });
}

const _prevConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  try {
    // Special case — React ErrorBoundary catches.
    // The mobile ErrorBoundary template fires:
    //   console.error('Mobile ErrorBoundary caught an error:', error, errorInfo)
    // Surface this as a [TOPROMPT_FATAL] marker (richest classification)
    // WITH the React componentStack included — so the server-side auto-fix
    // loop knows which component failed, not just the file/line.
    if (
      args.length >= 2 &&
      typeof args[0] === 'string' &&
      args[0].indexOf('Mobile ErrorBoundary caught') === 0 &&
      args[1] instanceof Error
    ) {
      const err: any = args[1];
      const info: any = args[2] || {};
      const fatalPayload = JSON.stringify({
        msg: err && err.message ? err.message : String(err),
        name: err && err.name ? err.name : undefined,
        stack: err && err.stack ? String(err.stack).slice(0, 4000) : undefined,
        componentStack:
          typeof info.componentStack === 'string'
            ? String(info.componentStack).slice(0, 4000)
            : undefined,
        source: 'errorBoundary',
        isFatal: true,
      });
      // eslint-disable-next-line no-console
      console.log('[TOPROMPT_FATAL] ' + fatalPayload);
      _prevConsoleError(...args);
      return;
    }

    // Generic console.error path. Wrap entries inside an object so the
    // server-side parser (which expects `{...}` shape) can JSON.parse it.
    // Previous shape was a bare array which the parser regex couldn't match.
    const entries = args.map((a) => {
      if (a instanceof Error) {
        return { message: a.message, stack: String(a.stack).slice(0, 2000) };
      }
      if (typeof a === 'string') return a;
      try { return JSON.parse(JSON.stringify(a)); } catch { return String(a); }
    });
    const payload = JSON.stringify({ entries });
    // eslint-disable-next-line no-console
    console.log('[TOPROMPT_CONSOLE_ERROR] ' + payload);
  } catch { /* swallow */ }
  _prevConsoleError(...args);
};

export {}; // make the file a module
