import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { useUIStore } from './stores/uiStore';
import { useAuthStore } from './stores/authStore';
import { cn } from './utils/cn';
import { ToastProvider } from './components/ui/Toast';

// Lazy load pages
const Login       = lazy(() => import('./pages/Login'));
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Analytics   = lazy(() => import('./pages/Analytics'));
const Orders      = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Users       = lazy(() => import('./pages/Users'));
const Prescriptions = lazy(() => import('./pages/Prescriptions'));
const Inventory   = lazy(() => import('./pages/Inventory'));
const Products    = lazy(() => import('./pages/Products'));
const Categories  = lazy(() => import('./pages/Categories'));
const Brands      = lazy(() => import('./pages/Brands'));
const Branches    = lazy(() => import('./pages/Branches'));
const Coupons     = lazy(() => import('./pages/Coupons'));
const Reviews     = lazy(() => import('./pages/Reviews'));
const ProductForm = lazy(() => import('./pages/ProductForm'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile     = lazy(() => import('./pages/Profile'));
const ChatbotSettings = lazy(() => import('./pages/settings/ChatbotSettingsPage').then(m => ({ default: m.ChatbotSettingsPage })));
const Slides      = lazy(() => import('./pages/Slides'));
const Chat = lazy(() => import('./pages/Chat'));

const Loading: React.FC = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin w-8 h-8 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="text-sm text-[var(--text-secondary)]">Đang tải...</span>
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden">
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar onClose={() => useUIStore.getState().setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[var(--bg-main)] flex flex-col">
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => useUIStore.getState().toggleSidebar()}
        />
      )}
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={
            <Suspense fallback={<div className="h-screen bg-[var(--bg-main)]" />}>
              <Login />
            </Suspense>
          } />

          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="chat" element={<Chat />} />
            <Route path="users" element={<Users />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="products" element={<Products />} />
            <Route path="products/create" element={<ProductForm />} />
            <Route path="products/:slug/edit" element={<ProductForm />} />
            <Route path="categories" element={<Categories />} />
            <Route path="brands" element={<Brands />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="branches" element={<Branches />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="slides" element={<Slides />} />
            <Route path="chatbot-settings" element={<ChatbotSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
