import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './lib/ThemeProvider';
import { NotificationProvider } from './lib/NotificationProvider';
import { AuthProvider } from './lib/AuthProvider';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
