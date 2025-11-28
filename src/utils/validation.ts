/**
 * Validation Utilities
 * 검증 관련 유틸리티
 */

import { UPLOAD_CONFIG } from '@config'

/**
 * 파일 확장자 검증
 */
export function isValidFileExtension(filename: string): boolean {
  const ext = `.${filename.split('.').pop()?.toLowerCase()}`
  return UPLOAD_CONFIG.supportedFormats.includes(ext as '.dxf' | '.dwg')
}

/**
 * 파일 크기 검증
 */
export function isValidFileSize(size: number): boolean {
  return size <= UPLOAD_CONFIG.maxFileSize
}

/**
 * CAD 파일 전체 검증
 */
export function validateCadFile(file: File): { valid: boolean; error?: string } {
  if (!isValidFileExtension(file.name)) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다. (지원: ${UPLOAD_CONFIG.supportedFormats.join(', ')})`,
    }
  }

  if (!isValidFileSize(file.size)) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. (최대: ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB)`,
    }
  }

  return { valid: true }
}

/**
 * 이메일 형식 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 빈 값 검증
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}
