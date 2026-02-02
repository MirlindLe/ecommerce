export class ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  meta?: any;
  timestamp: string;

  constructor(
    success: boolean,
    data?: T,
    message?: string,
    errors?: any,
    meta?: any,
  ) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.errors = errors;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message?: string, meta?: any): ApiResponse<T> {
    return new ApiResponse(true, data, message, undefined, meta);
  }

  static error<T>(message: string, errors?: any): ApiResponse<T> {
    return new ApiResponse(false, undefined as T, message, errors);
  }
}
