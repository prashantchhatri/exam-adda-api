export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

export function ok<T>(message: string, data: T | null): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

