<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>New Agent Pending Verification</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #F8FAFB; }
    @media screen and (max-width: 600px) {
        .email-container { width: 100% !important; }
        .fluid-padding { padding-left: 24px !important; padding-right: 24px !important; }
    }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F8FAFB;">

<!-- Preheader (hidden) -->
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    A new agent, {{ $newUserName }}, has registered under {{ $agencyName }} and needs your approval before they can log in.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFB;">
<tr>
<td align="center" style="padding: 32px 16px;">

    <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 32px rgba(14,165,233,0.08);">

        <!-- Header band -->
        <tr>
            <td align="center" style="background:linear-gradient(135deg, #0a0a0a 0%, #0f172a 60%, #0c2d48 100%); background-color:#0a0a0a; padding: 36px 24px 32px 24px;">
                <img src="https://admin.studyinnepal.com/storage/settings/JhagqBcT0B9QQkFcQkSplV50L2nwBTdMc7DJB0DM.png"
                     alt="Study in Nepal"
                     width="180"
                     style="display:block; width:180px; max-width:70%; height:auto; margin:0 auto;">
                <div style="margin-top:18px; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; letter-spacing:3px; text-transform:uppercase; color:#fbbf24;">
                    Partner Portal
                </div>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td class="fluid-padding" style="padding: 40px 48px 16px 48px; font-family:Arial, Helvetica, sans-serif;">
                <h1 style="margin:0 0 20px 0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.3; font-weight:normal; letter-spacing:0.5px; text-transform:uppercase; color:#0a0a0a;">
                    New Agent<br>Pending Verification
                </h1>

                <p style="margin:0 0 16px 0; font-size:15px; line-height:1.7; color:#4b5563;">
                    @if($recipientName)
                        Hi {{ $recipientName }},
                    @else
                        Hi there,
                    @endif
                </p>

                <p style="margin:0 0 24px 0; font-size:15px; line-height:1.7; color:#4b5563;">
                    A new user has registered under your agency, <strong style="color:#0a0a0a;">{{ $agencyName }}</strong>,
                    and is waiting on manual verification before they can access the
                    <strong style="color:#0a0a0a;">Study in Nepal Partner Portal</strong>.
                </p>

                <!-- Pending user details card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px 0; background-color:#F8FAFB; border-radius:14px;">
                    <tr>
                        <td style="padding: 20px 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding: 4px 0; font-size:13px; color:#9ca3af; width:110px; vertical-align:top;">Name</td>
                                    <td style="padding: 4px 0; font-size:14px; color:#0a0a0a; font-weight:bold;">{{ $newUserName }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; font-size:13px; color:#9ca3af; vertical-align:top;">Email</td>
                                    <td style="padding: 4px 0; font-size:14px; color:#0a0a0a;">{{ $newUserEmail }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; font-size:13px; color:#9ca3af; vertical-align:top;">Contact</td>
                                    <td style="padding: 4px 0; font-size:14px; color:#0a0a0a;">{{ $newUserContact }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- CTA Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px 0;">
                    <tr>
                        <td align="center" bgcolor="#0ea5e9" style="border-radius:999px;">
                            <a href="{{ $url }}"
                               target="_blank"
                               style="display:inline-block; padding:16px 40px; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#ffffff; text-decoration:none; border-radius:999px; background-color:#0ea5e9;">
                                Review &amp; Verify
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="margin:0 0 8px 0; font-size:13px; line-height:1.6; color:#9ca3af;">
                    This verification link will expire in {{ $expireDays ?? 7 }} days.
                </p>

                <p style="margin:0 0 32px 0; font-size:13px; line-height:1.6; color:#9ca3af;">
                    If you were not expecting this registration, please do not approve it and contact support instead.
                </p>

                <!-- Divider -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="border-top:1px solid #f0f0f0; padding-top:20px;">
                            <p style="margin:0; font-size:12px; line-height:1.6; color:#9ca3af;">
                                If the button above doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin:6px 0 0 0; font-size:12px; line-height:1.6; word-break:break-all;">
                                <a href="{{ $url }}" style="color:#0ea5e9; text-decoration:underline;">{{ $url }}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td align="center" style="padding: 28px 48px 36px 48px; font-family:Arial, Helvetica, sans-serif;">
                <p style="margin:0; font-size:12px; letter-spacing:0.5px; color:#b0b6bd;">
                    &copy; {{ date('Y') }} Study in Nepal. All rights reserved.
                </p>
            </td>
        </tr>

    </table>

</td>
</tr>
</table>

</body>
</html>