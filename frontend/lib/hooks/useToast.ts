import { useToast as useToastFromContext } from "../toast-context";

export function useToast() {
  return useToastFromContext();
}
export type { ToastType } from "../toast-context";
