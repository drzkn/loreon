export interface LogMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ILogger {
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, error?: Error, meta?: LogMetadata): void;
  debug(message: string, meta?: LogMetadata): void;
  success(message: string, meta?: LogMetadata): void;
}
