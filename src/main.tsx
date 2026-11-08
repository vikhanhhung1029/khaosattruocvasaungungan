import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidMount() {
    document.documentElement.dataset.appBooted = 'true';
    const bootError = document.getElementById('boot-error');
    if (bootError) bootError.style.display = 'none';
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    document.documentElement.dataset.appBooted = 'true';
    console.error('Website render failed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 680, margin: '48px auto', padding: 24, color: '#0f172a' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Không thể tải nội dung website</h1>
          <p style={{ lineHeight: 1.6 }}>Ứng dụng gặp lỗi khi hiển thị. Hãy tải lại trang. Nếu lỗi tiếp tục, gửi thông tin bên dưới cho người quản lý website.</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', background: '#f1f5f9', padding: 16, borderRadius: 8, fontSize: 13 }}>{this.state.error.message}</pre>
          <button onClick={() => window.location.reload()} style={{ background: '#4f46e5', color: 'white', border: 0, borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>Tải lại trang</button>
        </main>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<main style="font-family:system-ui,sans-serif;padding:24px">Không tìm thấy vùng hiển thị ứng dụng (#root). Vui lòng kiểm tra index.html.</main>';
} else {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </React.StrictMode>
  );
}
