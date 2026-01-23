import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  description?: string;
  duration?: number;
}

interface Toast {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  promise: typeof sonnerToast.promise;
}

export function useToast(): Toast {
  return {
    success: (message, options) => {
      sonnerToast.success(message, options);
    },
    error: (message, options) => {
      sonnerToast.error(message, options);
    },
    info: (message, options) => {
      sonnerToast.info(message, options);
    },
    warning: (message, options) => {
      sonnerToast.warning(message, options);
    },
    promise: sonnerToast.promise,
  };
}
