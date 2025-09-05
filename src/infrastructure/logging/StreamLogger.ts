import { ILogger, LogMetadata } from '@/application/interfaces/ILogger';
import { ConsoleLogger } from './ConsoleLogger';

export class StreamLogger extends ConsoleLogger implements ILogger {
  constructor(private sendLogToStream?: (message: string) => void) {
    super();
  }

  private sendToStreamIfAvailable(message: string): void {
    if (this.sendLogToStream) {
      this.sendLogToStream(message);
    }
  }

  info(message: string, meta?: LogMetadata): void {
    super.info(message, meta);
    this.sendToStreamIfAvailable(message);
  }

  warn(message: string, meta?: LogMetadata): void {
    super.warn(message, meta);
    this.sendToStreamIfAvailable(message);
  }

  error(message: string, error?: Error, meta?: LogMetadata): void {
    super.error(message, error, meta);
    this.sendToStreamIfAvailable(message);
  }

  debug(message: string, meta?: LogMetadata): void {
    super.debug(message, meta);
    this.sendToStreamIfAvailable(message);
  }

  success(message: string, meta?: LogMetadata): void {
    super.success(message, meta);
    this.sendToStreamIfAvailable(message);
  }
}
