// resources/js/lib/toast.ts
import { toast } from 'sonner';

export const notify = {
    success: (message: string, description?: string) =>
        toast.success(message, { description }),

    error: (message: string, description?: string) =>
        toast.error(message, { description }),

    info: (message: string, description?: string) =>
        toast(message, { description }),

    promise: <T,>(
        promise: Promise<T>,
        opts: { loading: string; success: string; error: string }
    ) => toast.promise(promise, opts),
};