export interface SupabaseError {
  message: string;
  details?: string;
  code?: string;
}

export type ErrorType = SupabaseError | Error;

export interface APIResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}