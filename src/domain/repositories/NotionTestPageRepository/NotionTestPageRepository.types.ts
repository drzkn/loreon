export interface TestResult {
  method: string;
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
  duration: number;
} 