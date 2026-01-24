/**
 * 병렬 배치 처리 유틸리티
 * Rate Limit을 고려하여 동시 처리 수를 제한
 */

export interface BatchResult<T> {
  success: boolean
  data?: T
  error?: Error
  index: number
}

export interface BatchOptions {
  concurrency: number      // 동시 처리 수
  delayBetweenBatches: number  // 배치 간 딜레이 (ms)
  onProgress?: (completed: number, total: number) => void
}

const DEFAULT_OPTIONS: BatchOptions = {
  concurrency: 5,
  delayBetweenBatches: 500,
}

/**
 * 병렬 배치 처리 실행
 * @param items 처리할 아이템 배열
 * @param processor 각 아이템을 처리하는 함수
 * @param options 배치 옵션
 * @returns 처리 결과 배열
 */
export async function parallelBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: Partial<BatchOptions> = {}
): Promise<BatchResult<R>[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const results: BatchResult<R>[] = []
  let completed = 0

  // 배치 단위로 분할
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += opts.concurrency) {
    batches.push(items.slice(i, i + opts.concurrency))
  }

  let globalIndex = 0

  for (const batch of batches) {
    // 현재 배치 병렬 처리
    const batchPromises = batch.map(async (item, localIndex) => {
      const index = globalIndex + localIndex
      try {
        const data = await processor(item, index)
        return { success: true, data, index }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          index
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    globalIndex += batch.length
    completed += batch.length
    opts.onProgress?.(completed, items.length)

    // 다음 배치 전 딜레이 (마지막 배치가 아닌 경우)
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, opts.delayBetweenBatches))
    }
  }

  return results
}

/**
 * 재시도 로직이 포함된 병렬 배치 처리
 * @param items 처리할 아이템 배열
 * @param processor 각 아이템을 처리하는 함수
 * @param options 배치 옵션
 * @param maxRetries 최대 재시도 횟수
 * @returns 처리 결과 배열
 */
export async function parallelBatchWithRetry<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: Partial<BatchOptions> = {},
  maxRetries: number = 2
): Promise<BatchResult<R>[]> {
  const results = await parallelBatch(items, processor, options)

  // 실패한 항목 재시도
  const failedItems = results
    .filter(r => !r.success)
    .map(r => ({ item: items[r.index], originalIndex: r.index }))

  if (failedItems.length === 0 || maxRetries <= 0) {
    return results
  }

  console.log(`🔄 ${failedItems.length}건 재시도 중... (남은 재시도: ${maxRetries - 1})`)

  // 재시도 (딜레이 증가)
  await new Promise(resolve => setTimeout(resolve, 2000))

  const retryResults = await parallelBatchWithRetry(
    failedItems.map(f => f.item),
    async (item, _index) => {
      const originalIndex = failedItems.find(f => f.item === item)?.originalIndex ?? 0
      return processor(item, originalIndex)
    },
    { ...options, concurrency: Math.max(2, (options.concurrency || 5) - 2) },
    maxRetries - 1
  )

  // 원래 결과 배열 업데이트
  for (let i = 0; i < retryResults.length; i++) {
    const originalIndex = failedItems[i].originalIndex
    results[originalIndex] = {
      ...retryResults[i],
      index: originalIndex
    }
  }

  return results
}

/**
 * 배치 결과 요약
 */
export function summarizeBatchResults<R>(results: BatchResult<R>[]): {
  total: number
  succeeded: number
  failed: number
  successRate: number
} {
  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return {
    total: results.length,
    succeeded,
    failed,
    successRate: results.length > 0 ? (succeeded / results.length) * 100 : 0
  }
}
