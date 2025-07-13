import { toast } from 'sonner';

interface ToastOptions {
  id?: string;
}

export const useToast = () => {
  const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, options);
  };
  const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, options);
  };
  const showInfo = (message: string, options?: ToastOptions) => {
    toast.info(message, options);
  };

  return { showSuccess, showError, showInfo };
};
