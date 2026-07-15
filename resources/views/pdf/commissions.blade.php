<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Commission Structure</title>
    <style>
        body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            font-size: 11px; 
            color: #334155; 
        }
        h2 { 
            text-align: center; 
            text-transform: uppercase; 
            letter-spacing: 2px; 
            color: #0ea5e9; 
            margin-bottom: 25px; 
            font-size: 18px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        th { 
            background-color: #f8fafc; 
            color: #64748b; 
            text-align: left; 
            padding: 12px 10px; 
            font-size: 10px; 
            text-transform: uppercase; 
            border-bottom: 2px solid #e2e8f0; 
            letter-spacing: 0.5px;
        }
        td { 
            padding: 12px 10px; 
            border-bottom: 1px solid #f1f5f9; 
            vertical-align: middle; 
        }
        /* Logo Styles */
        .logo-cell {
            width: 40px; 
            text-align: center; 
        }
        img.logo { 
            max-width: 28px; 
            max-height: 28px; 
            object-fit: contain; 
        }
        /* Clean Fallback Block for SVG or Missing Logos */
        .fallback-logo {
            display: inline-block;
            width: 24px;
            height: 24px;
            line-height: 24px;
            background-color: #f1f5f9;
            color: #64748b;
            font-weight: bold;
            font-size: 13px;
            text-align: center;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
        }
        .college-name { font-weight: bold; color: #0f172a; font-size: 12px; }
        .commission { font-weight: bold; color: #059669; }
    </style>
</head>
<body>

    <h2>Approved Commission Structure</h2>
    
    <table>
        <thead>
            <tr>
                <th colspan="2">College</th>
                <th>University</th>
                <th>Location</th>
                <th>Commission</th>
            </tr>
        </thead>
        <tbody>
            @foreach($entries as $entry)
                @php
                    $url = $entry->college_logo_url;
                    $isSvg = false;
                    
                    // Check if the file is an SVG
                    if ($url) {
                        $path = parse_url($url, PHP_URL_PATH);
                        if ($path && strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'svg') {
                            $isSvg = true;
                        }
                    }
                @endphp
                <tr>
                    <td class="logo-cell">
                        @if($url && !$isSvg)
                            <!-- Standard image (PNG, JPG) loads normally -->
                            <img src="{{ $url }}" class="logo">
                        @else
                            <!-- SVGs and empty URLs get a clean initial letter block -->
                            <div class="fallback-logo">
                                {{ strtoupper(substr($entry->college, 0, 1)) }}
                            </div>
                        @endif
                    </td>
                    <td class="college-name">{{ $entry->college }}</td>
                    <td>{{ $entry->university }}</td>
                    <td>{{ $entry->location }}</td>
                    <td class="commission">{{ number_format($entry->commission_percentage, 2) }}%</td>
                </tr>
            @endforeach
        </tbody>
    </table>

</body>
</html>