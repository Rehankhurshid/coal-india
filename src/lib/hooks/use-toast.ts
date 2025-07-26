import { useState } from "react";

interface Toast {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (toastData: Toast) => {
    // For now, just use browser alert
    // In a real app, you'd use a toast library like sonner
    if (toastData.variant === "destructive") {
      alert(`Error: ${toastData.description || toastData.title}`);
    } else {
      alert(toastData.description || toastData.title);
    }
  };

  return { toast };
}
