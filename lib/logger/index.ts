/**
 * Structured Logging Utility
 *
 * JSON 포맷의 구조화된 로그를 제공하는 유틸리티
 * - timestamp: ISO 8601 형식
 * - level: info/warn/error/debug
 * - message: 로그 메시지
 * - traceId: 요청별 추적 ID (UUID v4)
 * - module: 모듈/파일 태그
 * - metadata: 추가 컨텍스트 데이터
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  traceId?: string
  module?: string
  metadata?: Record<string, unknown>
}

/**
 * 로거 클래스
 */
class Logger {
  private module?: string
  private traceId?: string

  constructor(module?: string, traceId?: string) {
    this.module = module
    this.traceId = traceId
  }

  /**
   * 환경별 로그 레벨 체크
   */
  private shouldLog(level: LogLevel): boolean {
    const isProd = process.env.NODE_ENV === 'production'

    if (isProd) {
      // Production: info, warn, error만 로그
      return level !== 'debug'
    }

    // Development: 모든 레벨 로그
    return true
  }

  /**
   * 로그 출력
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(this.traceId && { traceId: this.traceId }),
      ...(this.module && { module: this.module }),
      ...(metadata && { metadata }),
    }

    // JSON 형식으로 출력
    console.log(JSON.stringify(entry))
  }

  /**
   * INFO 레벨 로그
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata)
  }

  /**
   * WARN 레벨 로그
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata)
  }

  /**
   * ERROR 레벨 로그
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata)
  }

  /**
   * DEBUG 레벨 로그
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata)
  }

  /**
   * 모듈 태그가 있는 자식 로거 생성
   */
  child(options: { module?: string; traceId?: string }): Logger {
    return new Logger(
      options.module || this.module,
      options.traceId || this.traceId
    )
  }
}

/**
 * 기본 로거 인스턴스
 */
export const logger = new Logger()

/**
 * 모듈별 로거 생성
 * @param options 로거 옵션 (module, traceId)
 * @returns Logger 인스턴스
 */
export function createLogger(options?: { module?: string; traceId?: string }): Logger {
  if (!options) return logger
  return new Logger(options.module, options.traceId)
}

/**
 * Trace ID 생성 (crypto.randomUUID 사용)
 */
export function generateTraceId(): string {
  return crypto.randomUUID()
}

/**
 * NextRequest에서 Trace ID 추출 또는 생성
 */
export function getOrCreateTraceId(request: Request): string {
  // 헤더에서 기존 traceId 확인 (propagation 지원)
  const existingTraceId = request.headers.get('x-trace-id')
  if (existingTraceId) {
    return existingTraceId
  }

  // 새 traceId 생성
  return generateTraceId()
}

/**
 * Request Context에 Trace ID 추가하는 미들웨어 헬퍼
 *
 * 사용법:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const traceId = getOrCreateTraceId(request)
 *   const log = logger.child({ module: 'sync', traceId })
 *   log.info('Sync started')
 *   // ...
 * }
 * ```
 */
export function createRequestLogger(request: Request, module: string): Logger {
  const traceId = getOrCreateTraceId(request)
  return logger.child({ module, traceId })
}
