/**
 * Async Utilities
 * 비동기 관련 유틸리티
 */

/**
 * 지정된 시간만큼 대기
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 디바운스 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * 쓰로틀 함수
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}

/**
 * 재시도 로직이 포함된 비동기 함수 실행
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; delay?: number } = {}
): Promise<T> {
  const { attempts = 3, delay = 1000 } = options

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === attempts - 1) throw error
      await sleep(delay * (i + 1)) // 지수 백오프
    }
  }

  throw new Error('Retry failed')
}
