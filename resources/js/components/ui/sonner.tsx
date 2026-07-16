import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { resolvedAppearance } = useAppearance();

    useFlashToast();

    const isDark = resolvedAppearance === 'dark';

    return (
        <Sonner
            className="toaster group"
            position="bottom-right"
            closeButton
            icons={{
                success: <iconify-icon icon="solar:check-circle-bold-duotone" className="fs-5" />,
                error: <iconify-icon icon="solar:danger-triangle-bold-duotone" className="fs-5" />,
                warning: <iconify-icon icon="solar:danger-circle-bold-duotone" className="fs-5" />,
                info: <iconify-icon icon="solar:info-circle-bold-duotone" className="fs-5" />,
                loading: <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>,
            }}
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: 'bootstrap-toast',
                    title: 'bootstrap-toast-title',
                    description: 'bootstrap-toast-description',
                    closeButton: 'bootstrap-toast-close',
                    icon: 'bootstrap-toast-icon',
                    default: isDark ? 'bootstrap-toast-normal-dark' : 'bootstrap-toast-normal-light',
                    success: isDark ? 'bootstrap-toast-success-dark' : 'bootstrap-toast-success-light',
                    error: isDark ? 'bootstrap-toast-error-dark' : 'bootstrap-toast-error-light',
                    warning: isDark ? 'bootstrap-toast-warning-dark' : 'bootstrap-toast-warning-light',
                    info: isDark ? 'bootstrap-toast-info-dark' : 'bootstrap-toast-info-light',
                },
            }}
            {...props}
        />
    );
}

export { Toaster };