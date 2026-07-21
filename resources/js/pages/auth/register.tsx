import { useState } from 'react';
import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Iconify } from '@iconify/react';
import PhoneInput from 'react-phone-number-input';
import { parsePhoneNumber } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';

// Survey Theme Design Tokens
const PRIMARY = "#0ea5e9";
const AMBER = "#fbbf24";
const DARK = "#0a0a0a";
const SURFACE = "#F8FAFB";

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    // `phoneValue` is the E.164-formatted number, e.g. "+923001234567"
    const [phoneValue, setPhoneValue] = useState<string | undefined>(undefined);

    // Derive the full country name (e.g. "Pakistan") from whatever ISO
    // country the phone number currently resolves to, so it can be saved
    // alongside the number in the database.
    const isoCountry = phoneValue ? parsePhoneNumber(phoneValue)?.country : undefined;
    const countryName = isoCountry ? en[isoCountry] : '';

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-white row g-0" style={{ zIndex: 999, fontFamily: "'Rajdhani', sans-serif" }}>
            <Head title="Register - Partner Portal" />

            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@400;600;700&display=swap');
                    .survey-input {
                        width: 100%;
                        border: 1.5px solid #e5e7eb !important;
                        border-radius: 999px !important;
                        padding: 0.75rem 1.5rem !important;
                        font-family: 'Rajdhani', sans-serif !important;
                        font-size: 0.95rem !important;
                        font-weight: 600 !important;
                        color: ${DARK} !important;
                        background: white !important;
                        outline: none !important;
                        transition: border-color 0.2s !important;
                        height: auto !important;
                    }
                    .survey-input:focus-within, .survey-input:focus {
                        border-color: ${PRIMARY} !important;
                        box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1) !important;
                    }
                    .survey-label {
                        display: block;
                        font-family: 'Rajdhani', sans-serif !important;
                        font-weight: 700 !important;
                        font-size: 0.85rem !important;
                        letter-spacing: 0.1em !important;
                        text-transform: uppercase;
                        color: #1a1a1a;
                        margin-bottom: 0.35rem;
                    }

                    /* Link Hover State Transition */
                    .survey-link {
                        color: ${PRIMARY} !important;
                        font-weight: 700 !important;
                        text-decoration: none;
                        transition: color 0.2s ease-in-out;
                    }
                    .survey-link:hover {
                        color: ${AMBER} !important;
                    }

                    /* react-phone-number-input, restyled to match .survey-input */
                    .survey-phone {
                        display: flex;
                        align-items: center;
                        width: 100%;
                        border: 1.5px solid #e5e7eb;
                        border-radius: 999px;
                        padding: 0.4rem 1.25rem;
                        background: white;
                        transition: border-color 0.2s, box-shadow 0.2s;
                    }
                    .survey-phone:focus-within {
                        border-color: ${PRIMARY};
                        box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
                    }
                    .survey-phone .PhoneInputCountry {
                        margin-right: 0.75rem;
                    }
                    .survey-phone .PhoneInputInput {
                        flex: 1;
                        border: none !important;
                        outline: none !important;
                        background: transparent !important;
                        font-family: 'Rajdhani', sans-serif !important;
                        font-size: 0.95rem !important;
                        font-weight: 600 !important;
                        color: ${DARK} !important;
                        padding: 0.45rem 0 !important;
                    }
                `}
            </style>

            {/* ── Left Panel ── */}
            <div className="d-none d-lg-flex col-lg-5 flex-column justify-content-center position-relative overflow-hidden" style={{
                background: `linear-gradient(135deg, ${DARK} 0%, #0f172a 60%, #0c2d48 100%)`,
                padding: "4rem 3rem",
            }}>
                <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: `${PRIMARY}15`, filter: "blur(80px)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: `${AMBER}10`, filter: "blur(60px)", pointerEvents: "none" }} />
    
                <div className="position-relative z-3 w-100 mx-auto text-center" style={{ maxWidth: "448px" }}>
                    <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0" style={{ width: 56, height: 56 }}>
                            <img src="https://admin.studyinnepal.com/storage/settings/JhagqBcT0B9QQkFcQkSplV50L2nwBTdMc7DJB0DM.png" alt="Study in Nepal" className="h-100 w-100 object-fit-cover" style={{ transform: "scale(1.79)" }} />
                        </div>
                    </div>
                    <span style={{ display: "inline-block", fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.3em", textTransform: "uppercase", color: AMBER, marginBottom: "1.25rem" }}>
                        Partner Portal
                    </span>
                    <h1 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "clamp(2rem, 3.5vw, 3rem)", color: "white", fontWeight: "400", lineHeight: 1.2, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
                        Create <br />
                        <span style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${AMBER})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Account
                        </span>
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.95rem", fontWeight: "600", lineHeight: 1.8, letterSpacing: "0.08em" }}>
                        Join our research initiative. Register your agency details to collaborate on the Visa Policy Gap Dialogue Research.
                    </p>
                </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="col-12 col-lg-7 d-flex align-items-center justify-content-center p-4 p-sm-5 overflow-y-auto h-100" style={{ background: SURFACE }}>
                <div className="w-100 my-auto" style={{ maxWidth: "512px" }}>

                    <div className="d-lg-none text-center mb-4 mt-3">
                        <span style={{ display: "inline-block", fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.3em", textTransform: "uppercase", color: PRIMARY, marginBottom: "0.5rem" }}>
                            Partner Portal
                        </span>
                        <h2 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "2rem", color: DARK, textTransform: "uppercase" }}>Create Account</h2>
                    </div>

                    <div className="bg-white p-4 p-md-5" style={{ borderRadius: "1.25rem", boxShadow: "0 8px 32px rgba(14,165,233,0.06)", border: "1px solid rgba(14, 165, 233, 0.15)" }}>
                        <Form {...store.form()} resetOnSuccess={['password', 'password_confirmation']} disableWhileProcessing className="d-flex flex-column gap-4">
                            {({ processing, errors }) => (
                                <>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <label htmlFor="agency_name" className="survey-label">Agency Name <span className="text-danger">*</span></label>
                                            <input id="agency_name" type="text" required autoFocus tabIndex={1} name="agency_name" placeholder="Agency Ltd." className="form-control survey-input" />
                                            <InputError message={errors.agency_name} />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label htmlFor="name" className="survey-label">Person Name <span className="text-danger">*</span></label>
                                            <input id="name" type="text" required tabIndex={2} name="name" autoComplete="name" placeholder="Full Name" className="form-control survey-input" />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="col-12">
                                            <label htmlFor="contact_number" className="survey-label">Contact Number <span className="text-danger">*</span></label>
                                            <div className="survey-phone">
                                                <PhoneInput
                                                    international
                                                    defaultCountry="PK"
                                                    placeholder="Phone Number"
                                                    value={phoneValue}
                                                    onChange={setPhoneValue}
                                                    numberInputProps={{ id: 'contact_number', tabIndex: 3, autoComplete: 'tel' }}
                                                />
                                            </div>
                                            {/* Hidden fields actually submitted to the backend */}
                                            <input type="hidden" name="contact_number" value={phoneValue ?? ''} />
                                            <input type="hidden" name="country" value={countryName} />
                                            <InputError message={errors.contact_number} />
                                            <InputError message={errors.country} />
                                        </div>

                                        <div className="col-12">
                                            <label htmlFor="email" className="survey-label">Email Address <span className="text-danger">*</span></label>
                                            <input id="email" type="email" required tabIndex={4} autoComplete="email" name="email" placeholder="email@example.com" className="form-control survey-input" />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label htmlFor="password" className="survey-label">Password <span className="text-danger">*</span></label>
                                            <PasswordInput id="password" required tabIndex={5} autoComplete="new-password" name="password" placeholder="Password" passwordrules={passwordRules} className="form-control survey-input" />
                                            <InputError message={errors.password} />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label htmlFor="password_confirmation" className="survey-label">Confirm Password <span className="text-danger">*</span></label>
                                            <PasswordInput id="password_confirmation" required tabIndex={6} autoComplete="new-password" name="password_confirmation" placeholder="Confirm" passwordrules={passwordRules} className="form-control survey-input" />
                                            <InputError message={errors.password_confirmation} />
                                        </div>

                                        <div className="col-12 d-flex justify-content-center mt-4">
                                            <button type="submit" tabIndex={7} disabled={processing} className="btn w-100" style={{
                                                display: "inline-flex", alignItems: "center", gap: "1rem",
                                                background: processing ? "#94a3b8" : PRIMARY, color: "white", border: "none",
                                                cursor: processing ? "not-allowed" : "pointer", borderRadius: "999px",
                                                paddingLeft: "2rem", paddingRight: "0.35rem", height: "3.5rem",
                                                fontFamily: "Rajdhani, sans-serif", fontSize: "0.9rem",
                                                fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase",
                                                justifyContent: "space-between",
                                                boxShadow: processing ? "none" : `0 8px 24px ${PRIMARY}40`, transition: "all 0.3s",
                                            }}>
                                                <span>{processing ? "Processing..." : "Create Account"}</span>
                                                <div className="d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.4)" }}>
                                                    {processing ? (
                                                        <div className="spinner-border spinner-border-sm text-light" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                    ) : (
                                                      <Iconify size={20} color="white" />
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>

                    <div className="text-center mt-4 pb-4 text-muted" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                        Already registered an agency?{' '}
                        <TextLink href={login()} tabIndex={8} className="survey-link">
                            Log in here
                        </TextLink>
                    </div>
                </div>
            </div>
        </div>
    );
}

Register.layout = { title: 'Register', description: 'Register' };