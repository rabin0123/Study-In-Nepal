import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { resolvedAppearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={resolvedAppearance}
            className="toaster group"
            position="bottom-right"
            closeButton
            icons={{
                success: <iconify-icon icon="solar:check-circle-bold-duotone" className="fs-5 text-success" />,
                error: <iconify-icon icon="solar:danger-triangle-bold-duotone" className="fs-5 text-danger" />,
                warning: <iconify-icon icon="solar:danger-circle-bold-duotone" className="fs-5 text-warning" />,
                info: <iconify-icon icon="solar:info-circle-bold-duotone" className="fs-5 text-info" />,
                loading: <span className="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true"></span>,
            }}
            toastOptions={{
                classNames: {
                    toast: 'bootstrap-toast',
                    closeButton: 'bootstrap-toast-close',
                    title: 'bootstrap-toast-title',
                    description: 'bootstrap-toast-description',
                    icon: 'bootstrap-toast-icon',
                },
            }}
            {...props}
        />
    );
}

export { Toaster };