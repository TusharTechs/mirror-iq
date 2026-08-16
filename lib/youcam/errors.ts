export type YouCamErrorCode =
  | "config_missing"
  | "auth_failed"
  | "rate_limited"
  | "timeout"
  | "request_failed"
  | "malformed_response"
  | "processing_failed"
  | "invalid_input"
  | "cancelled"
  | "unexpected";

export class YouCamApiError extends Error {
  code: YouCamErrorCode;
  status?: number;
  retryable: boolean;

  constructor(opts: {
    code: YouCamErrorCode;
    message: string;
    status?: number;
    retryable: boolean;
  }) {
    super(opts.message);
    this.name = "YouCamApiError";
    this.code = opts.code;
    this.status = opts.status;
    this.retryable = opts.retryable;
  }
}