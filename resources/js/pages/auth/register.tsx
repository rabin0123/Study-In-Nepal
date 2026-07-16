import { useState } from 'react';
import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

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
        <div className="fixed inset-0 z-[999] flex bg-white font-['Rajdhani']">
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
            <div className="hidden lg:flex w-5/12 flex-col justify-center relative overflow-hidden" style={{
                background: `linear-gradient(135deg, ${DARK} 0%, #0f172a 60%, #0c2d48 100%)`,
                padding: "4rem 3rem",
            }}>
                <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: `${PRIMARY}15`, filter: "blur(80px)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: `${AMBER}10`, filter: "blur(60px)", pointerEvents: "none" }} />
    <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center overflow-hidden shrink-0" style={{ width: 56, height: 56 }}>
                            <img src="https://admin.studyinnepal.com/storage/settings/JhagqBcT0B9QQkFcQkSplV50L2nwBTdMc7DJB0DM.png" alt="Study in Nepal" className="h-100 w-100 object-fit-cover" style={{ transform: "scale(1.79)" }} />
                        </div>
                    </div>
                <div className="relative z-10 w-full max-w-md mx-auto text-center">
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
            <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-10 overflow-y-auto" style={{ background: SURFACE }}>
                <div className="w-full max-w-lg my-auto">

                    <div className="lg:hidden text-center mb-6 mt-4">
                        <span style={{ display: "inline-block", fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.3em", textTransform: "uppercase", color: PRIMARY, marginBottom: "0.5rem" }}>
                            Partner Portal
                        </span>
                        <h2 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "2rem", color: DARK, textTransform: "uppercase" }}>Create Account</h2>
                    </div>

                    <div className="bg-white p-8 rounded-[1.25rem] shadow-[0_8px_32px_rgba(14,165,233,0.06)] border border-[#0ea5e925]">
                        <Form {...store.form()} resetOnSuccess={['password', 'password_confirmation']} disableWhileProcessing className="flex flex-col gap-5">
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="agency_name" className="survey-label">Agency Name <span className="text-red-500">*</span></Label>
                                                <Input id="agency_name" type="text" required autoFocus tabIndex={1} name="agency_name" placeholder="Agency Ltd." className="survey-input" />
                                                <InputError message={errors.agency_name} />
                                            </div>
                                            <div>
                                                <Label htmlFor="name" className="survey-label">Person Name <span className="text-red-500">*</span></Label>
                                                <Input id="name" type="text" required tabIndex={2} name="name" autoComplete="name" placeholder="Full Name" className="survey-input" />
                                                <InputError message={errors.name} />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="contact_number" className="survey-label">Contact Number <span className="text-red-500">*</span></Label>
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

                                        <div>
                                            <Label htmlFor="email" className="survey-label">Email Address <span className="text-red-500">*</span></Label>
                                            <Input id="email" type="email" required tabIndex={4} autoComplete="email" name="email" placeholder="email@example.com" className="survey-input" />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="password" className="survey-label">Password <span className="text-red-500">*</span></Label>
                                                <PasswordInput id="password" required tabIndex={5} autoComplete="new-password" name="password" placeholder="Password" passwordrules={passwordRules} className="survey-input" />
                                                <InputError message={errors.password} />
                                            </div>
                                            <div>
                                                <Label htmlFor="password_confirmation" className="survey-label">Confirm Password <span className="text-red-500">*</span></Label>
                                                <PasswordInput id="password_confirmation" required tabIndex={6} autoComplete="new-password" name="password_confirmation" placeholder="Confirm" passwordrules={passwordRules} className="survey-input" />
                                                <InputError message={errors.password_confirmation} />
                                            </div>
                                        </div>

                                        <div className="flex justify-center mt-4">
                                            <Button type="submit" tabIndex={7} disabled={processing} style={{
                                                display: "inline-flex", alignItems: "center", gap: "1rem",
                                                background: processing ? "#94a3b8" : PRIMARY, color: "white", border: "none",
                                                cursor: processing ? "not-allowed" : "pointer", borderRadius: "999px",
                                                paddingLeft: "2rem", paddingRight: "0.35rem", height: "3.5rem",
                                                fontFamily: "Rajdhani, sans-serif", fontSize: "0.9rem",
                                                fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase",
                                                width: "100%", justifyContent: "space-between",
                                                boxShadow: processing ? "none" : `0 8px 24px ${PRIMARY}40`, transition: "all 0.3s",
                                            }}>
                                                <span>{processing ? "Processing..." : "Create Account"}</span>
                                                <div style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {processing ? <Spinner className="text-white" /> : (
                                                        <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                                                    )}
                                                </div>
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>

                    <div className="text-center text-[0.95rem] font-semibold text-gray-500 mt-6 pb-6">
                        Already registered an agency?{' '}
                        <TextLink href={login()} tabIndex={8} style={{ color: PRIMARY, fontWeight: "700" }} className="hover:text-amber-500 transition-colors">
                            Log in here
                        </TextLink>
                    </div>
                </div>
            </div>
        </div>
    );
}

Register.layout = { title: 'Register', description: 'Register' };