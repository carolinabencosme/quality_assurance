export type ApiErrorBody = {
  message?: string;
  status?: number;
  error?: string;
  code?: string;
  correlationId?: string;
};
