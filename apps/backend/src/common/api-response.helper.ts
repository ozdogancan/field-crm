export class ApiResponseHelper {
  static success<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      message: message || 'İşlem başarılı',
    };
  }

  static paginated<T>(data: T[], total: number, page: number, limit: number) {
    return {
      success: true,
      data,
      meta: { page, limit, total },
    };
  }

  static error(code: string, message: string, details?: Array<{ field: string; message: string }>) {
    return {
      success: false,
      error: { code, message, details },
    };
  }
}
