/**
 * Test Utilities
 * 테스트에서 공통으로 사용하는 유틸리티 및 커스텀 render 함수
 */

/* eslint-disable react-refresh/only-export-components */

import type { ReactElement, ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * 테스트용 QueryClient 생성
 * - retry: false로 설정하여 테스트 속도 향상
 * - 매 테스트마다 새 인스턴스 생성하여 상태 격리
 */
const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });

interface AllTheProvidersProps {
    children: ReactNode;
}

/**
 * 모든 Provider를 감싸는 Wrapper 컴포넌트
 * - QueryClientProvider: TanStack Query 상태 관리
 * - BrowserRouter: React Router 라우팅
 */
const AllTheProviders = ({ children }: AllTheProvidersProps) => {
    const queryClient = createTestQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
    );
};

/**
 * Provider가 포함된 커스텀 render 함수
 * 기본 render 대신 이 함수를 사용하면 모든 Provider가 자동으로 적용됨
 *
 * @example
 * ```tsx
 * import { render, screen } from '@tests/setup/test-utils';
 *
 * it('renders component', () => {
 *     render(<MyComponent />);
 *     expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// @testing-library/react의 모든 export를 re-export
export * from '@testing-library/react';

// 기본 render를 customRender로 대체
export { customRender as render };

// 테스트용 유틸리티 함수들

/**
 * 테스트용 File 객체 생성
 * @param name 파일 이름
 * @param content 파일 내용 (기본값: 빈 문자열)
 * @param type MIME 타입 (기본값: '')
 */
export function createTestFile(
    name: string,
    content: string | ArrayBuffer = '',
    type: string = ''
): File {
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
}

/**
 * 테스트용 DXF File 객체 생성
 * @param name 파일 이름 (기본값: 'test.dxf')
 * @param sizeInBytes 파일 크기 (바이트)
 */
export function createTestDXFFile(
    name: string = 'test.dxf',
    sizeInBytes?: number
): File {
    const content = sizeInBytes
        ? new ArrayBuffer(sizeInBytes)
        : 'DXF mock content';
    return createTestFile(name, content, 'application/dxf');
}
