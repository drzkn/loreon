import { ILogger } from '@/application/interfaces/ILogger';
import { ConsoleLogger } from '@/infrastructure/logging/ConsoleLogger';
import { StreamLogger } from '@/infrastructure/logging/StreamLogger';

export interface LoggerOptions {
  enableStream?: boolean;
  streamFunction?: (message: string) => void;
}

export class LoggerService {
  private logger: ILogger;

  constructor(options: LoggerOptions = {}) {
    if (options.enableStream && options.streamFunction) {
      this.logger = new StreamLogger(options.streamFunction);
    } else {
      this.logger = new ConsoleLogger();
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.logger.error(message, error, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  success(message: string, meta?: Record<string, unknown>): void {
    this.logger.success(message, meta);
  }

  // Método de conveniencia para logs con niveles específicos
  log(
    level: 'info' | 'success' | 'error' | 'warn' | 'debug',
    message: string,
    error?: Error,
    meta?: Record<string, unknown>
  ): void {
    switch (level) {
      case 'info':
        this.info(message, meta);
        break;
      case 'success':
        this.success(message, meta);
        break;
      case 'error':
        this.error(message, error, meta);
        break;
      case 'warn':
        this.warn(message, meta);
        break;
      case 'debug':
        this.debug(message, meta);
        break;
    }
  }
}
