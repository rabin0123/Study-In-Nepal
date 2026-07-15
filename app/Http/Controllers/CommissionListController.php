<?php

namespace App\Http\Controllers;

use App\Models\CommissionList;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class CommissionListController extends Controller
{
    // 1. Get all entries
    public function index(Request $request)
    {
        $user = $request->user() ?? auth()->user();

        if (!$user || !$user->hasPermissionTo('view.commission')) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        return response()->json(CommissionList::orderBy('id', 'desc')->get());
    }
    public function commissionindex(Request $request)
    {
        $user = $request->user() ?? auth()->user();

        if (!$user || !$user->hasPermissionTo('view.commissionindex')) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        return response()->json(CommissionList::orderBy('id', 'desc')->get());
    }

    // Get a single entry
    public function show(Request $request, $id)
    {
        $user = $request->user() ?? auth()->user();

        if (!$user || !$user->hasPermissionTo('view.commission')) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        $entry = CommissionList::findOrFail($id);
        return response()->json($entry);
    }

    // 2. Store a new entry
    public function store(Request $request)
    {
        $user = $request->user() ?? auth()->user();

        if (!$user || !$user->hasPermissionTo('create.commission')) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        $validated = $request->validate([
            'university' => 'required|string',
            'college' => 'required|string',
            'location' => 'required|string',
            'college_logo_url' => 'nullable|string',
            'commission_percentage' => 'required|numeric|min:0|max:100',
        ]);

        $entry = CommissionList::create($validated);
        return response()->json(['message' => 'Created successfully', 'data' => $entry]);
    }

    // Update an entry
    public function update(Request $request, $id)
    {
        $user = $request->user() ?? auth()->user();

        if (!$user || !$user->hasPermissionTo('update.commission')) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        $request->validate([
            'commission_percentage' => 'required|numeric|min:0'
        ]);

        $entry = CommissionList::findOrFail($id);
        $entry->update([
            'commission_percentage' => $request->commission_percentage
        ]);

        return response()->json(['message' => 'Updated successfully']);
    }

    // Export PDF
    public function exportPdf(Request $request)
    {
        $user = $request->user() ?? auth()->user();

        if (!$user || !$user->hasPermissionTo('export.commission')) {
            abort(403, 'This action is unauthorized.');
        }

        $entries = CommissionList::orderBy('university')->orderBy('college')->get();

        // Enable remote images so the external logos can be loaded into the PDF
        $pdf = Pdf::setOptions(['isRemoteEnabled' => true])
                  ->loadView('pdf.commissions', compact('entries'));

        return $pdf->download('commission-structure.pdf');
    }

    // 3. Delete an entry
    public function destroy(Request $request, $id)
    {
        $user = $request->user() ?? auth()->user();

        if (!$user || !$user->hasPermissionTo('delete.commission')) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        CommissionList::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    // 4. Export CSV directly from Controller
    public function export(Request $request)
    {
        $user = $request->user() ?? auth()->user();

        if (!$user || !$user->hasPermissionTo('export.commission')) {
            abort(403, 'This action is unauthorized.');
        }

        $entries = CommissionList::all();
        $filename = "commissions.csv";

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['ID', 'University', 'College', 'Location', 'Commission'];

        $callback = function() use($entries, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns); // Add Header row

            foreach ($entries as $entry) {
                fputcsv($file, [
                    $entry->id,
                    $entry->university,
                    $entry->college,
                    $entry->location,
                    $entry->commission_percentage
                ]);
            }
            fclose($file);
        };

        return Response::stream($callback, 200, $headers);
    }

    // 5. Import CSV directly inside Controller
    public function import(Request $request)
    {
        $user = $request->user() ?? auth()->user();

        if (!$user || !$user->hasPermissionTo('import.commission')) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt'
        ]);

        $file = $request->file('file')->getRealPath();
        
        // Read file into an array
        $data = array_map('str_getcsv', file($file));
        
        // Extract the header and convert to lowercase for easy mapping
        $header = array_shift($data);
        $header = array_map('strtolower', $header);

        foreach ($data as $row) {
            // Combine headers with row values to make an associative array
            $rowAssoc = array_combine($header, $row);

            CommissionList::create([
                'university'            => $rowAssoc['university'] ?? null,
                'college'               => $rowAssoc['college'] ?? null,
                'location'              => $rowAssoc['location'] ?? null,
                // Match with whatever your CSV header is named (e.g., 'commission' or 'commission %')
                'commission_percentage' => $rowAssoc['commission'] ?? $rowAssoc['commission_percentage'] ?? 0,
            ]);
        }

        return response()->json(['message' => 'Imported successfully']);
    }
}