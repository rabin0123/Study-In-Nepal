import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialogue';
import { createContext, useCallback, useContext, useState } from 'react';

type ConfirmOptions = {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
};

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

    const confirm = useCallback<ConfirmContextType>((opts) => {
        setOptions(opts);
        return new Promise<boolean>((resolve) => {
            setResolver(() => resolve);
        });
    }, []);

    const handleClose = (result: boolean) => {
        resolver?.(result);
        setOptions(null);
        setResolver(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            <AlertDialog open={!!options} onOpenChange={(open: boolean) => !open && handleClose(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options?.title}</AlertDialogTitle>
                        {options?.description && (
                            <AlertDialogDescription>{options.description}</AlertDialogDescription>
                        )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => handleClose(false)}>
                            {options?.cancelText ?? 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleClose(true)}
                            className={
                                options?.variant === 'destructive'
                                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                    : undefined
                            }
                        >
                            {options?.confirmText ?? 'Continue'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider');
    return ctx;
}