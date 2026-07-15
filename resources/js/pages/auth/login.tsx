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
                    .survey-input {
                        width: 100%;
                        border: 1.5px solid #e5e7eb !important;
                        border-radius: 999px !important;
                        padding: 0.85rem 1.5rem !important;
                        font-size: 0.95rem !important;
                        font-weight: 600 !important;
                        color: #0a0a0a !important;
                        background: white !important;
                        outline: none !important;
                        transition: border-color 0.2s !important;
                        height: auto !important;
                    }
                    .survey-input:focus-within, .survey-input:focus {
                        border-color: #0ea5e9 !important;
                        box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1) !important;
                    }
                    .survey-label {
                        display: block;
                        font-weight: 700 !important;
                        font-size: 0.8rem !important;
                        letter-spacing: 0.1em !important;
                        text-transform: uppercase;
                        color: #1a1a1a;
                        margin-bottom: 0.4rem;
                    }
                    .hover-text-warning:hover {
                        color: #fbbf24 !important;
                    }

                    /* ── Password Visibility Button Reset & Positioning ── */
                    .password-container button {
                        position: absolute !important;
                        right: 1.25rem !important;
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
                        color: #6c757d !important;
                        width: auto !important;
                        height: auto !important;
                        box-shadow: none !important;
                    }
                    /* Ensure input text doesn't overlap the absolute eye icon on the right */
                    .password-container input {
                        padding-right: 3.5rem !important;
                    }

                    /* ── Shadcn / Radix Checkbox Fix ── */
                    button[role="checkbox"] {
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        position: relative !important;
                        border: 1.5px solid #d1d5db !important; /* Light gray outline */
                        border-radius: 4px !important;
                        background-color: white !important;
                        cursor: pointer !important;
                        padding: 0 !important;
                        width: 18px !important;
                        height: 18px !important;
                        transition: background-color 0.15s, border-color 0.15s !important;
                        box-shadow: none !important;
                    }
                    
                    button[role="checkbox"][data-state="checked"] {
                        background-color: #0ea5e9 !important; /* Set to primary blue color */
                        border-color: #0ea5e9 !important;
                    }

                    /* Center the indicator block inside the checkbox box */
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

                    /* Style the checkmark SVG to align perfectly and render in white */
                    button[role="checkbox"] span svg {
                        width: 11px !important;
                        height: 11px !important;
                        stroke: white !important; 
                        stroke-width: 3px !important;
                    }
                `}
            </style>

            {/* ── Left Panel (Desktop view only) ── */}
            <div className="d-none d-lg-flex col-lg-5 flex-column justify-content-center position-relative overflow-hidden" style={{
                background: "linear-gradient(135deg, #0a0a0a 0%, #0f172a 60%, #0c2d48 100%)",
                padding: "4rem 3rem",
            }}>
                {/* Background decorative blurry gradient elements */}
                <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(14, 165, 233, 0.15)", filter: "blur(80px)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(251, 191, 36, 0.1)", filter: "blur(60px)", pointerEvents: "none" }} />

                <div className="position-relative z-1 w-100 max-w-sm mx-auto text-center">
                    <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center overflow-hidden shrink-0" style={{ width: 56, height: 56 }}>
                            <img src="https://admin.studyinnepal.com/storage/settings/JhagqBcT0B9QQkFcQkSplV50L2nwBTdMc7DJB0DM.png" alt="Study in Nepal" className="h-100 w-100 object-fit-cover" style={{ transform: "scale(1.79)" }} />
                        </div>
                    </div>

                    <span className="d-inline-block fw-bold fs-2 text-uppercase text-warning mb-3" style={{ letterSpacing: "0.3em" }}>
                        Partner Portal
                    </span>
                    <h1 className="text-white fw-light mb-4 text-uppercase" style={{ fontSize: "2.5rem", letterSpacing: "0.05em", lineHeight: 1.2 }}>
                        Welcome<br />
                        <span style={{ background: "linear-gradient(90deg, #0ea5e9, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} className="fw-semibold">
                            Back
                        </span>
                    </h1>
                    <p className="text-white-50 fs-3 mb-0" style={{ letterSpacing: "0.08em", lineHeight: 1.8 }}>
                        Sign in to securely access your institutional dashboard, manage data, and view aggregated research insights.
                    </p>
                </div>
            </div>

            {/* ── Right Panel (Log in Form) ── */}
            <div className="col-12 col-lg-7 d-flex align-items-center justify-content-center p-4 p-sm-5 overflow-auto" style={{ background: "#F8FAFB" }}>
                <div className="w-100" style={{ maxWidth: "440px" }}>
                    
                    <div className="d-lg-none text-center mb-4">
                        <span className="d-inline-block fw-bold fs-2 text-uppercase text-primary mb-2" style={{ letterSpacing: "0.3em" }}>
                            Partner Portal
                        </span>
                        <h2 className="text-dark text-uppercase fw-semibold" style={{ fontSize: "1.8rem" }}>Account Log In</h2>
                    </div>

                    {status && (
                        <div className="alert alert-success text-center fw-semibold mb-4 border border-success-subtle rounded-3 py-3 px-4">
                            {status}
                        </div>
                    )}

                    <div className="card border border-primary-subtle shadow-sm p-4 p-sm-5 rounded-4 bg-white">
                        <Form {...store.form()} resetOnSuccess={['password']} className="d-flex flex-column gap-3">
                            {({ processing, errors }) => (
                                <div className="d-flex flex-column gap-4">
                                    <div>
                                        <Label htmlFor="email" className="survey-label">Email address</Label>
                                        <Input id="email" type="email" name="email" required autoFocus tabIndex={1} autoComplete="email" placeholder="partner@example.com" className="survey-input" />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div>
                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                            <Label htmlFor="password" className="survey-label mb-0">Password</Label>
                                            {canResetPassword && (
                                                <TextLink href={request()} className="text-decoration-none font-bold text-uppercase tracking-wider hover-text-warning transition-colors" style={{ color: "#0ea5e9", fontSize: "0.75rem" }} tabIndex={5}>
                                                    Forgot password?
                                                </TextLink>
                                            )}
                                        </div>
                                        
                                        {/* Wrapped in a relative container with password-container classes */}
                                        <div className="position-relative password-container">
                                            <PasswordInput id="password" name="password" required tabIndex={2} autoComplete="current-password" placeholder="Enter your password" className="survey-input" />
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="d-flex align-items-center gap-2 pt-1">
                                        <Checkbox id="remember" name="remember" tabIndex={3} style={{ width: 18, height: 18 }} />
                                        <Label htmlFor="remember" className="font-semibold text-body-secondary text-uppercase tracking-wider mb-0 cursor-pointer" style={{ fontSize: "0.8rem" }}>
                                            Remember me for 30 days
                                        </Label>
                                    </div>

                                    <div className="d-flex justify-content-center mt-3">
                                        <Button type="submit" tabIndex={4} disabled={processing} style={{
                                            display: "inline-flex", alignItems: "center",
                                            background: processing ? "#94a3b8" : "#0ea5e9", color: "white", border: "none",
                                            cursor: processing ? "not-allowed" : "pointer", borderRadius: "999px",
                                            paddingLeft: "1.75rem", paddingRight: "0.35rem", height: "3.25rem",
                                            fontSize: "0.85rem", fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase",
                                            width: "100%", justifyContent: "space-between",
                                            boxShadow: processing ? "none" : "0 8px 24px rgba(14, 165, 233, 0.25)", transition: "all 0.3s",
                                        }}>
                                            <span>{processing ? "Authenticating..." : "Secure Log In"}</span>
                                            <div className="rounded-circle border border-white-50 d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
                                                {processing ? <Spinner className="text-white" /> : (
                                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </div>

                    <div className="text-center text-body-secondary mt-4 fw-semibold" style={{ fontSize: "0.9rem" }}>
                        Don't have a partner account?{' '}
                        <TextLink href={register()} tabIndex={5} style={{ color: "#0ea5e9", fontWeight: "700" }} className="text-decoration-none hover-text-warning transition-colors">
                            Apply Here
                        </TextLink>
                    </div>
                </div>
            </div>
        </div>
    );
}

Login.layout = { title: 'Log in', description: 'Log in' };