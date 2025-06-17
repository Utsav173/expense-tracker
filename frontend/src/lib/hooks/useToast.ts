import { toast } from 'react-hot-toast';

interface ToastOptions {
  id?: string;
}

export const useToast = () => {
  const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, options);
  };
  const showError = (message: string, options?: ToastOptions) => {
    toast(message, { ...options, icon: '🚨' });
  };
  const showInfo = (message: string, options?: ToastOptions) => {
    toast(message, options);
  };

  return { showSuccess, showError, showInfo };
};
