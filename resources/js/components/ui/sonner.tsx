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
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--bs-body-bg)',
                    '--normal-text': 'var(--bs-body-color)',
                    '--normal-border': 'var(--bs-border-color)',
                    '--success-bg': 'var(--bs-success-bg-subtle)',
                    '--success-text': 'var(--bs-success-text-emphasis)',
                    '--success-border': 'var(--bs-success-border-subtle)',
                    '--error-bg': 'var(--bs-danger-bg-subtle)',
                    '--error-text': 'var(--bs-danger-text-emphasis)',
                    '--error-border': 'var(--bs-danger-border-subtle)',
                    '--warning-bg': 'var(--bs-warning-bg-subtle)',
                    '--warning-text': 'var(--bs-warning-text-emphasis)',
                    '--warning-border': 'var(--bs-warning-border-subtle)',
                    '--info-bg': 'var(--bs-info-bg-subtle)',
                    '--info-text': 'var(--bs-info-text-emphasis)',
                    '--info-border': 'var(--bs-info-border-subtle)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };