export type SkinProfile = {
  skinType?: string;
  radiance?: number;
  redness?: number;
  texture?: number;
  moisture?: number;
};

export type TryOnStatus = "processing" | "completed" | "failed";

export type TryOnResult = {
  id: string;
  garmentId: string;
  status: TryOnStatus;
  imageUrl?: string;
  error?: string;
  providerJobId?: string;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
};