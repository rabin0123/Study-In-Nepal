<?php

namespace App\Http\Controllers;

use App\Models\University;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory; 
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class UniversityApiControler extends Controller
{
    public function index(): JsonResponse
    {
        $data = University::all();
        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'universityName'                  => 'required|string|max:255',
            'level'                           => 'required|string|max:255',
            'intake'                          => 'required|string|max:20',
            'colleges'                        => 'required|array|min:1',
            'colleges.*.name'                 => 'required|string|max:255',
            'universityLogoUrl'               => 'nullable|url|max:500',
            'colleges.*.logoUrl'              => 'nullable|url|max:500',
            'colleges.*.location'             => 'required|string|max:255',
            'colleges.*.courses'              => 'required|array|min:1',
            'colleges.*.courses.*.courseName'  => 'required|string|max:255',
            'colleges.*.courses.*.stream'      => 'required|string|max:255',
            'colleges.*.courses.*.annualFee'   => 'nullable|string|max:100',
            'colleges.*.courses.*.scholarship' => 'nullable|string|max:255',
            'colleges.*.courses.*.allDocs'     => 'nullable|array',
            'colleges.*.courses.*.allDocs.*'   => 'string|max:255',
        ]);

        $results = [];

        // Save a record for each course nested under each college
        foreach ($validated['colleges'] as $college) {
            foreach ($college['courses'] as $course) {
                $university = University::create([
                    'University'         => $validated['universityName'],
                    'level'              => $validated['level'],
                    'Intake'             => $validated['intake'],
                    'university_logo_url' => $validated['universityLogoUrl'] ?? null,
                    'college_logo_url'    => $college['logoUrl'] ?? null,
                    'College'            => $college['name'],
                    'Location'           => $college['location'],
                    'Course'             => $course['courseName'],
                    'stream'             => $course['stream'],
                    'Amount'             => $course['annualFee'] ?? null,
                    'Scholarship'        => $course['scholarship'] ?? null,
                    'requireddocuments'  => isset($course['allDocs'])
                                                ? implode(', ', $course['allDocs'])
                                                : null,
                ]);

                $results[] = $university;
            }
        }

        return response()->json([
            'message'    => 'University data saved successfully.',
            'total'      => count($results),
            'entries'    => $results,
        ], 201);
    }
    public function update(Request $request, $id): JsonResponse
{
    // Locate the target entry to obtain the old name identifier
    $target = University::findOrFail($id);
    $oldUniversityName = $target->University;

    $validated = $request->validate([
        'universityName'                  => 'required|string|max:255',
        'level'                           => 'required|string|max:255',
        'intake'                          => 'required|string|max:20',
        'colleges'                        => 'required|array|min:1',
        'colleges.*.name'                 => 'required|string|max:255',
        'colleges.*.location'             => 'required|string|max:255',
        'colleges.*.courses'              => 'required|array|min:1',
        'colleges.*.courses.*.courseName'  => 'required|string|max:255',
        'colleges.*.courses.*.stream'      => 'required|string|max:255',
        'colleges.*.courses.*.annualFee'   => 'nullable|string|max:100',
        'colleges.*.courses.*.scholarship' => 'nullable|string|max:255',
        'colleges.*.courses.*.allDocs'     => 'nullable|array',
        'colleges.*.courses.*.allDocs.*'   => 'string|max:255',
    ]);

    DB::transaction(function() use ($oldUniversityName, $validated) {
        // Delete all old rows for this university name to clean up configurations
        University::where('University', $oldUniversityName)->delete();

        // Populate new rows
        foreach ($validated['colleges'] as $college) {
            foreach ($college['courses'] as $course) {
                University::create([
                    'University'         => $validated['universityName'],
                    'level'              => $validated['level'],
                    'Intake'             => $validated['intake'],
                    'College'            => $college['name'],
                    'Location'           => $college['location'],
                    'Course'             => $course['courseName'],
                    'stream'             => $course['stream'],
                    'Amount'             => $course['annualFee'] ?? null,
                    'Scholarship'        => $course['scholarship'] ?? null,
                    'requireddocuments'  => isset($course['allDocs'])
                                                ? implode(', ', $course['allDocs'])
                                                : null,
                ]);
            }
        }
    });

    return response()->json([
        'message' => 'University updated successfully.'
    ]);
}
public function show($id): JsonResponse
{
    // Find the entry that was clicked in the directory
    $entry = University::findOrFail($id);

    // Retrieve all database rows that share the exact same University Name
    $universityRows = University::where('University', $entry->University)
        ->orderBy('College', 'asc')
        ->orderBy('Course', 'asc')
        ->get();

    return response()->json($universityRows);
}
public function destroy($id)
    {
        try {
            $entry = University::find($id);

            if (!$entry) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record not found.'
                ], 404);
            }

            // Deletes the record
            $entry->delete();

            return response()->json([
                'success' => true,
                'message' => 'Record deleted successfully.'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ], 500);
        }
    }

     public function export(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = [
            'Content-type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename=universities_export.csv',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0'
        ];

        $columns = [
    'University', 'university_logo_url', 'level', 'Intake',
    'College', 'college_logo_url', 'Location',
    'Course', 'stream', 'Amount', 'Scholarship', 'requireddocuments'
];

        $callback = function() use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            University::chunk(200, function($records) use ($file) {
                foreach ($records as $record) {
                    fputcsv($file, [
    $record->University,
    $record->university_logo_url,   // ← add
    $record->level,
    $record->Intake,
    $record->College,
    $record->college_logo_url,      // ← add
    $record->Location,
    $record->Course,
    $record->stream,
    $record->Amount,
    $record->Scholarship,
    $record->requireddocuments,
]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

      public function import(Request $request): JsonResponse
    {
        // Support xlsx, xls, csv, and txt formats
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:10240' // max 10MB
        ]);

        $file = $request->file('file');
        $filePath = $file->getRealPath();

        $createdCount = 0;
        $updatedCount = 0;

        DB::beginTransaction();
        try {
            // Load CSV or Excel via PhpSpreadsheet factory
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            
            // Convert worksheet to array of rows
            $rows = $worksheet->toArray();

            if (count($rows) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'The uploaded spreadsheet does not contain enough records to import.'
                ], 400);
            }

            // Extract headers from first row
            $header = array_shift($rows);
            $header = array_map(function($val) {
                return is_null($val) ? '' : trim($val);
            }, $header);

            foreach ($rows as $row) {
                // Skip completely empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                // Match row count to header count
                if (count($row) !== count($header)) {
                    if (count($row) < count($header)) {
                        $row = array_pad($row, count($header), null);
                    } else {
                        $row = array_slice($row, 0, count($header));
                    }
                }
                
                $data = array_combine($header, $row);

                // Skip rows that lack mandatory identifiers
                if (empty($data['University']) || empty($data['Course'])) {
                    continue;
                }

                // Match strictly by University and Course
                $record = University::updateOrCreate(
    [
        'University' => trim($data['University']),
        'Course'     => trim($data['Course']),
    ],
    [
        'level'               => isset($data['level']) ? trim($data['level']) : null,
        'Intake'              => isset($data['Intake']) ? trim($data['Intake']) : null,
        'College'             => isset($data['College']) ? trim($data['College']) : null,
        'Location'            => isset($data['Location']) ? trim($data['Location']) : null,
        'stream'              => isset($data['stream']) ? trim($data['stream']) : null,
        'Amount'              => isset($data['Amount']) ? trim($data['Amount']) : null,
        'Scholarship'         => isset($data['Scholarship']) ? trim($data['Scholarship']) : null,
        'requireddocuments'   => isset($data['requireddocuments']) ? trim($data['requireddocuments']) : null,
        'university_logo_url' => isset($data['university_logo_url']) ? trim($data['university_logo_url']) : null,
        'college_logo_url'    => isset($data['college_logo_url']) ? trim($data['college_logo_url']) : null,
    ]
);
                if ($record->wasRecentlyCreated) {
                    $createdCount++;
                } else {
                    $updatedCount++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "File processed: Created {$createdCount} new records, updated {$updatedCount} existing records."
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse file. Error: ' . $e->getMessage()
            ], 500);
        }
    }

}