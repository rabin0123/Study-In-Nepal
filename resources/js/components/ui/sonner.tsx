import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { resolvedAppearance } = useAppearance();

    useFlashToast();

    const isDark = resolvedAppearance === 'dark';

    return (
        <Sonner
            theme={resolvedAppearance}
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
                classNames: {
                    toast: 'bootstrap-toast',
                },
            }}
            style={
                {
                    '--normal-bg': isDark ? '#1e2129' : '#ffffff',
                    '--normal-text': isDark ? '#e9ecef' : '#212529',
                    '--normal-border': isDark ? '#343a40' : '#dee2e6',

                    '--success-bg': isDark ? '#0f2e1c' : '#e9f8ee',
                    '--success-text': isDark ? '#4ade80' : '#146c2e',
                    '--success-border': isDark ? '#1d5334' : '#a6e9bd',

                    '--error-bg': isDark ? '#3a1418' : '#fdeeee',
                    '--error-text': isDark ? '#f87171' : '#b02a30',
                    '--error-border': isDark ? '#5c2126' : '#f3c2c5',

                    '--warning-bg': isDark ? '#3a2e0f' : '#fff8e6',
                    '--warning-text': isDark ? '#fbbf24' : '#a35c00',
                    '--warning-border': isDark ? '#5c4a1d' : '#f5deac',

                    '--info-bg': isDark ? '#0f2733' : '#e8f6fc',
                    '--info-text': isDark ? '#38bdf8' : '#055160',
                    '--info-border': isDark ? '#1d4759' : '#b6effb',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };