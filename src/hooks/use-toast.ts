import { useState, useCallback } from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback(({ title, description, variant }: ToastProps) => {
    setToasts((prev) => [...prev, { title, description, variant }]);
    // console.log(`[Toast ${variant || "default"}]: ${title} - ${description}`);
  }, []);

  return { toast, toasts };
}
