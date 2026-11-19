/**
 * ModelPick domain error. Every user-facing failure should be one of these:
 * a stable code, a one-line message, and an actionable hint.
 */
export class ModelPickError extends Error {
  /**
   * @param {string} message
   * @param {{code?: string, hint?: string, exitCode?: number, details?: unknown}} [options]
   */
  constructor(message, options = {}) {
    super(message);
    this.name = 'ModelPickError';
    this.code = options.code ?? 'ERR_MODELPICK';
    this.hint = options.hint;
    this.exitCode = options.exitCode ?? 1;
    this.details = options.details;
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      hint: this.hint,
      details: this.details
    };
  }
}

export function invariant(condition, message, options) {
  if (!condition) throw new ModelPickError(message, options);
}
