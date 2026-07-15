<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $application->student_name }} - Record Profile</title>
    <style>
        /* ── DomPDF Compatible Premium Layout Styles ── */
        @page {
            margin: 25px;
            size: a4 portrait;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 13px;
        }

        /* Header link block mimicking top navigation */
        .back-nav {
            font-size: 10px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }

        /* 2-Column Table Grid Layout */
        .grid-layout {
            width: 100%;
            border-collapse: collapse;
            border: none;
        }
        .grid-layout td {
            border: none;
        }
        .col-left {
            width: 32%;
            vertical-align: top;
            padding-right: 20px;
        }
        .col-right {
            width: 68%;
            vertical-align: top;
        }

        /* ── Left Sidebar Profile Card ── */
        .profile-card {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 24px 15px;
            text-align: center;
            position: relative;
        }
        .brand-strip {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background-color: #0ea5e9;
        }
        .avatar-container {
            margin: 15px auto;
            text-align: center;
        }
        .avatar {
            display: inline-block;
            width: 70px;
            height: 70px;
            line-height: 70px;
            border-radius: 50%;
            background-color: #f0f9ff;
            border: 2px solid #e0f2fe;
            color: #0ea5e9;
            font-size: 22px;
            font-weight: bold;
            text-align: center;
        }
        .student-name {
            font-size: 17px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 10px;
            margin-bottom: 3px;
            line-height: 1.2;
        }
        .student-subtitle {
            font-size: 9px;
            font-weight: bold;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 20px;
        }
        .divider {
            border-top: 1px solid #f1f5f9;
            margin: 15px 0;
        }
        .meta-list {
            text-align: left;
            padding: 0;
            margin: 0;
            list-style: none;
        }
        .meta-item {
            margin-bottom: 12px;
            font-size: 11px;
            color: #475569;
            font-weight: 600;
            word-wrap: break-word;
        }
        .meta-label {
            font-size: 8px;
            font-weight: bold;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 2px;
            display: block;
        }

        /* Sidebar Record Details Panel */
        .summary-card {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 18px;
            margin-top: 20px;
        }
        .summary-title {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 0;
            margin-bottom: 12px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 6px;
        }
        .summary-row {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .summary-row td {
            padding: 2px 0;
        }
        .summary-label-muted {
            color: #94a3b8;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
        }
        .summary-val-dark {
            color: #334155;
            text-align: right;
        }

        /* ── Right Content Section Cards ── */
        .section-card {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
        }
        .section-header {
            margin-bottom: 16px;
            padding-bottom: 10px;
            border-bottom: 1px solid #f1f5f9;
        }
        .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
        }
        .section-subtitle {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 4px;
            margin-bottom: 0;
            font-weight: 500;
        }

        /* Grid data list mimicking settings update rows */
        .data-row {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 1px solid #f8fafc;
        }
        .data-row td {
            padding: 11px 8px;
            vertical-align: middle;
        }
        .data-row:last-child td {
            border-bottom: none;
        }
        .row-label {
            width: 35%;
            font-size: 10px;
            font-weight: bold;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .row-value {
            width: 65%;
            font-size: 12px;
            font-weight: bold;
            color: #334155;
        }
        .row-value-empty {
            color: #cbd5e1;
            font-style: italic;
            font-weight: 500;
        }
    </style>
</head>
<body>

    <!-- Back Navigation visual marker -->
    <div class="back-nav">
        Applications Database &nbsp;&bull;&nbsp; Record Dossier
    </div>

    <!-- Main Grid layout -->
    <table class="grid-layout">
        <tr>
            
            <!-- ── LEFT COLUMN ── -->
            <td class="col-left">
                
                <!-- Main profile summary -->
                <div class="profile-card">
                    <div class="brand-strip"></div>
                    
                    <div class="avatar-container">
                        @php
                            // Calculate student initials dynamically on the server
                            $initials = collect(explode(' ', $application->student_name))
                                ->slice(0, 2)
                                ->map(fn($x) => strtoupper(substr($x, 0, 1)))
                                ->implode('');
                        @endphp
                        <div class="avatar">
                            {{ $initials }}
                        </div>
                    </div>

                    <div class="student-name">{{ $application->student_name }}</div>
                    <div class="student-subtitle">Student Profile</div>

                    <div class="divider"></div>

                    <!-- Meta coordinates -->
                    <div class="meta-list">
                        <div class="meta-item">
                            <span class="meta-label">Email Address</span>
                            {{ $application->email }}
                        </div>
                        @if($application->phone_number)
                            <div class="meta-item">
                                <span class="meta-label">Contact Number</span>
                                {{ $application->phone_number }}
                            </div>
                        @endif
                        <div class="meta-item">
                            <span class="meta-label">Country of Origin</span>
                            {{ $application->country ?? 'N/A' }}
                        </div>
                    </div>
                </div>

                <!-- Record summary panel -->
                <div class="summary-card">
                    <h3 class="summary-title">Record Summary</h3>
                    <table class="summary-row">
                        <tr>
                            <td class="summary-label-muted">Application ID</td>
                            <td class="summary-val-dark font-mono">#APP-00{{ $application->id }}</td>
                        </tr>
                        <tr>
                            <td class="summary-label-muted">Registered Agent</td>
                            <td class="summary-val-dark">{{ $application->agency_name ?? 'Direct Application' }}</td>
                        </tr>
                        <tr>
                            <td class="summary-label-muted">Created By</td>
                            <td class="summary-val-dark">{{ $application->creator->name ?? 'Unknown User' }}</td>
                        </tr>
                        <tr>
                            <td class="summary-label-muted">Submitted On</td>
                            <td class="summary-val-dark">{{ $application->created_at->format('M d, Y') }}</td>
                        </tr>
                    </table>
                </div>

            </td>

            <!-- ── RIGHT COLUMN ── -->
            <td class="col-right">
                
                <!-- Section 1: Personal Profile -->
                <div class="section-card">
                    <div class="section-header">
                        <h2 class="section-title">Personal Information</h2>
                        <p class="section-subtitle">Student's biographical records and primary identification files.</p>
                    </div>

                    <table class="grid-layout">
                        <tr class="data-row">
                            <td class="row-label">Student Full Name</td>
                            <td class="row-value">{{ $application->student_name }}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="row-label">Email Address</td>
                            <td class="row-value">{{ $application->email }}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="row-label">Passport Number</td>
                            <td class="row-value">
                                @if($application->passport_number)
                                    {{ $application->passport_number }}
                                @else
                                    <span class="row-value-empty">Not set</span>
                                @endif
                            </td>
                        </tr>
                        <tr class="data-row">
                            <td class="row-label">Date of Birth</td>
                            <td class="row-value">
                                @if($application->date_of_birth)
                                    {{ $application->date_of_birth->format('M d, Y') }}
                                @else
                                    <span class="row-value-empty">Not set</span>
                                @endif
                            </td>
                        </tr>
                        <tr class="data-row">
                            <td class="row-label">Contact Number</td>
                            <td class="row-value">
                                @if($application->phone_number)
                                    {{ $application->phone_number }}
                                @else
                                    <span class="row-value-empty">Not set</span>
                                @endif
                            </td>
                        </tr>
                        <tr class="data-row">
                            <td class="row-label">Country of Origin</td>
                            <td class="row-value">{{ $application->country }}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="row-label">Physical Address</td>
                            <td class="row-value">
                                @if($application->address)
                                    {{ $application->address }}
                                @else
                                    <span class="row-value-empty">Not set</span>
                                @endif
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Section 2: Academic Profile -->
                <div class="section-card">
                    <div class="section-header">
                        <h2 class="section-title">Academic Placement</h2>
                        <p class="section-subtitle">Assigned university placement records and degree coordinates.</p>
                    </div>

                    <table class="grid-layout">
                        <tr class="data-row">
                            <td class="row-label">University Placement</td>
                            <td class="row-value">{{ $application->university_name }}</td>
                        </tr>
                        <tr class="data-row">
                            <td class="row-label">Course / Program</td>
                            <td class="row-value">{{ $application->course_name }}</td>
                        </tr>
                    </table>
                </div>

                <!-- Section 3: Referral Data -->
                <div class="section-card">
                    <div class="section-header">
                        <h2 class="section-title">Referral Information</h2>
                        <p class="section-subtitle">Verified managing agent references and associated notes.</p>
                    </div>

                    <table class="grid-layout">
                        <tr class="data-row">
                            <td class="row-label">Managing Agent</td>
                            <td class="row-value">{{ $application->agency_name ?? 'Direct Application' }}</td>
                            
                        </tr>
                        <tr class="data-row">
                            <td class="row-label">Reference Notes</td>
                            <td class="row-value">
                                @if($application->agency_reference_notes)
                                    {{ $application->agency_reference_notes }}
                                @else
                                    <span class="row-value-empty">No reference notes logged</span>
                                @endif
                            </td>
                        </tr>
                    </table>
                </div>

            </td>

        </tr>
    </table>

</body>
</html>