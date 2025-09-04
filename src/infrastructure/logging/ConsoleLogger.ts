import { ILogger, LogMetadata } from '@/application/interfaces/ILogger';

export class ConsoleLogger implements ILogger {
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level} ${message}`;
  }

  info(message: string, meta?: LogMetadata): void {
    const formattedMessage = this.formatMessage('ℹ️ [INFO]', message);
    if (meta) {
      console.log(formattedMessage, meta);
    } else {
      console.log(formattedMessage);
    }
  }

  warn(message: string, meta?: LogMetadata): void {
    const formattedMessage = this.formatMessage('⚠️ [WARN]', message);
    if (meta) {
      console.warn(formattedMessage, meta);
    } else {
      console.warn(formattedMessage);
    }
  }

  error(message: string, error?: Error, meta?: LogMetadata): void {
    const formattedMessage = this.formatMessage('❌ [ERROR]', message);
    if (error && meta) {
      console.error(formattedMessage, error, meta);
    } else if (error) {
      console.error(formattedMessage, error);
    } else if (meta) {
      console.error(formattedMessage, meta);
    } else {
      console.error(formattedMessage);
    }
  }

  debug(message: string, meta?: LogMetadata): void {
    const formattedMessage = this.formatMessage('🐛 [DEBUG]', message);
    if (meta) {
      console.debug(formattedMessage, meta);
    } else {
      console.debug(formattedMessage);
    }
  }
}
