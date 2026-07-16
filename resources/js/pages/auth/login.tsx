import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <div className="d-flex position-fixed start-0 top-0 end-0 bottom-0 bg-white" style={{ zIndex: 999 }}>
            <Head title="Log in - Partner Portal" />

            <style>
                {`
                    /* ── Classical Inputs & Typography ── */
                    .survey-input {
                        width: 100%;
                        border: 1px solid #d1d5db !important;
                        border-radius: 6px !important;
                        padding: 0.75rem 1rem !important;
                        font-size: 0.9rem !important;
                        font-weight: 500 !important;
                        color: #1f2937 !important;
                        background: white !important;
                        outline: none !important;
                        transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
                        height: auto !important;
                    }
                    .survey-input:focus-within, .survey-input:focus {
                        border-color: #0f172a !important; /* Classical Deep Slate */
                        box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1) !important;
                    }
                    .survey-label {
                        display: block;
                        font-weight: 600 !important;
                        font-size: 0.75rem !important;
                        letter-spacing: 0.08em !important;
                        text-transform: uppercase;
                        color: #4b5563;
                        margin-bottom: 0.35rem;
                    }
                    .hover-text-accent:hover {
                        color: #b45309 !important; /* Classic Warm Bronze/Gold */
                    }

                    /* ── Password Visibility Button Positioning ── */
                    .password-container button {
                        position: absolute !important;
                        right: 1rem !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                        background: transparent !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        outline: none !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        z-index: 10 !important;
                        color: #9ca3af !important;
                        width: auto !important;
                        height: auto !important;
                        box-shadow: none !important;
                    }
                    .password-container input {
                        padding-right: 3rem !important;
                    }

                    /* ── Classic Radix Checkbox Fix ── */
                    button[role="checkbox"] {
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        position: relative !important;
                        border: 1px solid #d1d5db !important;
                        border-radius: 4px !important;
                        background-color: white !important;
                        cursor: pointer !important;
                        padding: 0 !important;
                        width: 16px !important;
                        height: 16px !important;
                        transition: background-color 0.15s, border-color 0.15s !important;
                        box-shadow: none !important;
                    }
                    
                    button[role="checkbox"][data-state="checked"] {
                        background-color: #0f172a !important; /* Match Slate Primary */
                        border-color: #0f172a !important;
                    }

                    button[role="checkbox"] span {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: 100% !important;
                        height: 100% !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        pointer-events: none !important;
                    }

                    button[role="checkbox"] span svg {
                        width: 10px !important;
                        height: 10px !important;
                        stroke: white !important; 
                        stroke-width: 3px !important;
                    }
                `}
            </style>

            {/* ── Left Panel (Desktop Elegant Branding) ── */}
            <div className="d-none d-lg-flex col-lg-5 flex-column justify-content-center position-relative overflow-hidden" style={{
                background: "linear-gradient(135deg, #090d16 0%, #0f172a 100%)",
                padding: "4rem 3.5rem",
                borderRight: "1px solid rgba(255, 255, 255, 0.05)"
            }}>
                {/* Sophisticated light glow backdrops instead of saturated gradients */}
                <div style={{ position: "absolute", top: -100, right: -100, width: 350, height: 350, borderRadius: "50%", background: "rgba(180, 83, 9, 0.05)", filter: "blur(90px)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(15, 23, 42, 0.3)", filter: "blur(70px)", pointerEvents: "none" }} />

                <div className="position-relative z-1 w-100 max-w-sm mx-auto text-center">
                    <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center overflow-hidden shrink-0 shadow-sm" style={{ width: 60, height: 60, border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                            <img src="https://admin.studyinnepal.com/storage/settings/JhagqBcT0B9QQkFcQkSplV50L2nwBTdMc7DJB0DM.png" alt="Study in Nepal" className="h-100 w-100 object-fit-cover" style={{ transform: "scale(1.79)" }} />
                        </div>
                    </div>

                    <span className="d-inline-block fw-semibold fs-5 text-uppercase mb-3" style={{ letterSpacing: "0.25em", color: "#b45309" }}>
                        Partner Portal
                    </span>
                    <h1 className="text-white fw-normal mb-4" style={{ fontSize: "2.25rem", letterSpacing: "0.02em", lineHeight: 1.3, fontFamily: "Georgia, serif" }}>
                        Welcome Back
                    </h1>
                    <p className="text-secondary fs-5 mb-0" style={{ letterSpacing: "0.03em", lineHeight: 1.7, color: "#9ca3af" }}>
                        Sign in to securely access your institutional dashboard, manage partner systems, and view consolidated insights.
                    </p>
                </div>
            </div>

            {/* ── Right Panel (Classic Minimal Form) ── */}
            <div className="col-12 col-lg-7 d-flex align-items-center justify-content-center p-4 p-sm-5 overflow-auto" style={{ background: "#F8FAFC" }}>
                <div className="w-100" style={{ maxWidth: "420px" }}>
                    
                    <div className="d-lg-none text-center mb-4">
                        <span className="d-inline-block fw-semibold fs-5 text-uppercase mb-1" style={{ letterSpacing: "0.25em", color: "#b45309" }}>
                            Partner Portal
                        </span>
                        <h2 className="text-dark fw-semibold" style={{ fontSize: "1.5rem", letterSpacing: "0.01em" }}>Account Log In</h2>
                    </div>

                    {status && (
                        <div className="alert alert-success text-center fw-medium mb-4 border border-success-subtle rounded-2 py-2 px-3 small">
                            {status}
                        </div>
                    )}

                    <div className="card border-0 shadow-sm p-4 p-sm-5 bg-white" style={{ borderRadius: "8px" }}>
                        <Form {...store.form()} resetOnSuccess={['password']} className="d-flex flex-column gap-3">
                            {({ processing, errors }) => (
                                <div className="d-flex flex-column gap-4">
                                    <div>
                                        <Label htmlFor="email" className="survey-label">Email Address</Label>
                                        <Input id="email" type="email" name="email" required autoFocus tabIndex={1} autoComplete="email" placeholder="partner@example.com" className="survey-input" />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                            <Label htmlFor="password" className="survey-label mb-0">Password</Label>
                                            {canResetPassword && (
                                                <TextLink href={request()} className="text-decoration-none fw-semibold text-uppercase hover-text-accent transition-colors" style={{ color: "#0f172a", fontSize: "0.7rem", letterSpacing: "0.05em" }} tabIndex={5}>
                                                    Forgot password?
                                                </TextLink>
                                            )}
                                        </div>
                                        
                                        <div className="position-relative password-container">
                                            <PasswordInput id="password" name="password" required tabIndex={2} autoComplete="current-password" placeholder="Enter your password" className="survey-input" />
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="d-flex align-items-center gap-2 pt-1">
                                        <Checkbox id="remember" name="remember" tabIndex={3} />
                                        <Label htmlFor="remember" className="fw-medium text-muted text-uppercase cursor-pointer mb-0" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                                            Remember me for 30 days
                                        </Label>
                                    </div>

                                    <div className="d-flex justify-content-center mt-2">
                                        <Button type="submit" tabIndex={4} disabled={processing} style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: processing ? "#94a3b8" : "#0f172a",
                                            color: "white",
                                            border: "none",
                                            cursor: processing ? "not-allowed" : "pointer",
                                            borderRadius: "6px",
                                            height: "3rem",
                                            fontSize: "0.85rem",
                                            fontWeight: "600",
                                            letterSpacing: "0.08em",
                                            textTransform: "uppercase",
                                            width: "100%",
                                            transition: "background-color 0.2s ease, transform 0.1s ease",
                                            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                                            gap: "0.5rem"
                                        }}>
                                            {processing ? (
                                                <>
                                                    <Spinner className="text-white" style={{ width: "16px", height: "16px" }} />
                                                    <span>Authenticating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Secure Log In</span>
                                                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                                    </svg>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </div>

                    <div className="text-center text-secondary mt-4 fw-medium" style={{ fontSize: "0.85rem" }}>
                        Don't have a partner account?{' '}
                        <TextLink href={register()} tabIndex={5} style={{ color: "#0f172a", fontWeight: "700" }} className="text-decoration-none hover-text-accent transition-colors">
                            Apply Here
                        </TextLink>
                    </div>
                </div>
            </div>
        </div>
    );
}

Login.layout = { title: 'Log in', description: 'Log in' };