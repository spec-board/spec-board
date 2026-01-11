/**
 * Structured logging utility for SpecBoard (T084)
 * Provides consistent logging with context, levels, and structured data
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  /** Request ID for tracing */
  requestId?: string;
  /** User ID if authenticated */
  userId?: string;
  /** API endpoint or service name */
  source?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Log level priority for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level (can be configured via env)
const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

/**
 * Format error object for logging
 */
function formatError(error: unknown): LogEntry['error'] | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context ? { ...context } : undefined,
    error: formatError(error),
  };
}

/**
 * Output log entry to console
 */
function outputLog(entry: LogEntry): void {
  // Check if we should log this level
  if (LOG_LEVELS[entry.level] < LOG_LEVELS[MIN_LOG_LEVEL]) {
    return;
  }

  // In production, output JSON for log aggregation
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(entry));
    return;
  }

  // In development, output human-readable format
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const source = entry.context?.source ? ` [${entry.context.source}]` : '';
  const contextStr = entry.context
    ? ` ${JSON.stringify(omit(entry.context, ['source']))}`
    : '';

  const logFn = entry.level === 'error' ? console.error :
                entry.level === 'warn' ? console.warn :
                entry.level === 'debug' ? console.debug :
                console.log;

  logFn(`${prefix}${source} ${entry.message}${contextStr}`);

  if (entry.error?.stack) {
    logFn(entry.error.stack);
  }
}

/**
 * Omit keys from object
 */
function omit<T extends Record<string, unknown>>(
  obj: T,
  keys: string[]
): Partial<T> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Logger class with context binding
 */
export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Log at debug level
   */
  debug(message: string, context?: LogContext): void {
    outputLog(createLogEntry('debug', message, { ...this.context, ...context }));
  }

  /**
   * Log at info level
   */
  info(message: string, context?: LogContext): void {
    outputLog(createLogEntry('info', message, { ...this.context, ...context }));
  }

  /**
   * Log at warn level
   */
  warn(message: string, context?: LogContext): void {
    outputLog(createLogEntry('warn', message, { ...this.context, ...context }));
  }

  /**
   * Log at error level
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    outputLog(createLogEntry('error', message, { ...this.context, ...context }, error));
  }
}

// Default logger instance
export const logger = new Logger();

/**
 * Create a logger for a specific source (API route, service, etc.)
 */
export function createLogger(source: string): Logger {
  return new Logger({ source });
}

/**
 * Create a request-scoped logger with request ID
 */
export function createRequestLogger(
  source: string,
  requestId?: string,
  userId?: string
): Logger {
  return new Logger({
    source,
    requestId: requestId || generateRequestId(),
    userId,
  });
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Middleware helper to extract request ID from headers
 */
export function getRequestId(request: Request): string {
  return request.headers.get('x-request-id') || generateRequestId();
}
