import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { MainLayout } from './layouts/MainLayout';

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </NotificationProvider>
  );
}
