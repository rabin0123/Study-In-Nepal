import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    const verificationLinkSent = status === 'verification-link-sent';

    return (
        <div className="d-flex position-fixed start-0 top-0 end-0 bottom-0 bg-white" style={{ zIndex: 999 }}>
            <Head title="Verify Email - Partner Portal" />

            <style>
                {`
                    .hover-text-warning:hover {
                        color: #fbbf24 !important;
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
<div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center overflow-hidden shrink-0" style={{ width: 56, height: 56 }}>
                            <img src="https://admin.studyinnepal.com/storage/settings/JhagqBcT0B9QQkFcQkSplV50L2nwBTdMc7DJB0DM.png" alt="Study in Nepal" className="h-100 w-100 object-fit-cover" style={{ transform: "scale(1.79)" }} />
                        </div>
                    </div>
                <div className="position-relative z-1 w-100 max-w-sm mx-auto text-center">
                    <span className="d-inline-block fw-bold fs-2 text-uppercase text-warning mb-3" style={{ letterSpacing: "0.3em" }}>
                        Partner Portal
                    </span>
                    <h1 className="text-white fw-light mb-4 text-uppercase" style={{ fontSize: "2.5rem", letterSpacing: "0.05em", lineHeight: 1.2 }}>
                        Almost <br />
                        <span style={{ background: "linear-gradient(90deg, #0ea5e9, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} className="fw-semibold">
                            There
                        </span>
                    </h1>
                    <p className="text-white-50 fs-3 mb-0" style={{ letterSpacing: "0.08em", lineHeight: 1.8 }}>
                        One last step before you can collaborate on the Visa Policy Gap Dialogue Research — confirm your email address.
                    </p>
                </div>
            </div>

            {/* ── Right Panel (Form Wrapper) ── */}
            <div className="col-12 col-lg-7 d-flex align-items-center justify-content-center p-4 p-sm-5 overflow-auto" style={{ background: "#F8FAFB" }}>
                <div className="w-100" style={{ maxWidth: "480px" }}>

                    <div className="d-lg-none text-center mb-4 mt-2">
                        <span className="d-inline-block fw-bold fs-2 text-uppercase text-primary mb-2" style={{ letterSpacing: "0.3em" }}>
                            Partner Portal
                        </span>
                        <h2 className="text-dark text-uppercase fw-semibold" style={{ fontSize: "1.8rem" }}>Verify Email</h2>
                    </div>

                    <div className="card border border-primary-subtle shadow-sm p-4 p-sm-5 rounded-4 bg-white text-center">
                        <div className="d-none d-lg-block mb-3">
                            <h2 className="text-dark text-uppercase fw-semibold mb-0" style={{ fontSize: "1.75rem" }}>
                                Verify Your Email
                            </h2>
                        </div>

                        <p className="text-body-secondary fs-3 fw-semibold mb-4" style={{ lineHeight: 1.7 }}>
                            Thanks for registering! Please confirm your email address by clicking the link we just sent you.
                            If you didn't receive it, you can request another one below.
                        </p>

                        {verificationLinkSent && (
                            <div className="alert alert-info text-center fw-semibold fs-2 rounded-3 py-2.5 px-3 mb-4">
                                A new verification link has been sent to the email address you provided during registration.
                            </div>
                        )}

                        <Form {...send.form()} className="d-flex flex-column align-items-center gap-3">
                            {({ processing }) => (
                                <Button type="submit" disabled={processing} style={{
                                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                                    background: processing ? "#94a3b8" : "#0ea5e9", color: "white", border: "none",
                                    cursor: processing ? "not-allowed" : "pointer", borderRadius: "999px",
                                    padding: "0.95rem 2.5rem", fontSize: "0.85rem",
                                    fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase",
                                    width: "100%", boxShadow: processing ? "none" : "0 8px 24px rgba(14, 165, 233, 0.25)",
                                    transition: "all 0.3s",
                                }}>
                                    {processing && <Spinner className="text-white" />}
                                    <span>{processing ? "Sending..." : "Resend Verification Email"}</span>
                                </Button>
                            )}
                        </Form>

                        <div className="mt-4 pt-4 border-top">
                            <Form action={logout()} method="post">
                                <button
                                    type="submit"
                                    style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        color: "#6b7280", fontWeight: 700, fontSize: "0.8rem",
                                        letterSpacing: "0.05em",
                                        textTransform: "uppercase",
                                    }}
                                    className="hover-text-warning transition-colors"
                                >
                                    Log Out
                                </button>
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};