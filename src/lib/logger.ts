export interface LogLevel {
  ERROR: "error";
  WARN: "warn";
  INFO: "info";
  DEBUG: "debug";
}

export type LogData = {
  message: string;
  level: "error" | "warn" | "info" | "debug";
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  flagKey?: string;
  metadata?: Record<string, unknown>;
};

class Logger {
  private logToConsole(data: LogData): void {
    const timestamp = data.timestamp.toISOString();
    const prefix = `[${timestamp}] [${data.level.toUpperCase()}]`;

    switch (data.level) {
      case "error":
        console.error(prefix, data.message, data.metadata || "");
        break;
      case "warn":
        console.warn(prefix, data.message, data.metadata || "");
        break;
      case "info":
        console.info(prefix, data.message, data.metadata || "");
        break;
      case "debug":
        console.debug(prefix, data.message, data.metadata || "");
        break;
    }
  }

  private async logToExternal(data: LogData): Promise<void> {
    // Here you can integrate with external logging services like:
    // - Winston
    // - DataDog
    // - Sentry
    // - LogRocket
    // - Custom webhook

    if (process.env.NODE_ENV === "production") {
      try {
        // Example: Send to external logging service
        // await fetch('/api/logs', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // });

        // Prevent unused parameter warning
        void data;
      } catch (error) {
        console.error("Failed to log to external service:", error);
      }
    } else {
      // Prevent unused parameter warning in non-production
      void data;
    }
  }

  async log(data: Omit<LogData, "timestamp">): Promise<void> {
    const logData: LogData = {
      ...data,
      timestamp: new Date()
    };

    this.logToConsole(logData);
    await this.logToExternal(logData);
  }

  async error(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log({ message, level: "error", metadata });
  }

  async warn(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log({ message, level: "warn", metadata });
  }

  async info(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log({ message, level: "info", metadata });
  }

  async debug(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log({ message, level: "debug", metadata });
  }

  // Specific method for feature flag warnings
  async flagWarning(
    flagKey: string,
    message: string,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    await this.warn(`[FEATURE_FLAG] ${message}`, {
      flagKey,
      userId,
      sessionId,
      type: "feature_flag_warning"
    });
  }
}

export const logger = new Logger();
export default logger;
