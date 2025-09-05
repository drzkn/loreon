import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoggerService } from '../LoggerService';

describe('LoggerService', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create a logger with ConsoleLogger by default', () => {
      const logger = new LoggerService();
      
      logger.info('test message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] test message')
      );
    });

    it('should create a logger with StreamLogger when stream options are provided', () => {
      const streamFunction = vi.fn();
      const logger = new LoggerService({
        enableStream: true,
        streamFunction
      });
      
      logger.info('test message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] test message')
      );
      expect(streamFunction).toHaveBeenCalledWith('test message');
    });
  });

  describe('Logging methods', () => {
    let logger: LoggerService;

    beforeEach(() => {
      logger = new LoggerService();
    });

    it('should log info messages', () => {
      logger.info('info message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] info message')
      );
    });

    it('should log success messages', () => {
      logger.success('success message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[SUCCESS] success message')
      );
    });

    it('should log warning messages', () => {
      logger.warn('warning message');
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] warning message')
      );
    });

    it('should log error messages', () => {
      const error = new Error('test error');
      logger.error('error message', error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] error message'),
        error
      );
    });

    it('should log debug messages', () => {
      logger.debug('debug message');
      
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] debug message')
      );
    });
  });

  describe('Generic log method', () => {
    let logger: LoggerService;

    beforeEach(() => {
      logger = new LoggerService();
    });

    it('should route info level to info method', () => {
      logger.log('info', 'info message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] info message')
      );
    });

    it('should route success level to success method', () => {
      logger.log('success', 'success message');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[SUCCESS] success message')
      );
    });

    it('should route warn level to warn method', () => {
      logger.log('warn', 'warning message');
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] warning message')
      );
    });

    it('should route error level to error method', () => {
      const error = new Error('test error');
      logger.log('error', 'error message', error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] error message'),
        error
      );
    });

    it('should route debug level to debug method', () => {
      logger.log('debug', 'debug message');
      
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] debug message')
      );
    });
  });

  describe('Stream functionality', () => {
    it('should send messages to stream when configured', () => {
      const streamFunction = vi.fn();
      const logger = new LoggerService({
        enableStream: true,
        streamFunction
      });

      logger.info('info message');
      logger.success('success message');
      logger.warn('warning message');
      logger.error('error message');
      logger.debug('debug message');

      expect(streamFunction).toHaveBeenCalledTimes(5);
      expect(streamFunction).toHaveBeenCalledWith('info message');
      expect(streamFunction).toHaveBeenCalledWith('success message');
      expect(streamFunction).toHaveBeenCalledWith('warning message');
      expect(streamFunction).toHaveBeenCalledWith('error message');
      expect(streamFunction).toHaveBeenCalledWith('debug message');
    });

    it('should not call stream function when not configured', () => {
      const streamFunction = vi.fn();
      const logger = new LoggerService(); // Sin configurar stream

      logger.info('info message');

      expect(streamFunction).not.toHaveBeenCalled();
    });
  });
});
