/**
 * API 에러 핸들러 유틸리티
 *
 * API Route에서 발생하는 에러를 표준화된 형식으로 처리합니다.
 *
 * 주요 기능:
 * - 표준화된 API 에러 응답 생성
 * - HTTP 상태 코드 자동 매핑
 * - 에러 타입별 분류 및 처리
 * - 개발/프로덕션 환경별 에러 상세 정보 제어
 */

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * API 에러 클래스
 *
 * 표준화된 API 에러 응답을 생성하기 위한 커스텀 에러 클래스입니다.
 *
 * @example
 * ```typescript
 * throw new ApiError(400, "잘못된 요청이에요", "INVALID_REQUEST", {
 *   field: "email",
 *   reason: "이메일 형식이 올바르지 않아요"
 * });
 * ```
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * API 에러 응답 인터페이스
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp?: string;
}

/**
 * 표준화된 성공 응답 인터페이스
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
}

/**
 * 표준화된 에러 응답 인터페이스 (v2)
 */
export interface ApiStandardErrorResponse {
  success: false
  error: {
    message: string
    code: string
    statusCode: number
  }
}

/**
 * API 응답 타입 (성공 또는 에러)
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiStandardErrorResponse

/**
 * API 에러를 표준화된 NextResponse로 변환합니다.
 *
 * @param error - 발생한 에러 객체
 * @returns 표준화된 에러 응답 (NextResponse)
 *
 * @example
 * ```typescript
 * export async function POST(req: Request) {
 *   try {
 *     // API 로직
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Sentry에 에러 리포팅
  Sentry.captureException(error, {
    tags: {
      errorType: "api",
    },
  });

  // 개발 환경에서 콘솔에 에러 출력
  if (process.env.NODE_ENV === "development") {
    console.error("API Error:", error);
  }

  // ApiError 타입인 경우
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }

  // Supabase 에러인 경우
  if (isSupabaseError(error)) {
    const message = getSupabaseErrorMessage(error);
    return NextResponse.json(
      {
        error: message,
        code: "SUPABASE_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // Zod Validation 에러인 경우
  if (isZodError(error)) {
    return NextResponse.json(
      {
        error: "입력값이 올바르지 않아요",
        code: "VALIDATION_ERROR",
        details: (error as { errors: unknown }).errors,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // 일반 Error 객체인 경우
  if (error instanceof Error) {
    // 프로덕션에서는 상세 에러 메시지 숨김
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";

    return NextResponse.json(
      {
        error: message,
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  // 알 수 없는 에러인 경우
  return NextResponse.json(
    {
      error: "알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
      code: "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * Supabase 에러 여부를 확인합니다.
 */
function isSupabaseError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    ("code" in error || "message" in error) &&
    "details" in error
  );
}

/**
 * Supabase 에러 메시지를 한글로 변환합니다.
 */
function getSupabaseErrorMessage(error: unknown): string {
  const err = error as { code?: string; message?: string };

  // 일반적인 Supabase 에러 코드별 메시지
  const errorMessages: Record<string, string> = {
    "23505": "이미 존재하는 데이터예요",
    "23503": "참조하는 데이터가 없어요",
    "42501": "권한이 없어요",
    "42P01": "테이블을 찾을 수 없어요",
    PGRST116: "데이터를 찾을 수 없어요",
    PGRST301: "필수 항목이 누락됐어요",
  };

  if (err.code && errorMessages[err.code]) {
    return errorMessages[err.code];
  }

  // 인증 관련 에러
  if (err.message?.toLowerCase().includes("jwt")) {
    return "로그인 세션이 만료됐어요. 다시 로그인해 주세요.";
  }

  if (err.message?.toLowerCase().includes("refresh token")) {
    return "인증 정보가 만료됐어요. 다시 로그인해 주세요.";
  }

  return "데이터베이스 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
}

/**
 * Zod Validation 에러 여부를 확인합니다.
 */
function isZodError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as { errors: unknown }).errors)
  );
}

/**
 * 자주 사용하는 API 에러 응답 생성 함수들
 * NextResponse를 반환하므로 직접 return 가능합니다.
 */

/** 400 Bad Request - 잘못된 요청 */
export function badRequest(message: string, details?: unknown): NextResponse<ApiStandardErrorResponse> {
  return apiError(message, "BAD_REQUEST", 400);
}

/** 401 Unauthorized - 인증 필요 */
export function unauthorized(message = "로그인이 필요해요"): NextResponse<ApiStandardErrorResponse> {
  return apiError(message, "UNAUTHORIZED", 401);
}

/** 403 Forbidden - 권한 없음 */
export function forbidden(message = "권한이 없어요"): NextResponse<ApiStandardErrorResponse> {
  return apiError(message, "FORBIDDEN", 403);
}

/** 404 Not Found - 리소스 없음 */
export function notFound(message = "데이터를 찾을 수 없어요"): NextResponse<ApiStandardErrorResponse> {
  return apiError(message, "NOT_FOUND", 404);
}

/** 409 Conflict - 충돌 */
export function conflict(message: string, details?: unknown): NextResponse<ApiStandardErrorResponse> {
  return apiError(message, "CONFLICT", 409);
}

/** 422 Unprocessable Entity - 처리 불가 */
export function unprocessable(message: string, details?: unknown): NextResponse<ApiStandardErrorResponse> {
  return apiError(message, "UNPROCESSABLE_ENTITY", 422);
}

/** 429 Too Many Requests - 요청 초과 */
export function tooManyRequests(
  message = "너무 많은 요청이 발생했어요. 잠시 후 다시 시도해 주세요."
): NextResponse<ApiStandardErrorResponse> {
  return apiError(message, "TOO_MANY_REQUESTS", 429);
}

/** 500 Internal Server Error - 서버 오류 */
export function internalError(
  message = "서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  details?: unknown
): NextResponse<ApiStandardErrorResponse> {
  return apiError(message, "INTERNAL_ERROR", 500);
}

/** 503 Service Unavailable - 서비스 이용 불가 */
export function serviceUnavailable(
  message = "서비스를 일시적으로 이용할 수 없어요. 잠시 후 다시 시도해 주세요."
): NextResponse<ApiStandardErrorResponse> {
  return apiError(message, "SERVICE_UNAVAILABLE", 503);
}

/**
 * 표준화된 성공 응답 생성 헬퍼
 * @param data 응답 데이터
 * @param status HTTP 상태 코드 (기본: 200)
 * @returns NextResponse with standard success format
 */
export function apiSuccess<T>(
  data: T,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

/**
 * 표준화된 에러 응답 생성 헬퍼
 * @param message 에러 메시지
 * @param code 에러 코드
 * @param statusCode HTTP 상태 코드
 * @returns NextResponse with standard error format
 */
export function apiError(
  message: string,
  code: string,
  statusCode: number
): NextResponse<ApiStandardErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        statusCode,
      },
    },
    { status: statusCode }
  )
}
