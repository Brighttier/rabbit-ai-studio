/**
 * Logging and Error Monitoring
 * Structured logging with different levels and error tracking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  requestId?: string;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: Error;
  context: Record<string, any>;
  userId?: string;
  requestId?: string;
  stackTrace?: string;
}

/**
 * Logger class with structured logging
 */
export class Logger {
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, { ...context, error });
  }

  /**
   * Log a fatal error message
   */
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, { ...context, error });
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
    };

    // Add to in-memory logs
    this.logs.push(entry);

    // Trim logs if needed
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with colors
    const levelName = LogLevel[level];
    const color = this.getLevelColor(level);
    const timestamp = entry.timestamp.toISOString();

    if (typeof window === 'undefined') {
      // Server-side: use console with colors
      console.log(
        `${color}[${timestamp}] [${levelName}]${this.resetColor} ${message}`,
        context || ''
      );
    } else {
      // Client-side: use console methods
      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(`[${timestamp}] [${levelName}] ${message}`, context || '');
    }
  }

  /**
   * Get ANSI color code for log level
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '\x1b[36m'; // Cyan
      case LogLevel.INFO:
        return '\x1b[32m'; // Green
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      case LogLevel.FATAL:
        return '\x1b[35m'; // Magenta
      default:
        return '\x1b[0m'; // Reset
    }
  }

  private resetColor = '\x1b[0m';

  /**
   * Get console method for log level
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

/**
 * Error tracking service
 */
export class ErrorTracker {
  private errors: ErrorReport[] = [];
  private maxErrors: number = 500;

  /**
   * Track an error
   */
  trackError(error: Error, context: Record<string, any> = {}): ErrorReport {
    const report: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date(),
      error,
      context,
      userId: context.userId,
      requestId: context.requestId,
      stackTrace: error.stack,
    };

    this.errors.push(report);

    // Trim errors if needed
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to logger
    logger.error(error.message, error, context);

    // TODO: Send to external error tracking service (Sentry, etc.)
    // this.sendToExternalService(report);

    return report;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 50): ErrorReport[] {
    return this.errors.slice(-count);
  }

  /**
   * Get error by ID
   */
  getErrorById(id: string): ErrorReport | undefined {
    return this.errors.find((error) => error.id === id);
  }

  /**
   * Get errors by user ID
   */
  getErrorsByUser(userId: string): ErrorReport[] {
    return this.errors.filter((error) => error.userId === userId);
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Generate unique error ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send error to external service (placeholder)
   */
  private async sendToExternalService(report: ErrorReport): Promise<void> {
    // TODO: Integrate with Sentry, LogRocket, etc.
    // Example: Sentry.captureException(report.error, { extra: report.context });
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Start timing an operation
   */
  startTimer(name: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    };
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sorted.reduce((a, b) => a + b, 0) / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, number[]> {
    return this.metrics;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Global instances
export const logger = new Logger(
  process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
);
export const errorTracker = new ErrorTracker();
export const performanceMonitor = new PerformanceMonitor();

/**
 * Helper to wrap async functions with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorTracker.trackError(error as Error, { ...context, args });
      throw error;
    }
  }) as T;
}

/**
 * Helper to wrap async functions with performance monitoring
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  metricName: string
): T {
  return (async (...args: Parameters<T>) => {
    const stopTimer = performanceMonitor.startTimer(metricName);
    try {
      return await fn(...args);
    } finally {
      stopTimer();
    }
  }) as T;
}
