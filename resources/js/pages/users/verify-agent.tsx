import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import {
    Mail,
    Phone,
    MapPin,
    Building,
    UserCheck,
    Loader2,
    Clock,
    ShieldQuestion,
} from 'lucide-react';

const PRIMARY = "#0ea5e9";
const SUCCESS = "#059669";

type PendingUser = {
    id: number;
    name: string;
    email: string;
    agency_name: string;
    country: string;
    contact_number: string;
    created_at: string;
};

type Props = {
    pendingUser: PendingUser;
};

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return iso;
    }
}

export default function VerifyAgent({ pendingUser }: Props) {
    const [verifying, setVerifying] = useState(false);
    const [done, setDone] = useState(false);

    const handleVerify = () => {
        if (verifying || done) return;
        setVerifying(true);
        router.post(
            `/users/${pendingUser.id}/manual-verification`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setDone(true),
                onFinish: () => setVerifying(false),
            }
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 font-['Rajdhani']" style={{ background: "var(--surface-bg)" }}>
            <Head title="Verify New Agent" />

            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@400;500;600;700&display=swap');
                `}
            </style>

            <div className="w-full max-w-lg">
                <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-color-soft)] shadow-[var(--shadow-card)] overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#fbbf24]" />

                    <div className="p-8 xl:p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-500">
                                <ShieldQuestion className="h-5.5 w-5.5" />
                            </div>
                            <div>
                                <h1 className="font-['Castoro_Titling'] text-lg xl:text-xl text-[var(--text-strong)] uppercase tracking-wide">
                                    Verify New Agent
                                </h1>
                                <p className="text-xs xl:text-sm text-[var(--text-faint)] font-medium">
                                    Confirm this registration to grant login access.
                                </p>
                            </div>
                        </div>

                        {!done ? (
                            <>
                                <div className="rounded-xl border border-[var(--border-color-soft)] bg-[var(--surface-bg)] p-5 space-y-3 mb-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-[var(--text-strong)]">{pendingUser.name}</span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.68rem] font-bold tracking-wider uppercase bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900">
                                            <Clock className="h-3 w-3" /> Pending
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-muted)]">
                                        <Building className="h-4 w-4 text-[var(--text-faint)] shrink-0" />
                                        {pendingUser.agency_name}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-muted)]">
                                        <Mail className="h-4 w-4 text-[var(--text-faint)] shrink-0" />
                                        {pendingUser.email}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-muted)]">
                                        <Phone className="h-4 w-4 text-[var(--text-faint)] shrink-0" />
                                        {pendingUser.contact_number}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-muted)]">
                                        <MapPin className="h-4 w-4 text-[var(--text-faint)] shrink-0" />
                                        {pendingUser.country}
                                    </div>

                                    <p className="text-[0.72rem] text-[var(--text-faint)] font-medium pt-1">
                                        Registered on {formatDate(pendingUser.created_at)}
                                    </p>
                                </div>

                                <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed mb-6">
                                    This person cannot log in until you approve them. Only confirm if you recognize this registration as legitimate for your agency.
                                </p>

                                <button
                                    type="button"
                                    onClick={handleVerify}
                                    disabled={verifying}
                                    style={{
                                        width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        background: verifying ? 'var(--text-faint)' : SUCCESS, color: 'white', border: 'none',
                                        borderRadius: '0.75rem', padding: '0.85rem 1.5rem', fontFamily: "Rajdhani, sans-serif",
                                        fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                                        cursor: verifying ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                                    }}
                                >
                                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                                    {verifying ? 'Verifying...' : 'Confirm & Verify'}
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
                                    <UserCheck className="h-7 w-7" />
                                </div>
                                <p className="text-base font-bold text-[var(--text-strong)] mb-1">
                                    {pendingUser.name} is verified
                                </p>
                                <p className="text-sm text-[var(--text-faint)] font-medium mb-6">
                                    They can now log in to the portal.
                                </p>
                                <Link
                                    href="/users"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                        color: PRIMARY, fontWeight: 700, fontSize: '0.85rem',
                                        letterSpacing: '0.05em', textTransform: 'uppercase',
                                    }}
                                >
                                    Back to Users
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

VerifyAgent.layout = { title: 'Verify Agent', description: 'Verify Agent' };