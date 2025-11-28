import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './routes/root';

function App() {

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                gcTime: 1000 * 60 * 10,           // 캐시된 데이터가 메모리에 유지되는 시간 (10분)
                refetchOnWindowFocus: false,      // 윈도우 포커스 시 재요청 방지
            }
        }
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

export default App
