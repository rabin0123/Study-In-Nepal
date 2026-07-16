import { Toaster } from '@/components/ui/sonner';
import { useAppearance } from '@/hooks/use-appearance';

export function AppToaster() {
    const { resolvedAppearance } = useAppearance();

    return (
        <Toaster
            position="bottom-right"
            theme={resolvedAppearance}
            richColors
            closeButton
        />
    );
}