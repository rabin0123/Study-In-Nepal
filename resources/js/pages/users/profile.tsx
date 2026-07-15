import { useState, useRef, useEffect } from 'react';
import { Form, Head, router } from '@inertiajs/react';
import Avatar from '@/components/avatar';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Label } from '@/components/ui/label';

const PRIMARY = "#0ea5e9";
const DANGER = "#dc2626";

type ProfileUser = {
    id: number;
    agency_name: string;
    name: string;
    role?: string;
    country: string;
    contact_number: string;
    email: string;
    email_verified_at: string | null;
    is_manually_verified?: boolean;
    can_verify_users?: boolean;
    avatar_url?: string;
};

type Props = {
    user: ProfileUser;
    status?: string;
    canEdit: boolean;
    isSelf: boolean;
    canVerify?: boolean;
    isSuperAdmin?: boolean;
};

type EditableFieldProps = {
    icon: string;
    label: string;
    value: string;
    fieldName: 'name' | 'email' | 'contact_number';
    type?: string;
    editable: boolean;
    onRequestSave: (field: EditableFieldProps['fieldName'], value: string) => void;
};

const ROLE_LABELS: Record<string, string> = {
    developer: 'Developer',
    'main-agent': 'Main Agent',
    main_agent: 'Main Agent',
    'main-agent-staff': 'Main Agent Staff',
    main_agent_staff: 'Main Agent Staff',
    'b2b-partner': 'B2B Partner',
    b2b_partner: 'B2B Partner',
    'b2b-partner-staff': 'B2B Partner Staff',
    b2b_partner_staff: 'B2B Partner Staff',
};

function roleLabel(role?: string): string {
    if (!role) return 'User Account';
    return ROLE_LABELS[role] ?? role;
}

function isVerifierEligibleRole(role?: string): boolean {
    return role === 'main-agent' || role === 'main_agent'
        || role === 'main-agent-staff' || role === 'main_agent_staff';
}

function LocalSpinner({ className = "" }: { className?: string }) {
    return (
        <span
            className={`spinner-border spinner-border-sm ${className}`}
            role="status"
            aria-hidden="true"
        ></span>
    );
}

/* Shared card shell, mirroring the helper in StudentApplicationDetail.tsx */
function Card({
    children,
    className = "",
    bodyClassName = "",
    style,
}: {
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div className={`card ${className}`} style={style}>
            <div className={`card-body ${bodyClassName}`}>{children}</div>
        </div>
    );
}

/* Section heading component directly matching StudentApplicationDetail.tsx */
function SectionHeading({ icon, children, action }: { icon?: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="d-flex align-items-center justify-content-between pb-4 mb-1 border-bottom">
            <h6 className="sad-value fs-4 fw-semibold mb-0 d-flex align-items-center gap-3">
                {icon && (
                    <span
                        className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 shrink-0"
                        style={{ width: 36, height: 36, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}
                    >
                        <iconify-icon icon={icon} className="text-primary"></iconify-icon>
                    </span>
                )}
                <span>{children}</span>
            </h6>
            {action}
        </div>
    );
}

function EditableField({ icon, label, value, fieldName, type = 'text', editable, onRequestSave }: EditableFieldProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => setDraft(value), [value]);
    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    const commit = () => {
        setEditing(false);
        const trimmed = draft.trim();
        if (trimmed !== '' && trimmed !== value) {
            onRequestSave(fieldName, trimmed);
        } else {
            setDraft(value);
        }
    };

    const cancel = () => {
        setDraft(value);
        setEditing(false);
    };

    return (
        <div
            onDoubleClick={() => editable && setEditing(true)}
            className={`sad-field-row py-4 border-bottom d-flex gap-4 align-items-start ${editable ? 'cursor-pointer' : ''}`}
        >
            <span
                className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 shrink-0"
                style={{ width: 40, height: 40, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}
            >
                <iconify-icon icon={icon} className="text-primary"></iconify-icon>
            </span>

            <div className="grow min-w-0">
                <span className="sad-label fs-2 fw-semibold text-uppercase text-body-secondary d-block mb-2">
                    {label}
                </span>

                {editing ? (
                    <div className="mt-1" onDoubleClick={(e) => e.stopPropagation()}>
                        <input
                            ref={inputRef}
                            type={type}
                            className="form-control form-control-sm"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={commit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') commit();
                                if (e.key === 'Escape') cancel();
                            }}
                        />
                    </div>
                ) : (
                    <p className="sad-value fs-3 fw-semibold mb-0 d-flex align-items-center gap-2">
                        {value || <span className="text-body-secondary fw-normal fst-italic">Double-click to set</span>}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function Profile({ user, status, canEdit, isSelf, canVerify = false, isSuperAdmin = false }: Props) {
    const [localUser, setLocalUser] = useState(user);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Pending field change awaiting password confirmation
    const [pendingChange, setPendingChange] = useState<{ field: string; value: string } | null>(null);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);

    const [verifying, setVerifying] = useState(false);
    const [verifierToggling, setVerifierToggling] = useState(false);

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const verified = !!localUser.email_verified_at;
    const manuallyVerified = !!localUser.is_manually_verified;

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => {
            setToastMessage(null);
        }, 3500);
    };

    const requestSave = (field: string, value: string) => {
        setConfirmPassword('');
        setConfirmError(null);
        setPendingChange({ field, value });
    };

    const closeModal = () => {
        setPendingChange(null);
        setConfirmPassword('');
        setConfirmError(null);
    };

    const submitChange = () => {
        if (!pendingChange) return;
        if (!confirmPassword) {
            setConfirmError('Password is required to confirm this change.');
            return;
        }

        setConfirming(true);
        router.put(
            `/users/${localUser.id}/profile-field`,
            { field: pendingChange.field, value: pendingChange.value, password: confirmPassword },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLocalUser((prev) => ({ ...prev, [pendingChange.field]: pendingChange.value }));
                    setConfirming(false);
                    closeModal();
                    showToast(`${pendingChange.field.replace('_', ' ')} updated.`);
                },
                onFinish: () => {
                    setConfirming(false);
                },
                onError: (errors) => {
                    setConfirming(false);
                    setConfirmError(errors.password ?? 'Something went wrong. Please try again.');
                },
            }
        );
    };

    const handleVerifyNow = () => {
        if (verifying || manuallyVerified) return;
        setVerifying(true);
        router.post(
            `/users/${localUser.id}/verify-inline`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLocalUser((prev) => ({ ...prev, is_manually_verified: true }));
                    showToast('Agency manually verified.');
                },
                onFinish: () => setVerifying(false),
            }
        );
    };

    const handleToggleVerifierAccess = () => {
        if (verifierToggling) return;
        setVerifierToggling(true);
        router.put(
            `/users/${localUser.id}/verifier-access`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLocalUser((prev) => ({ ...prev, can_verify_users: !prev.can_verify_users }));
                    showToast('Verifier access settings toggled.');
                },
                onFinish: () => setVerifierToggling(false),
            }
        );
    };

    return (
        <div className="profile-page-scope min-vh-100 font-['Rajdhani']" style={{ background: "var(--surface-bg)" }}>
            <Head title={isSelf ? 'My Profile' : `${localUser.name} - Profile`} />

            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@400;500;600;700&display=swap');

                    .profile-page-scope .sad-value {
                        color: #1e2633 !important;
                    }
                    .profile-page-scope .sad-label {
                        letter-spacing: 0.06em;
                    }
                    .profile-page-scope .sad-field-row:last-child {
                        border-bottom: none !important;
                        padding-bottom: 0 !important;
                    }
                    .profile-page-scope .sad-field-row:first-child {
                        padding-top: 0 !important;
                    }
                    .profile-page-scope .sad-icon-chip iconify-icon {
                        font-size: 18px;
                    }

                    /* Scoped input styles for general input text and nested password text boxes */
                    .profile-page-scope .survey-input,
                    .profile-page-scope .relative input {
                        width: 100% !important;
                        border: 1.5px solid var(--border-color, #dee2e6) !important;
                        border-radius: 0.75rem !important;
                        padding: 0.65rem 1rem !important;
                        padding-right: 45px !important; /* Keep space for eye toggle button */
                        font-family: 'Rajdhani', sans-serif !important;
                        font-size: 0.95rem !important;
                        font-weight: 600 !important;
                        color: var(--text-strong) !important;
                        background: var(--surface-card, #fff) !important;
                        outline: none !important;
                        transition: all 0.2s ease !important;
                        height: auto !important;
                    }

                    /* Unified focus border outline ring settings */
                    .profile-page-scope .survey-input:focus,
                    .profile-page-scope .relative input:focus {
                        border-color: ${PRIMARY} !important;
                        box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.08) !important;
                    }

                    .profile-page-scope .survey-label {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-family: 'Rajdhani', sans-serif !important;
                        font-weight: 700 !important;
                        font-size: 0.8rem !important;
                        letter-spacing: 0.08em !important;
                        text-transform: uppercase;
                        color: var(--text-muted);
                        margin-bottom: 0.45rem;
                    }
                    .profile-page-scope .section-divider {
                        border-top: 1px solid var(--border-color-soft);
                        margin: 2.5rem 0;
                    }

                    /* ── FALLBACK ALIGNMENT FOR PASSWORDINPUT WITHIN PROFILE CONTENT ONLY ── */
                    .profile-page-scope .relative {
                        position: relative !important;
                        width: 100%;
                    }

                    .profile-page-scope .absolute {
                        position: absolute !important;
                    }

                    /* Absolute positioning alignment for the password toggle eye button within profile scope */
                    .profile-page-scope .relative button {
                        position: absolute !important;
                        right: 4px !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                        background: transparent !important;
                        border: none !important;
                        height: 100% !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        padding: 0 12px !important;
                        cursor: pointer !important;
                        color: var(--text-muted, #94a3b8) !important;
                        box-shadow: none !important;
                        z-index: 5 !important;
                    }

                    .profile-page-scope .relative button:hover {
                        background: transparent !important;
                        color: var(--text-strong) !important;
                    }
                `}
            </style>

            <div className="container-fluid px-3 px-md-4 px-lg-5 py-4 py-lg-5" style={{ maxWidth: '1720px', margin: '0 auto' }}>
                <div className="row g-6 align-items-start">

                    {/* ── LEFT COLUMN: SUMMARY + INLINE EDITABLE FIELDS ── */}
                    <div className="col-12 col-lg-4 sticky-lg-top" style={{ top: '85px', zIndex: 10 }}>
                        <div className="d-flex flex-column gap-6">

                            {/* Identity card */}
                            <div className="card overflow-hidden">
                                <div style={{ height: 6, background: 'linear-gradient(90deg, var(--bs-primary) 0%, #60a5fa 55%, #f59e0b 100%)' }} />
                                <div className="card-body">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="shrink-0 rounded-circle overflow-hidden border" style={{ width: 60, height: 60 }}>
                                            {localUser.avatar_url ? (
                                                <img
                                                    src={localUser.avatar_url}
                                                    alt={localUser.name}
                                                    className="w-100 h-100"
                                                    style={{ objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <Avatar name={localUser.name} size={70} />
                                            )}
                                        </div>

                                        <div className="min-w-0 grow">
                                            <h5 className="fw-semibold mb-1 text-strong-custom text-truncate">{localUser.name}</h5>
                                            <p className="fs-2 text-body-secondary fw-semibold mb-2 text-truncate" title={localUser.agency_name}>
                                                {localUser.agency_name}
                                            </p>
                                            <div className="d-flex flex-wrap gap-2">
                                                <span className={`badge ${verified ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} fw-semibold fs-2 gap-2 d-inline-flex align-items-center`}>
                                                    <iconify-icon icon={verified ? "solar:shield-check-line-duotone" : "solar:shield-warning-line-duotone"} className="fs-3"></iconify-icon>
                                                    {verified ? "Email Verified" : "Email Pending"}
                                                </span>
                                                <span className={`badge ${manuallyVerified ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} fw-semibold fs-2 gap-2 d-inline-flex align-items-center`}>
                                                    <iconify-icon icon={manuallyVerified ? "solar:user-check-line-duotone" : "solar:clock-circle-line-duotone"} className="fs-3"></iconify-icon>
                                                    {manuallyVerified ? "Agency Verified" : "Awaiting Verification"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* About User Info List Card */}
                            <Card>
                                <SectionHeading icon="solar:user-circle-line-duotone">About User</SectionHeading>
                                <div>
                                    <EditableField
                                        icon="solar:user-line-duotone"
                                        label="Full Name"
                                        value={localUser.name}
                                        fieldName="name"
                                        editable={canEdit}
                                        onRequestSave={requestSave}
                                    />

                                    
                                    {/* Locked Country Row */}
                                    <div className="sad-field-row py-4 border-bottom d-flex gap-4 align-items-start">
                                        <span
                                            className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 shrink-0"
                                            style={{ width: 40, height: 40, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}
                                        >
                                            <iconify-icon icon="solar:global-line-duotone" className="text-primary"></iconify-icon>
                                        </span>
                                        <div className="grow min-w-0">
                                            <span className="sad-label fs-2 fw-semibold text-uppercase text-body-secondary d-block mb-2">Country</span>
                                            <p className="sad-value fs-3 fw-semibold mb-0">
                                                {localUser.country || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <EditableField
                                        icon="solar:letter-line-duotone"
                                        label="Email Address"
                                        value={localUser.email}
                                        fieldName="email"
                                        type="email"
                                        editable={canEdit}
                                        onRequestSave={requestSave}
                                    />

                                    <EditableField
                                        icon="solar:phone-line-duotone"
                                        label="Contact Number"
                                        value={localUser.contact_number}
                                        fieldName="contact_number"
                                        type="tel"
                                        editable={canEdit}
                                        onRequestSave={requestSave}
                                    />
                                </div>
                            </Card>

                            {/* Metadata profile details */}
                            <Card>
                                <SectionHeading icon="solar:document-text-line-duotone">Profile Metadata</SectionHeading>
                                <div className="row g-3 pt-3">
                                    <div className="col-6">
                                        <span className="fs-2 fw-semibold text-uppercase text-body-secondary d-block mb-1">Status</span>
                                        <p className={`fw-semibold fs-3 mb-0 ${verified ? 'text-success' : 'text-warning'}`}>
                                            {verified ? "Active Partner" : "Verification Pending"}
                                        </p>
                                    </div>
                                    <div className="col-6">
                                        <span className="fs-2 fw-semibold text-uppercase text-body-secondary d-block mb-1">Role Type</span>
                                        <p className="sad-value fs-3 fw-semibold mb-0 text-capitalize">
                                            {roleLabel(localUser.role)}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Manual agency verification */}
                            {canVerify && !manuallyVerified && (
                                <Card className="border border-warning">
                                    <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                                        <div className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 shrink-0" style={{ width: 36, height: 36, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}>
                                            <iconify-icon icon="solar:clock-circle-line-duotone" className="text-warning fs-5" />
                                        </div>
                                        <h6 className="sad-value fs-4 fw-semibold mb-0">Manual Verification Needed</h6>
                                    </div>
                                    <p className="fs-3 text-body-secondary fw-medium mb-4">
                                        This user cannot log in until their account is manually verified by your agency. Confirm their details are legitimate before approving.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleVerifyNow}
                                        disabled={verifying}
                                        className="btn btn-success w-100 d-inline-flex align-items-center justify-content-center gap-2"
                                        style={{ borderRadius: '0.5rem', fontWeight: 600 }}
                                    >
                                        {verifying ? (
                                            <LocalSpinner className="text-white" />
                                        ) : (
                                            <iconify-icon icon="solar:user-check-line-duotone" className="fs-4" />
                                        )}
                                        {verifying ? 'Verifying...' : 'Verify This Agent'}
                                    </button>
                                </Card>
                            )}

                            {/* Developer toggles: grant verifier access */}
                            {isSuperAdmin && isVerifierEligibleRole(localUser.role) && (
                                <Card>
                                    <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                                        <div className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 shrink-0" style={{ width: 36, height: 36, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}>
                                            <iconify-icon icon="solar:shield-check-line-duotone" className="text-primary fs-5" />
                                        </div>
                                        <h6 className="sad-value fs-4 fw-semibold mb-0">Verifier Access</h6>
                                    </div>
                                    <p className="fs-6 text-body-secondary fw-medium mb-4">
                                        When enabled, this user receives new-agent verification emails and can approve pending accounts.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleToggleVerifierAccess}
                                        disabled={verifierToggling}
                                        role="switch"
                                        aria-checked={!!localUser.can_verify_users}
                                        className="d-flex align-items-center gap-3 border-0 bg-transparent p-0"
                                        style={{ cursor: verifierToggling ? 'not-allowed' : 'pointer', opacity: verifierToggling ? 0.6 : 1 }}
                                    >
                                        <span
                                            style={{
                                                width: 44, height: 24, borderRadius: 999,
                                                background: localUser.can_verify_users ? PRIMARY : 'var(--border-color, #dee2e6)',
                                                position: 'relative', transition: 'background 0.2s ease', display: 'inline-block'
                                            }}
                                        >
                                            <span
                                                style={{
                                                    position: 'absolute', top: 2,
                                                    left: localUser.can_verify_users ? 22 : 2,
                                                    width: 20, height: 20, borderRadius: '50%', background: 'white',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.2s ease',
                                                }}
                                            />
                                        </span>
                                        <span className="fs-6 fw-bold sad-value">
                                            {localUser.can_verify_users ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </button>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: PASSWORD RESET + DANGER ZONE ── */}
                    <div className="col-12 col-lg-8">
                        {canEdit ? (
                            <Card>
                                <SectionHeading icon="solar:key-square-2-line-duotone">Reset Password</SectionHeading>
                                <div className="pt-3 mb-5">
                                    <p className="fs-3 text-body-secondary fw-medium mb-4">
                                        {isSelf ? 'Enter your current password, then choose a new one.' : 'Set a new password for this user.'}
                                    </p>

                                    <Form
                                        action={`/users/${localUser.id}/password`}
                                        method="put"
                                        resetOnSuccess={['current_password', 'password', 'password_confirmation']}
                                        className="d-flex flex-column gap-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                {isSelf && (
                                                    <div>
                                                        <Label htmlFor="current_password" className="survey-label">Old Password</Label>
                                                        <PasswordInput id="current_password" name="current_password" autoComplete="current-password" placeholder="••••••••" className="survey-input" />
                                                        <InputError message={errors.current_password} className="mt-2" />
                                                    </div>
                                                )}
                                                <div className="row g-3">
                                                    <div className="col-md-6">
                                                        <Label htmlFor="password" className="survey-label">New Password</Label>
                                                        <PasswordInput id="password" name="password" autoComplete="new-password" placeholder="••••••••" className="survey-input" />
                                                        <InputError message={errors.password} className="mt-2" />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <Label htmlFor="password_confirmation" className="survey-label">Confirm New Password</Label>
                                                        <PasswordInput id="password_confirmation" name="password_confirmation" autoComplete="new-password" placeholder="••••••••" className="survey-input" />
                                                        <InputError message={errors.password_confirmation} className="mt-2" />
                                                    </div>
                                                </div>
                                                <div className="d-flex justify-content-end pt-3">
                                                    <button type="submit" disabled={processing} className="btn btn-primary d-inline-flex align-items-center gap-2" style={{ borderRadius: '0.5rem', fontWeight: 600 }}>
                                                        {processing && <LocalSpinner className="text-white" />}
                                                        <span>{processing ? "Updating..." : "Update Password"}</span>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                </div>

                                {isSelf && (
                                    <>
                                        <div className="section-divider" />
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <div className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 shrink-0" style={{ width: 36, height: 36, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}>
                                                <iconify-icon icon="solar:trash-bin-trash-line-duotone" className="text-danger fs-5" />
                                            </div>
                                            <h6 className="sad-value fs-4 fw-semibold mb-0 text-danger">Danger Zone</h6>
                                        </div>
                                        <p className="fs-3 text-body-secondary fw-semibold mb-4">
                                            Once your account is deleted, all of its resources, datasets, and surveys will be permanently destroyed. This operation is non-reversible.
                                        </p>

                                        {!showDeleteConfirm ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="btn btn-outline-danger"
                                                style={{ borderRadius: '0.5rem', fontWeight: 600 }}
                                            >
                                                Delete Account
                                            </button>
                                        ) : (
                                            <Form action="/settings/profile" method="delete" className="d-flex flex-column gap-3" style={{ maxWidth: '450px' }}>
                                                {({ processing, errors }) => (
                                                    <>
                                                        <div>
                                                            <Label htmlFor="delete_password" className="survey-label">Confirm Your Current Password</Label>
                                                            <PasswordInput id="delete_password" name="password" autoComplete="current-password" placeholder="Confirm Password" className="survey-input" />
                                                            <InputError message={errors.password} className="mt-2" />
                                                        </div>
                                                        <div className="d-flex gap-3">
                                                            <button
                                                                type="submit"
                                                                disabled={processing}
                                                                className="btn btn-danger"
                                                                style={{ borderRadius: '0.5rem', fontWeight: 600 }}
                                                            >
                                                                {processing ? 'Deleting...' : 'Confirm Delete'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowDeleteConfirm(false)}
                                                                className="btn btn-light border"
                                                                style={{ borderRadius: '0.5rem', fontWeight: 600 }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </Form>
                                        )}
                                    </>
                                )}
                            </Card>
                        ) : (
                            <Card>
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="sad-icon-chip d-flex align-items-center justify-content-center rounded-3 shrink-0" style={{ width: 42, height: 42, background: 'var(--bs-primary-bg-subtle, #e7f1ff)' }}>
                                        <iconify-icon icon="solar:buildings-line-duotone" style={{ fontSize: '1.35rem' }} />
                                    </div>
                                    <div>
                                        <h2 className="font-['Castoro_Titling'] fs-5 text-strong-custom text-uppercase m-0 tracking-wide">
                                            Dossier Information
                                        </h2>
                                        <p className="fs-6 text-faint-custom m-0 fw-medium">Verified system metadata and records for this registration.</p>
                                    </div>
                                </div>
                                <p className="fs-6 text-body-secondary fw-medium">
                                    This user's contact details are shown in the summary card on the left. You do not have permission to edit this profile.
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* ── PASSWORD CONFIRMATION MODAL ── */}
            {pendingChange && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
                    style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                    onClick={closeModal}
                >
                    <div
                        className="card p-4 shadow-lg w-100"
                        style={{ maxWidth: '400px', borderRadius: '1rem' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h3 className="font-['Castoro_Titling'] fs-6 text-strong-custom text-uppercase tracking-wide m-0">
                                Confirm Change
                            </h3>
                            <button onClick={closeModal} className="border-0 bg-transparent text-body-secondary p-0 d-flex align-items-center">
                                <iconify-icon icon="solar:close-circle-line-duotone" className="fs-4" />
                            </button>
                        </div>

                        <p className="fs-6 fw-semibold text-body-secondary mb-4">
                            Enter your password to update <span className="text-strong-custom">{pendingChange.field.replace('_', ' ')}</span> to:
                            <span className="d-block mt-1 text-strong-custom fw-bold text-truncate">{pendingChange.value}</span>
                        </p>

                        <div className="d-flex flex-column gap-2">
                            <Label htmlFor="confirm_password" className="survey-label">Password</Label>
                            <PasswordInput
                                id="confirm_password"
                                name="confirm_password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="survey-input"
                                value={confirmPassword}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && submitChange()}
                            />
                            {confirmError && (
                                <p className="text-danger fw-semibold mt-1" style={{ fontSize: '0.78rem' }}>{confirmError}</p>
                            )}
                        </div>

                        <div className="d-flex gap-3 mt-4">
                            <button
                                type="button"
                                onClick={submitChange}
                                disabled={confirming}
                                style={{
                                    flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    background: confirming ? 'var(--text-faint)' : PRIMARY, color: 'white', border: 'none',
                                    borderRadius: '0.5rem', padding: '0.65rem 1.25rem', fontFamily: "Rajdhani, sans-serif",
                                    fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                                    cursor: confirming ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {confirming && <LocalSpinner className="text-white" />}
                                {confirming ? 'Confirming...' : 'Confirm'}
                            </button>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="btn btn-light border"
                                style={{
                                    borderRadius: '0.5rem', padding: '0.65rem 1.25rem', fontFamily: "Rajdhani, sans-serif",
                                    fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Status Toast Notification */}
            {toastMessage && (
                <div
                    className="position-fixed d-flex align-items-center gap-2 bg-dark text-white fw-semibold fs-2 text-uppercase py-3 px-4 rounded-3 shadow-lg"
                    style={{ bottom: 24, right: 24, zIndex: 1050 }}
                >
                    <iconify-icon icon="solar:check-circle-bold" className="fs-4 text-success"></iconify-icon>
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}

Profile.layout = { title: 'Profile', description: 'Profile' };