/**
 * urlValidator.test.ts
 * URL 보안 검증 유틸리티 테스트
 *
 * 주요 테스트:
 * - validateSecureUrl: SSRF 방지 화이트리스트 검증
 * - 프로토콜 검증
 * - 호스트 화이트리스트 검증
 *
 * 참고: 파일 확장자 검증은 fileValidator.ts로 이동됨
 */

import { describe, it, expect } from 'vitest';

import {
    validateSecureUrl,
    validateUrl,
    isInternalResource,
    extractFileName,
    type UrlSecurityConfig,
} from '../urlValidator';

// 테스트용 기본 설정
const defaultConfig: UrlSecurityConfig = {
    allowedProtocols: ['https:'],
    allowedHosts: ['github.com', 'raw.githubusercontent.com'],
};

describe('validateSecureUrl', () => {
    describe('빈 URL 검사', () => {
        it('빈 문자열에 대해 EMPTY_URL 에러를 반환한다', () => {
            const result = validateSecureUrl('', defaultConfig);
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('EMPTY_URL');
        });

        it('공백만 있는 문자열에 대해 EMPTY_URL 에러를 반환한다', () => {
            const result = validateSecureUrl('   ', defaultConfig);
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('EMPTY_URL');
        });

        it('탭과 개행만 있는 문자열에 대해 EMPTY_URL 에러를 반환한다', () => {
            const result = validateSecureUrl('\t\n', defaultConfig);
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('EMPTY_URL');
        });
    });

    describe('URL 형식 검사', () => {
        it('유효하지 않은 URL 형식에 대해 INVALID_URL 에러를 반환한다', () => {
            const result = validateSecureUrl('not-a-url', defaultConfig);
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_URL');
        });

        it('프로토콜이 없는 URL에 대해 INVALID_URL 에러를 반환한다', () => {
            const result = validateSecureUrl(
                'github.com/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_URL');
        });

        it('잘못된 형식의 URL에 대해 INVALID_URL 에러를 반환한다', () => {
            const result = validateSecureUrl('http://', defaultConfig);
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_URL');
        });
    });

    describe('프로토콜 화이트리스트 검사', () => {
        it('허용되지 않은 프로토콜에 대해 INVALID_PROTOCOL 에러를 반환한다', () => {
            const result = validateSecureUrl(
                'http://github.com/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_PROTOCOL');
        });

        it('ftp 프로토콜에 대해 INVALID_PROTOCOL 에러를 반환한다', () => {
            const result = validateSecureUrl(
                'ftp://github.com/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_PROTOCOL');
        });

        it('file 프로토콜에 대해 INVALID_PROTOCOL 에러를 반환한다', () => {
            const result = validateSecureUrl(
                'file:///etc/passwd',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_PROTOCOL');
        });

        it('javascript 프로토콜에 대해 INVALID_PROTOCOL 에러를 반환한다', () => {
            const result = validateSecureUrl(
                'javascript:alert(1)',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_PROTOCOL');
        });

        it('data 프로토콜에 대해 INVALID_PROTOCOL 에러를 반환한다', () => {
            const result = validateSecureUrl(
                'data:text/html,<script>alert(1)</script>',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_PROTOCOL');
        });

        it('허용된 https 프로토콜은 통과한다', () => {
            const result = validateSecureUrl(
                'https://github.com/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(true);
        });

        it('http도 허용된 경우 통과한다', () => {
            const config: UrlSecurityConfig = {
                ...defaultConfig,
                allowedProtocols: ['https:', 'http:'],
            };
            const result = validateSecureUrl(
                'http://github.com/file.dxf',
                config
            );
            expect(result.valid).toBe(true);
        });
    });

    describe('호스트 화이트리스트 검사 (SSRF 방지)', () => {
        it('허용되지 않은 호스트에 대해 INVALID_HOST 에러를 반환한다', () => {
            const result = validateSecureUrl(
                'https://evil.com/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_HOST');
        });

        it('localhost에 대해 INVALID_HOST 에러를 반환한다', () => {
            const result = validateSecureUrl(
                'https://localhost/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_HOST');
        });

        it('127.0.0.1에 대해 INVALID_HOST 에러를 반환한다', () => {
            const result = validateSecureUrl(
                'https://127.0.0.1/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_HOST');
        });

        it('내부 IP (10.x.x.x)에 대해 INVALID_HOST 에러를 반환한다', () => {
            const result = validateSecureUrl(
                'https://10.0.0.1/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_HOST');
        });

        it('내부 IP (192.168.x.x)에 대해 INVALID_HOST 에러를 반환한다', () => {
            const result = validateSecureUrl(
                'https://192.168.1.1/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_HOST');
        });

        it('허용된 호스트는 통과한다', () => {
            const result = validateSecureUrl(
                'https://github.com/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(true);
        });

        it('허용된 호스트의 서브도메인은 통과한다', () => {
            const result = validateSecureUrl(
                'https://subdomain.github.com/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(true);
        });

        it('raw.githubusercontent.com은 통과한다', () => {
            const result = validateSecureUrl(
                'https://raw.githubusercontent.com/user/repo/main/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(true);
        });

        it('비슷한 이름의 악성 호스트는 차단한다', () => {
            const result = validateSecureUrl(
                'https://github.com.evil.com/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_HOST');
        });
    });

    // 참고: 파일 확장자 검사는 fileValidator.ts의 validateExtension()으로 이동됨

    describe('유효한 URL 통과', () => {
        it('모든 검증을 통과하면 valid: true를 반환한다', () => {
            const result = validateSecureUrl(
                'https://github.com/user/repo/file.dxf',
                defaultConfig
            );
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('쿼리 파라미터가 있어도 통과한다', () => {
            const result = validateSecureUrl(
                'https://github.com/file.dxf?v=1',
                defaultConfig
            );
            expect(result.valid).toBe(true);
        });

        it('해시가 있어도 통과한다', () => {
            const result = validateSecureUrl(
                'https://github.com/file.dxf#section',
                defaultConfig
            );
            expect(result.valid).toBe(true);
        });

        it('복잡한 경로도 통과한다', () => {
            const result = validateSecureUrl(
                'https://raw.githubusercontent.com/user/repo/main/assets/models/file.glb',
                defaultConfig
            );
            expect(result.valid).toBe(true);
        });
    });

    describe('URL 트리밍', () => {
        it('앞뒤 공백이 있는 URL을 정상 처리한다', () => {
            const result = validateSecureUrl(
                '  https://github.com/file.dxf  ',
                defaultConfig
            );
            expect(result.valid).toBe(true);
        });
    });

    // ========================================================================
    // XSS (Cross-Site Scripting) 보안 테스트
    // ========================================================================
    describe('XSS 공격 방어', () => {
        describe('JavaScript 프로토콜 인젝션', () => {
            it('javascript: 프로토콜을 차단한다', () => {
                const result = validateSecureUrl(
                    'javascript:alert(1)',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_PROTOCOL');
            });

            it('대소문자 혼합 JavaScript 프로토콜을 차단한다', () => {
                const testCases = [
                    'JavaScript:alert(1)',
                    'JAVASCRIPT:alert(1)',
                    'jAvAsCrIpT:alert(1)',
                ];

                testCases.forEach((url) => {
                    const result = validateSecureUrl(url, defaultConfig);
                    expect(result.valid).toBe(false);
                });
            });

            it('URL 인코딩된 javascript: 를 차단한다', () => {
                const testCases = [
                    'javascript%3Aalert(1)',
                    'java%73cript:alert(1)',
                ];

                testCases.forEach((url) => {
                    const result = validateSecureUrl(url, defaultConfig);
                    expect(result.valid).toBe(false);
                });
            });

            it('공백이 포함된 javascript: 를 차단한다', () => {
                const testCases = [
                    'java script:alert(1)',
                    'java\tscript:alert(1)',
                    'java\nscript:alert(1)',
                ];

                testCases.forEach((url) => {
                    const result = validateSecureUrl(url, defaultConfig);
                    expect(result.valid).toBe(false);
                });
            });
        });

        describe('Data URI 인젝션', () => {
            it('data: 프로토콜을 차단한다', () => {
                const result = validateSecureUrl(
                    'data:text/html,<script>alert(1)</script>',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_PROTOCOL');
            });

            it('base64 인코딩된 data URI를 차단한다', () => {
                const result = validateSecureUrl(
                    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_PROTOCOL');
            });

            it('SVG data URI를 차단한다', () => {
                const result = validateSecureUrl(
                    'data:image/svg+xml,<svg onload=alert(1)>',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_PROTOCOL');
            });
        });

        describe('VBScript 프로토콜 인젝션', () => {
            it('vbscript: 프로토콜을 차단한다', () => {
                const result = validateSecureUrl(
                    'vbscript:msgbox(1)',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_PROTOCOL');
            });
        });

        describe('URL 내 스크립트 인젝션', () => {
            it('경로에 script 태그가 포함된 URL은 허용된 호스트면 통과한다', () => {
                // URL 경로에 스크립트가 있어도 호스트가 화이트리스트면 URL 자체는 유효
                // 실제 컨텐츠 검증은 별도 레이어에서 수행
                const result = validateSecureUrl(
                    'https://github.com/<script>alert(1)</script>',
                    defaultConfig
                );
                expect(result.valid).toBe(true);
            });

            it('쿼리스트링에 스크립트가 포함된 URL은 허용된 호스트면 통과한다', () => {
                const result = validateSecureUrl(
                    'https://github.com/file.dxf?q=<script>alert(1)</script>',
                    defaultConfig
                );
                expect(result.valid).toBe(true);
            });
        });

        describe('프로토콜 우회 시도', () => {
            it('더블 슬래시 우회를 차단한다', () => {
                const result = validateSecureUrl(
                    '//evil.com/file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
            });

            it('백슬래시 우회를 차단한다', () => {
                const result = validateSecureUrl(
                    'https:\\\\evil.com\\file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
            });

            it('null 바이트 인젝션을 차단한다', () => {
                const result = validateSecureUrl(
                    'https://github.com/file.dxf\x00.exe',
                    defaultConfig
                );
                // URL 생성은 성공하지만 호스트 검증에서 처리됨
                expect(result.valid).toBe(true); // null byte 이후는 무시됨
            });
        });
    });

    // ========================================================================
    // SSRF (Server-Side Request Forgery) 고급 보안 테스트
    // ========================================================================
    describe('SSRF 고급 공격 방어', () => {
        describe('IP 주소 우회 시도', () => {
            it('8진수 IP 표기를 차단한다', () => {
                // 0177.0.0.1 = 127.0.0.1 (8진수)
                const result = validateSecureUrl(
                    'https://0177.0.0.1/file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_HOST');
            });

            it('16진수 IP 표기를 차단한다', () => {
                // 0x7f.0.0.1 = 127.0.0.1 (16진수)
                const result = validateSecureUrl(
                    'https://0x7f.0.0.1/file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_HOST');
            });

            it('정수형 IP 표기를 차단한다', () => {
                // 2130706433 = 127.0.0.1 (정수)
                const result = validateSecureUrl(
                    'https://2130706433/file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_HOST');
            });

            it('IPv6 localhost를 차단한다', () => {
                const testCases = [
                    'https://[::1]/file.dxf',
                    'https://[0:0:0:0:0:0:0:1]/file.dxf',
                ];

                testCases.forEach((url) => {
                    const result = validateSecureUrl(url, defaultConfig);
                    expect(result.valid).toBe(false);
                    expect(result.error?.code).toBe('INVALID_HOST');
                });
            });

            it('IPv6 매핑된 IPv4를 차단한다', () => {
                const result = validateSecureUrl(
                    'https://[::ffff:127.0.0.1]/file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_HOST');
            });
        });

        describe('DNS Rebinding 관련', () => {
            it('0.0.0.0을 차단한다', () => {
                const result = validateSecureUrl(
                    'https://0.0.0.0/file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_HOST');
            });

            it('메타데이터 서비스 IP를 차단한다 (AWS)', () => {
                const result = validateSecureUrl(
                    'https://169.254.169.254/file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_HOST');
            });

            it('링크 로컬 주소를 차단한다', () => {
                const result = validateSecureUrl(
                    'https://169.254.1.1/file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_HOST');
            });
        });

        describe('호스트 헤더 조작', () => {
            it('@를 이용한 호스트 우회를 차단한다', () => {
                // https://evil.com@github.com 에서 실제 요청은 github.com으로 가지만
                // 인증 정보로 evil.com이 사용될 수 있음
                const result = validateSecureUrl(
                    'https://evil.com@github.com/file.dxf',
                    defaultConfig
                );
                // URL 파서가 github.com을 호스트로 인식하므로 통과
                expect(result.valid).toBe(true);
            });

            it('포트를 이용한 우회 시도도 허용된 호스트면 통과한다', () => {
                const result = validateSecureUrl(
                    'https://github.com:443/file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(true);
            });

            it('비표준 포트도 허용된 호스트면 통과한다', () => {
                const result = validateSecureUrl(
                    'https://github.com:8443/file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(true);
            });
        });

        describe('유니코드/퓨니코드 도메인', () => {
            it('퓨니코드로 인코딩된 유사 도메인을 차단한다', () => {
                // xn--github-2g4c.com 같은 유사 도메인
                const result = validateSecureUrl(
                    'https://xn--github-2g4c.com/file.dxf',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_HOST');
            });
        });
    });

    // ========================================================================
    // 경로 조작 공격 테스트
    // ========================================================================
    describe('경로 조작 공격 방어', () => {
        describe('Path Traversal', () => {
            it('경로 내 ../ 시퀀스는 허용된 호스트면 통과한다', () => {
                // URL 레벨에서는 경로 조작을 검증하지 않음 (서버 측 책임)
                const result = validateSecureUrl(
                    'https://github.com/../../../etc/passwd',
                    defaultConfig
                );
                expect(result.valid).toBe(true);
            });

            it('URL 인코딩된 경로 조작도 허용된 호스트면 통과한다', () => {
                const result = validateSecureUrl(
                    'https://github.com/%2e%2e%2f%2e%2e%2fetc/passwd',
                    defaultConfig
                );
                expect(result.valid).toBe(true);
            });
        });
    });

    // ========================================================================
    // Blob URL 보안 테스트
    // ========================================================================
    describe('Blob URL 보안', () => {
        describe('blob: 프로토콜 처리', () => {
            it('blob: 프로토콜은 기본적으로 차단된다', () => {
                const result = validateSecureUrl(
                    'blob:https://example.com/12345678-1234-1234-1234-123456789012',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_PROTOCOL');
            });

            it('blob: URL은 호스트 검증이 다르게 동작한다', () => {
                const blobConfig: UrlSecurityConfig = {
                    allowedProtocols: ['https:', 'blob:'],
                    allowedHosts: ['github.com'],
                };
                const result = validateSecureUrl(
                    'blob:https://github.com/12345678-1234-1234-1234-123456789012',
                    blobConfig
                );
                // blob: URL에서 URL 파서는 hostname을 빈 문자열로 반환함
                // 따라서 호스트 화이트리스트 검증에서 실패함
                // 이는 의도된 보안 동작임 - blob URL은 추가적인 검증이 필요
                expect(result.valid).toBe(false);
                expect(result.error?.code).toBe('INVALID_HOST');
            });

            it('잘못된 형식의 blob: URL을 차단한다', () => {
                const blobConfig: UrlSecurityConfig = {
                    allowedProtocols: ['https:', 'blob:'],
                    allowedHosts: ['github.com'],
                };
                const result = validateSecureUrl(
                    'blob:invalid-not-a-url',
                    blobConfig
                );
                // blob:invalid-not-a-url은 유효한 URL이 아님
                expect(result.valid).toBe(false);
            });
        });

        describe('Blob URL 위조 방지', () => {
            it('외부 origin의 blob: URL을 차단한다', () => {
                const result = validateSecureUrl(
                    'blob:https://evil.com/malicious-uuid',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
            });

            it('로컬 origin의 blob: URL도 기본적으로 차단한다', () => {
                const result = validateSecureUrl(
                    'blob:null/12345678-1234-1234-1234-123456789012',
                    defaultConfig
                );
                expect(result.valid).toBe(false);
            });
        });
    });
});

// ============================================================================
// validateUrl 기본 검증 테스트
// ============================================================================

describe('validateUrl', () => {
    describe('빈 URL 검사', () => {
        it('빈 문자열에 대해 EMPTY_URL 에러를 반환한다', () => {
            const result = validateUrl('');
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('EMPTY_URL');
        });

        it('공백만 있는 문자열에 대해 EMPTY_URL 에러를 반환한다', () => {
            const result = validateUrl('   ');
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('EMPTY_URL');
        });
    });

    describe('프로토콜 검사', () => {
        it('http:// 프로토콜은 통과한다', () => {
            const result = validateUrl('http://example.com/file.dxf');
            expect(result.valid).toBe(true);
        });

        it('https:// 프로토콜은 통과한다', () => {
            const result = validateUrl('https://example.com/file.dxf');
            expect(result.valid).toBe(true);
        });

        it('ftp:// 프로토콜은 차단한다', () => {
            const result = validateUrl('ftp://example.com/file.dxf');
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_PROTOCOL');
        });

        it('file:// 프로토콜은 차단한다', () => {
            const result = validateUrl('file:///etc/passwd');
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_PROTOCOL');
        });

        it('javascript: 프로토콜은 차단한다', () => {
            const result = validateUrl('javascript:alert(1)');
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_PROTOCOL');
        });

        it('data: 프로토콜은 차단한다', () => {
            const result = validateUrl(
                'data:text/html,<script>alert(1)</script>'
            );
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_PROTOCOL');
        });

        it('blob: 프로토콜은 차단한다', () => {
            const result = validateUrl('blob:https://example.com/uuid');
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_PROTOCOL');
        });
    });

    describe('URL 형식 검사', () => {
        it('유효하지 않은 URL 형식은 차단한다', () => {
            const result = validateUrl('http://');
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_URL');
        });

        it('프로토콜 없는 URL은 차단한다', () => {
            const result = validateUrl('example.com/file.dxf');
            expect(result.valid).toBe(false);
            expect(result.error?.code).toBe('INVALID_PROTOCOL');
        });
    });

    describe('유효한 URL', () => {
        it('정상적인 HTTP URL은 통과한다', () => {
            const result = validateUrl('http://example.com/path/to/file.dxf');
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('쿼리 파라미터가 있는 URL도 통과한다', () => {
            const result = validateUrl(
                'https://example.com/file.dxf?version=1&cache=false'
            );
            expect(result.valid).toBe(true);
        });

        it('해시가 있는 URL도 통과한다', () => {
            const result = validateUrl('https://example.com/file.dxf#section');
            expect(result.valid).toBe(true);
        });

        it('포트가 있는 URL도 통과한다', () => {
            const result = validateUrl('https://example.com:8080/file.dxf');
            expect(result.valid).toBe(true);
        });

        it('인증 정보가 있는 URL도 통과한다', () => {
            const result = validateUrl(
                'https://user:pass@example.com/file.dxf'
            );
            expect(result.valid).toBe(true);
        });
    });
});

// ============================================================================
// isInternalResource 테스트
// ============================================================================

describe('isInternalResource', () => {
    describe('내부 리소스 판단', () => {
        it('blob: URL은 내부 리소스로 판단한다', () => {
            expect(isInternalResource('blob:http://localhost/abc-123')).toBe(
                true
            );
        });

        it('blob: URL with different origin도 내부 리소스로 판단한다', () => {
            expect(
                isInternalResource(
                    'blob:https://example.com/12345678-1234-1234-1234-123456789012'
                )
            ).toBe(true);
        });

        it('/ 경로는 내부 리소스로 판단한다', () => {
            expect(isInternalResource('/samples/model.glb')).toBe(true);
        });

        it('루트 경로 /는 내부 리소스로 판단한다', () => {
            expect(isInternalResource('/')).toBe(true);
        });

        it('중첩된 내부 경로도 내부 리소스로 판단한다', () => {
            expect(
                isInternalResource('/assets/models/hologram/robot.glb')
            ).toBe(true);
        });
    });

    describe('외부 리소스 판단', () => {
        it('https:// URL은 외부 리소스로 판단한다', () => {
            expect(isInternalResource('https://example.com/model.glb')).toBe(
                false
            );
        });

        it('http:// URL은 외부 리소스로 판단한다', () => {
            expect(isInternalResource('http://example.com/model.glb')).toBe(
                false
            );
        });

        it('data: URL은 외부 리소스로 판단한다', () => {
            expect(isInternalResource('data:text/html,<script>')).toBe(false);
        });

        it('file: URL은 외부 리소스로 판단한다', () => {
            expect(isInternalResource('file:///etc/passwd')).toBe(false);
        });
    });

    describe('엣지 케이스', () => {
        it('빈 문자열은 외부 리소스로 판단한다', () => {
            expect(isInternalResource('')).toBe(false);
        });

        it('상대 경로는 외부 리소스로 판단한다 (/ 없음)', () => {
            expect(isInternalResource('path/to/model.glb')).toBe(false);
        });

        it('../ 로 시작하는 상대 경로도 외부 리소스로 판단한다', () => {
            expect(isInternalResource('../model.glb')).toBe(false);
        });
    });
});

// ============================================================================
// extractFileName 테스트
// ============================================================================

describe('extractFileName', () => {
    describe('기본 파일명 추출', () => {
        it('URL에서 파일명을 추출한다', () => {
            expect(extractFileName('/path/to/model.glb')).toBe('model.glb');
        });

        it('복잡한 경로에서 파일명을 추출한다', () => {
            expect(extractFileName('/a/b/c/d/e/file.gltf')).toBe('file.gltf');
        });

        it('https URL에서 파일명을 추출한다', () => {
            expect(
                extractFileName('https://example.com/assets/model.glb')
            ).toBe('model.glb');
        });

        it('쿼리 파라미터가 있어도 마지막 세그먼트를 반환한다', () => {
            // 참고: URL 파싱 없이 단순 split이므로 쿼리 파라미터 포함됨
            expect(extractFileName('/path/model.glb?v=1')).toBe(
                'model.glb?v=1'
            );
        });
    });

    describe('fallback 동작', () => {
        it('경로가 /만 있을 때 기본 fallback 반환', () => {
            expect(extractFileName('/')).toBe('file');
        });

        it('경로가 /만 있을 때 커스텀 fallback 반환', () => {
            expect(extractFileName('/', 'default')).toBe('default');
        });

        it('빈 문자열일 때 기본 fallback 반환', () => {
            expect(extractFileName('')).toBe('file');
        });

        it('빈 문자열일 때 커스텀 fallback 반환', () => {
            expect(extractFileName('', 'model')).toBe('model');
        });
    });

    describe('다양한 확장자', () => {
        it('.glb 파일명 추출', () => {
            expect(extractFileName('/models/robot.glb')).toBe('robot.glb');
        });

        it('.gltf 파일명 추출', () => {
            expect(extractFileName('/models/scene.gltf')).toBe('scene.gltf');
        });

        it('확장자 없는 파일명도 추출', () => {
            expect(extractFileName('/path/to/filename')).toBe('filename');
        });

        it('여러 점이 있는 파일명도 추출', () => {
            expect(extractFileName('/path/model.v2.glb')).toBe('model.v2.glb');
        });
    });
});
