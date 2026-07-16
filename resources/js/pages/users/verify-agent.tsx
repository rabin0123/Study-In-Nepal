import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';

const PRIMARY = "#0ea5e9";

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
    onClose?: () => void;
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

export default function VerifyAgent({ pendingUser, onClose }: Props) {
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

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            router.visit('/users');
        }
    };

    return (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(0, 0, 0, 0.6)", fontFamily: "'Rajdhani', sans-serif" }}>
            <Head title="Verify New Agent" />

            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@400;500;600;700&display=swap');
                    
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin {
                        display: inline-block;
                        animation: spin 1s linear infinite;
                    }
                `}
            </style>

            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '32rem' }}>
                <div 
                    className="modal-content overflow-hidden border-0 position-relative" 
                    style={{ 
                        backgroundColor: "var(--surface-card, #ffffff)", 
                        boxShadow: "var(--shadow-card, 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1))" 
                    }}
                >
                    {/* Decorative Top Accent Line */}
                    <div style={{ height: '6px', background: 'linear-gradient(to right, #0ea5e9, #fbbf24)' }} />

                    {/* Close (X) Button */}
                    <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 10 }}>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={handleClose} 
                            aria-label="Close"
                        />
                    </div>

                    <div className="modal-body p-4 p-md-5">
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="p-2 rounded-3 d-flex align-items-center justify-content-center bg-warning-subtle text-warning">
                                <iconify-icon icon="lucide:shield-question" style={{ fontSize: '1.35rem' }}></iconify-icon>
                            </div>
                            <div>
                                <h1 className="m-0 text-uppercase fw-semibold" style={{ fontFamily: "'Castoro Titling', serif", fontSize: '1.15rem', color: "var(--text-strong, #1f2937)", letterSpacing: '0.05em' }}>
                                    Verify New Agent
                                </h1>
                                <p className="small m-0" style={{ color: "var(--text-faint, #6b7280)", fontWeight: 500 }}>
                                    Confirm this registration to grant login access.
                                </p>
                            </div>
                        </div>

                        {!done ? (
                            <>
                                <div className="p-4 border rounded-3 mb-4" style={{ backgroundColor: "var(--surface-bg, #f8f9fa)", borderColor: "var(--border-color-soft, #e5e7eb)" }}>
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <span className="fs-5 fw-bold" style={{ color: "var(--text-strong, #1f2937)" }}>{pendingUser.name}</span>
                                        <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1 text-uppercase px-2.5 py-1.5" style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                                            <iconify-icon icon="lucide:clock" style={{ fontSize: '0.8rem' }}></iconify-icon> Pending
                                        </span>
                                    </div>

                                    <div className="d-flex align-items-center gap-3 small fw-semibold mb-2" style={{ color: "var(--text-muted, #4b5563)" }}>
                                        <iconify-icon icon="lucide:building" style={{ color: "var(--text-faint, #9ca3af)", fontSize: '1.1rem' }}></iconify-icon>
                                        {pendingUser.agency_name}
                                    </div>
                                    <div className="d-flex align-items-center gap-3 small fw-semibold mb-2" style={{ color: "var(--text-muted, #4b5563)" }}>
                                        <iconify-icon icon="lucide:mail" style={{ color: "var(--text-faint, #9ca3af)", fontSize: '1.1rem' }}></iconify-icon>
                                        {pendingUser.email}
                                    </div>
                                    <div className="d-flex align-items-center gap-3 small fw-semibold mb-2" style={{ color: "var(--text-muted, #4b5563)" }}>
                                        <iconify-icon icon="lucide:phone" style={{ color: "var(--text-faint, #9ca3af)", fontSize: '1.1rem' }}></iconify-icon>
                                        {pendingUser.contact_number}
                                    </div>
                                    <div className="d-flex align-items-center gap-3 small fw-semibold mb-3" style={{ color: "var(--text-muted, #4b5563)" }}>
                                        <iconify-icon icon="lucide:map-pin" style={{ color: "var(--text-faint, #9ca3af)", fontSize: '1.1rem' }}></iconify-icon>
                                        {pendingUser.country}
                                    </div>

                                    <p className="m-0 pt-2 border-top" style={{ fontSize: '0.72rem', color: "var(--text-faint, #6b7280)", fontWeight: 500, borderColor: "var(--border-color-soft, #e5e7eb)" }}>
                                        Registered on {formatDate(pendingUser.created_at)}
                                    </p>
                                </div>

                                <p className="small mb-4" style={{ color: "var(--text-muted, #4b5563)", fontWeight: 500, lineHeight: 1.5 }}>
                                    This person cannot log in until you approve them. Only confirm if you recognize this registration as legitimate for your agency.
                                </p>

                                <button
                                    type="button"
                                    onClick={handleVerify}
                                    disabled={verifying}
                                    className="btn w-100 d-inline-flex align-items-center justify-content-center gap-2 py-3 rounded-3 text-uppercase border-0 text-white"
                                    style={{
                                        background: verifying ? 'var(--text-faint, #9ca3af)' : PRIMARY,
                                        fontFamily: "'Rajdhani', sans-serif",
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.08em',
                                        cursor: verifying ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {verifying ? (
                                        <iconify-icon icon="lucide:loader-2" className="animate-spin" style={{ fontSize: '1.1rem' }}></iconify-icon>
                                    ) : (
                                        <iconify-icon icon="lucide:user-check" style={{ fontSize: '1.1rem' }}></iconify-icon>
                                    )}
                                    {verifying ? 'Verifying...' : 'Confirm & Verify'}
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="mx-auto mb-3 rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: '3.5rem', height: '3.5rem' }}>
                                    <iconify-icon icon="lucide:user-check" style={{ fontSize: '1.75rem' }}></iconify-icon>
                                </div>
                                <p className="fs-5 fw-bold mb-1" style={{ color: "var(--text-strong, #1f2937)" }}>
                                    {pendingUser.name} is verified
                                </p>
                                <p className="small mb-4" style={{ color: "var(--text-faint, #6b7280)", fontWeight: 500 }}>
                                    They can now log in to the portal.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="btn btn-link text-decoration-none d-inline-flex align-items-center gap-2 fw-bold text-uppercase p-0 border-0"
                                    style={{
                                        color: PRIMARY,
                                        fontSize: '0.85rem',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Back to Users
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

VerifyAgent.layout = { title: 'Verify Agent', description: 'Verify Agent' };