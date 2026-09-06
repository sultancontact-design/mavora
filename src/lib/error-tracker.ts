/**
 * Error Tracking & Logging System
 * Comprehensive error handling, logging, and reporting for Mavora
 * 
 * @module lib/error-tracker
 */

// ============================================================
// Error Types & Classes
// ============================================================

export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  NETWORK = 'NETWORK',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL = 'INTERNAL',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  additionalData?: Record<string, any>;
}

export interface AppError {
  id: string;
  message: string;
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  statusCode: number;
  timestamp: Date;
  stack?: string;
  context: ErrorContext;
  cause?: Error;
  userMessage?: string; // Safe message to show to users
}

// ============================================================
// Custom Error Class
// ============================================================

export class MavoraError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly errorId: string;
  public readonly userMessage: string;

  constructor(
    message: string,
    options: {
      code?: string;
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      statusCode?: number;
      context?: ErrorContext;
      cause?: Error;
      userMessage?: string;
    } = {}
  ) {
    super(message);
    
    this.name = 'MavoraError';
    this.code = options.code || 'GENERIC_ERROR';
    this.category = options.category || ErrorCategory.INTERNAL;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.statusCode = options.statusCode || 500;
    this.context = options.context || {};
    this.timestamp = new Date();
    this.errorId = this.generateErrorId();
    this.userMessage = options.userMessage || 'حدث خطأ. يرجى المحاولة مرة أخرى.';
    
    if (options.cause) {
      this.cause = options.cause;
    }
  }

  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `err_${timestamp}_${random}`;
  }

  toAppError(): AppError {
    return {
      id: this.errorId,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      stack: this.stack,
      context: this.context,
      cause: this.cause as Error | undefined,
      userMessage: this.userMessage,
    };
  }

  toJSON(): Record<string, any> {
    return {
      errorId: this.errorId,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      category: this.category,
      severity: this.severity,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}

// ============================================================
// Predefined Errors
// ============================================================

export class AuthenticationError extends MavoraError {
  constructor(message: string = 'فشل المصادقة', context?: ErrorContext) {
    super(message, {
      code: 'AUTH_FAILED',
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      statusCode: 401,
      context,
      userMessage: 'بيانات الدخول غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.',
    });
  }
}

export class AuthorizationError extends MavoraError {
  constructor(message: string = 'ليس لديك صلاحية', context?: ErrorContext) {
    super(message, {
      code: 'FORBIDDEN',
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.HIGH,
      statusCode: 403,
      context,
      userMessage: 'ليس لديك صلاحية للوصول إلى هذا المورد.',
    });
  }
}

export class ValidationError extends MavoraError {
  constructor(message: string = 'بيانات غير صالحة', context?: ErrorContext) {
    super(message, {
      code: 'VALIDATION_ERROR',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      statusCode: 400,
      context,
      userMessage: 'البيانات المدخلة غير صحيحة. يرجى المراجعة والمحاولة.',
    });
  }
}

export class NotFoundError extends MavoraError {
  constructor(resource: string = 'المورد', context?: ErrorContext) {
    super(`${resource} غير موجود`, {
      code: 'NOT_FOUND',
      category: ErrorCategory.NOT_FOUND,
      severity: ErrorSeverity.LOW,
      statusCode: 404,
      context,
      userMessage: `${resource} المطلوب غير موجود أو تم حذفه.`,
    });
  }
}

export class RateLimitError extends MavoraError {
  constructor(retryAfterSeconds: number = 60, context?: ErrorContext) {
    super('تجاوزت الحد المسموح من الطلبات', {
      code: 'RATE_LIMITED',
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      statusCode: 429,
      context: { ...context, additionalData: { retryAfterSeconds } },
      userMessage: `تجاوزت عدد الطلبات المسموحة. يرجى المحاولة بعد ${retryAfterSeconds} ثانية.`,
    });
  }
}

export class DatabaseError extends MavoraError {
  constructor(message: string = 'خطأ في قاعدة البيانات', cause?: Error, context?: ErrorContext) {
    super(message, {
      code: 'DATABASE_ERROR',
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.CRITICAL,
      statusCode: 500,
      cause,
      context,
      userMessage: 'حدث خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.',
    });
  }
}

export class ExternalApiError extends MavoraError {
  constructor(service: string, cause?: Error, context?: ErrorContext) {
    super(`خطأ في خدمة خارجية: ${service}`, {
      code: 'EXTERNAL_API_ERROR',
      category: ErrorCategory.EXTERNAL_API,
      severity: ErrorSeverity.HIGH,
      statusCode: 502,
      cause,
      context,
      userMessage: 'حدث خطأ في الاتصال بخدمة خارجية. نعمل على حل المشكلة.',
    });
  }
}

// ============================================================
// Error Logger
// ============================================================

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: Date;
  errorId?: string;
}

class ErrorLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // Core logging methods
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  private log(level: LogEntry['level'], message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
    };

    // Add to in-memory log
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output (colorized in dev)
    if (!this.isProduction || level === 'error') {
      const colors = {
        debug: '\x1b[36m',   // cyan
        info: '\x1b[32m',    // green
        warn: '\x1b[33m',    // yellow
        error: '\x1b[31m',   // red
      };
      const reset = '\x1b[0m';
      
      console.log(
        `${colors[level]}[${level.toUpperCase()}]${reset} ${message}`,
        data !== undefined ? data : ''
      );
    }

    // Send to external service in production
    if (this.isProduction && (level === 'error' || level === 'warn')) {
      this.sendToExternalService(entry);
    }
  }

  // Log application errors with full context
  logAppError(appError: AppError): void {
    this.error(appError.message, {
      errorId: appError.id,
      code: appError.code,
      category: appError.category,
      severity: appError.severity,
      statusCode: appError.statusCode,
      stack: appError.stack,
      context: appError.context,
    });
  }

  // Get recent logs (for debugging)
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Send to external logging service (Sentry, DataDog, etc.)
  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // This would integrate with:
    // - Sentry (https://sentry.io)
    // - DataDog (https://www.datadoghq.com)
    // - LogRocket (https://logrocket.com)
    // - Or custom endpoint
    
    const SENTRY_DSN = process.env.SENTRY_DSN;
    const LOG_ENDPOINT = process.env.LOG_ENDPOINT;

    if (SENTRY_DSN && entry.level === 'error') {
      try {
        // Example: Send to Sentry
        // await fetch(`${SENTRY_DSN}/api/0/store/`, { ... });
        console.debug('[ErrorTracker] Would send to Sentry');
      } catch (e) {
        console.error('[ErrorTracker] Failed to send to external service:', e);
      }
    }
  }
}

// Singleton instance
export const logger = new ErrorLogger();

// ============================================================
// Error Boundary Component Helper
// ============================================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof MavoraError) {
    return error.userMessage;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'حدث خطأ غير متوقع.';
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof MavoraError) {
    return error.statusCode;
  }
  
  return 500;
}

// ============================================================
// API Error Response Helper
// ============================================================

export function createErrorResponse(error: unknown, context?: Partial<ErrorContext>) {
  const statusCode = getErrorStatusCode(error);
  const message = getErrorMessage(error);
  
  let errorId: string | undefined;
  let code: string | undefined;
  
  if (error instanceof MavoraError) {
    errorId = error.errorId;
    code = error.code;
  }

  return {
    success: false,
    error: {
      id: errorId,
      code: code || 'INTERNAL_ERROR',
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error instanceof Error ? error.stack : undefined 
      }),
    },
    statusCode,
  };
}

// ============================================================
// Async Error Wrapper
// ============================================================

export async function asyncHandler<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<{ data?: T; error?: MavoraError }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    console.error('[asyncHandler] Caught error:', error);
    
    if (error instanceof MavoraError) {
      return { error };
    }
    
    // Wrap unknown errors
    const appError = new MavoraError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      {
        cause: error as Error,
        context,
      }
    );
    
    return { error: appError };
  }
}

// ============================================================
// Rate Limiting with Error Handling
// ============================================================

export class SmartRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string): { allowed: boolean; retryAfter: number; remaining: number } {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      // Create new window
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { allowed: true, retryAfter: 0, remaining: this.maxRequests - 1 };
    }

    if (record.count >= this.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return { allowed: false, retryAfter, remaining: 0 };
    }

    record.count++;
    return { allowed: true, retryAfter: 0, remaining: this.maxRequests - record.count };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Export pre-configured limiters
export const rateLimiters = {
  auth: new SmartRateLimiter(5, 60 * 60 * 1000), // 5 per hour
  api: new SmartRateLimiter(100, 60 * 1000),     // 100 per minute
  upload: new SmartRateLimiter(10, 60 * 1000),    // 10 per minute
  search: new SmartRateLimiter(30, 60 * 1000),    // 30 per minute
};

// ============================================================
// Export everything
// ============================================================

export default {
  MavoraError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  DatabaseError,
  ExternalApiError,
  logger,
  getErrorMessage,
  getErrorStatusCode,
  createErrorResponse,
  asyncHandler,
  rateLimiters,
  ErrorCategory,
  ErrorSeverity,
};
