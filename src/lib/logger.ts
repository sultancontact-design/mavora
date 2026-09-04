/**
 * Mavora - Logging System
 * Arabic Marketplace Platform (Morocco)
 * 
 * Comprehensive logging with:
 * - Multiple log levels
 * - Structured logging
 * - Console output (dev) / File/Remote (prod)
 * - Arabic message support
 */

// =============================================================================
// Types / الأنواع
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  source?: string;
  stack?: string;
}

type LogOutput = (entry: LogEntry) => void;

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  enableRemote: boolean;
  remoteUrl?: string;
  remoteApiKey?: string;
  batchSize: number;
  flushInterval: number; // ms
}

// =============================================================================
// Log Levels Order / ترتيب مستويات السجل
// =============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  fatal: '\x1b[35m', // Magenta
};

const RESET_COLOR = '\x1b[0m';

const ARABIC_LEVEL_NAMES: Record<LogLevel, string> = {
  debug: 'تصحيح',
  info: 'معلومات',
  warn: 'تحذير',
  error: 'خطأ',
  fatal: خطأ قاتل',
};

// =============================================================================
// Logger Class / فئة المسجل
// =============================================================================

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private requestId: string | null = null;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      ...config,
    };

    // Start auto-flush if remote or file logging enabled
    if (this.config.enableRemote || this.config.enableFile) {
      this.startFlushTimer();
    }
  }

  /**
   * Set request ID for tracing
   */
  setRequestId(id: string): void {
    this.requestId = id;
  }

  /**
   * Get current request ID
   */
  getRequestId(): string | null {
    return this.requestId;
  }

  // =========================================================================
  // Core Logging Methods / طرق التسجيل الأساسية
  // =========================================================================

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    const entry = this.log('error', message, context, error?.stack);
  }

  fatal(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('fatal', message, context, error?.stack);
  }

  /**
   * Core log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    stack?: string
  ): LogEntry | null {
    // Check if we should log at this level
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.minLevel]) {
      return null;
    }

    // Create log entry
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId: this.requestId || undefined,
      source: this.getSource(),
      stack,
    };

    // Output to console
    if (this.config.enableConsole) {
      this.consoleOutput(entry);
    }

    // Buffer for file/remote
    if (this.config.enableFile || this.config.enableRemote) {
      this.buffer.push(entry);

      // Flush immediately for errors/fatal
      if (level === 'error' || level === 'fatal') {
        this.flush();
      } else if (this.buffer.length >= this.config.batchSize) {
        this.flush();
      }
    }

    return entry;
  }

  // =========================================================================
  // Console Output / إخراج وحدة التحكم
  // =========================================================================

  private consoleOutput(entry: LogEntry): void {
    const color = LEVEL_COLORS[entry.level];
    const levelName = entry.level.toUpperCase();
    const arabicName = ARABIC_LEVEL_NAMES[entry.level];
    const time = new Date(entry.timestamp).toLocaleTimeString('ar-MA');

    let output = `${color}[${levelName}]${RESET_COLOR} [${time}] ${entry.message}`;

    // Add context if present
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(entry.context)}`;
    }

    // Add request ID if present
    if (entry.requestId) {
      output += ` (req: ${entry.requestId})`;
    }

    // Choose console method based on level
    switch (entry.level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
      case 'fatal':
        console.error(output);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }
  }

  // =========================================================================
  // Flushing / الإفراغ
  // =========================================================================

  private startFlushTimer(): void {
    if (typeof setInterval !== 'undefined') {
      this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    // Copy and clear buffer
    const entries = [...this.buffer];
    this.buffer = [];

    try {
      // Send to file system (Node.js)
      if (this.config.enableFile && typeof require !== 'undefined') {
        await this.writeToFile(entries);
      }

      // Send to remote service
      if (this.config.enableRemote && this.config.remoteUrl) {
        await this.sendToRemote(entries);
      }
    } catch (error) {
      // If flush fails, put entries back
      this.buffer.unshift(...entries);
      console.error('[Logger] Failed to flush logs:', error);
    }
  }

  private async writeToFile(entries: LogEntry[]): Promise<void> {
    // This would use fs in Node.js environment
    // For now, just a placeholder
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Logger] Would write ${entries.length} entries to file`);
    }
  }

  private async sendToRemote(entries: LogEntry[]): Promise<void> {
    if (!this.config.remoteUrl) return;

    try {
      const response = await fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.remoteApiKey && { 
            'Authorization': `Bearer ${this.config.remoteApiKey}` 
          }),
        },
        body: JSON.stringify({
          logs: entries,
          app: 'mavora',
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV,
        }),
      });

      if (!response.ok) {
        throw new Error(`Remote logging failed: ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  // =========================================================================
  // Utility Methods / طرق مساعدة
  // =========================================================================

  private getSource(): string {
    if (typeof window === 'undefined') {
      // Server-side - get from call stack
      const stack = new Error().stack;
      if (stack) {
        const match = stack.match(/at\s+(.*?)(\s|$)/g)?.[2];
        return match || 'server';
      }
      return 'server';
    }
    
    // Client-side - get from URL
    return typeof window !== 'undefined' ? window.location.pathname : 'unknown';
  }

  /**
   * Create child logger with context
   */
  child(context: Record<string, any>): ChildLogger {
    return new ChildLogger(this, context);
  }

  /**
   * Destroy logger instance
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    // Final flush
    this.flush();
  }
}

// =============================================================================
// Child Logger / مسجل فرعي
// =============================================================================

class ChildLogger {
  constructor(
    private parent: Logger,
    private context: Record<string, any>
  ) {}

  debug(message: string, extraContext?: Record<string, any>): void {
    this.parent.debug(message, { ...this.context, ...extraContext });
  }

  info(message: string, extraContext?: Record<string, any>): void {
    this.parent.info(message, { ...this.context, ...extraContext });
  }

  warn(message: string, extraContext?: Record<string, any>): void {
    this.parent.warn(message, { ...this.context, ...extraContext });
  }

  error(message: string, extraContext?: Record<string, any>, error?: Error): void {
    this.parent.error(message, { ...this.context, ...extraContext }, error);
  }
}

// =============================================================================
// Request-Specific Logger / مسجل خاص بالطلب
// =============================================================================

/**
 * Create a logger for a specific HTTP request
 */
export function createRequestLogger(
  baseLogger: Logger,
  requestId: string,
  userId?: string
): ChildLogger {
  baseLogger.setRequestId(requestId);
  
  const context: Record<string, any> = { requestId };
  if (userId) {
    context.userId = userId;
  }
  
  return baseLogger.child(context);
}

// =============================================================================
// Pre-configured Loggers / مسجلات معدة مسبقاً
// =============================================================================

/**
 * Default application logger
 */
export const logger = new Logger({
  minLevel: (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  enableRemote: !!process.env.LOG_REMOTE_URL,
  remoteUrl: process.env.LOG_REMOTE_URL,
  remoteApiKey: process.env.LOG_REMOTE_API_KEY,
});

/**
 * API request logger
 */
export const apiLogger = logger.child({ source: 'api' });

/**
 * Database operation logger
 */
export const dbLogger = logger.child({ source: 'database' });

/**
 * Authentication logger
 */
export const authLogger = logger.child({ source: 'auth' });

/**
 * Payment logger (more sensitive)
 */
export const paymentLogger = new Logger({
  minLevel: 'warn', // Only log warnings and above for payments
  enableConsole: true,
  enableRemote: true,
  remoteUrl: process.env.LOG_REMOTE_URL,
}).child({ source: 'payments' });

// =============================================================================
// Middleware Helpers / مساعدات الوسائط
// =============================================================================

/**
 * Express/Next.js middleware for request logging
 */
export function requestLoggerMiddleware() {
  return (req: any, res: any, next: () => void) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || generateRequestId();
    
    // Add request ID to response headers
    res.setHeader('x-request-id', requestId);
    
    // Log request
    apiLogger.info(`${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
    });
    
    // Log response on finish
    res.on('finish', () => {
      const duration = Date.now() - start;
      apiLogger.info(`${req.method} ${req.url} completed`, {
        statusCode: res.statusCode,
        duration,
      });
    });
    
    next();
  };
}

/**
 * Error logging middleware
 */
export function errorLoggerMiddleware() {
  return (err: Error, req: any, res: any, next: (err: Error) => void) => {
    apiLogger.error(`Request error: ${err.message}`, {
      url: req.url,
      method: req.method,
      stack: err.stack,
    }, err);
    
    next(err);
  };
}

// =============================================================================
// Utility Functions / دوال مساعدة
// =============================================================================

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeForLogging(data: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'password', 'passwd', 'secret', 'token', 'apiKey', 'apikey',
    'authorization', 'cookie', 'credit_card', 'card_number', 'cvv',
    'ssn', 'social_security', 'password_hash',
  ];

  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Format log entry for display (Arabic-friendly)
 */
export function formatLogEntry(entry: LogEntry): string {
  const date = new Date(entry.timestamp).toLocaleString('ar-EG');
  const level = ARABIC_LEVEL_NAMES[entry.level];
  
  let formatted = `[${date}] [${level}] ${entry.message}`;
  
  if (entry.context && Object.keys(entry.context).length > 0) {
    formatted += ` | ${JSON.stringify(sanitizeForLogging(entry.context))}`;
  }
  
  if (entry.requestId) {
    formatted += ` | طلب: ${entry.requestId}`;
  }
  
  return formatted;
}

// =============================================================================
// Export Default / التصدير الافتراضي
// =============================================================================

export default logger;
