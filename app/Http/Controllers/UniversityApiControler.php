<?php

namespace App\Http\Controllers;

use App\Models\University;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class UniversityApiControler extends Controller
{

    public function index(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 200);
        $limit = max(1, min($limit, 200));

        $query = University::query()
            ->leftJoin('course_details', function ($join) {
                $join->on('universities.University', '=', 'course_details.university_name')
                     ->on('universities.College', '=', 'course_details.college_name')
                     ->on('universities.Course', '=', 'course_details.course_name');
            })
            ->select('universities.*', 'course_details.uuid as course_detail_uuid');

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('universities.University', 'LIKE', "%{$search}%")
                  ->orWhere('universities.College', 'LIKE', "%{$search}%")
                  ->orWhere('universities.Course', 'LIKE', "%{$search}%")
                  ->orWhere('universities.Location', 'LIKE', "%{$search}%")
                  ->orWhere('universities.stream', 'LIKE', "%{$search}%")
                  ->orWhere('universities.level', 'LIKE', "%{$search}%")
                  ->orWhere('universities.Intake', 'LIKE', "%{$search}%");
            });
        }

        $filterMap = [
            'level'      => 'universities.level',
            'stream'     => 'universities.stream',
            'course'     => 'universities.Course',
            'university' => 'universities.University',
            'college'    => 'universities.College',
            'location'   => 'universities.Location',
        ];

        foreach ($filterMap as $param => $column) {
            $values = $request->query($param);
            if (!empty($values)) {
                $query->whereIn($column, (array) $values);
            }
        }

        $paginated = $query
            ->orderBy('universities.id')
            ->cursorPaginate(
                $limit,
                ['*'],
                'cursor',
                $request->query('cursor')
            );

        return response()->json([
            'data'        => $paginated->items(),
            'next_cursor' => optional($paginated->nextCursor())->encode(),
            'has_more'    => $paginated->hasMorePages(),
        ]);
    }

    public function coursedetailscreate(): JsonResponse
    {
        $data = University::leftJoin('course_details', function ($join) {
                $join->on('universities.University', '=', 'course_details.university_name')
                     ->on('universities.College', '=', 'course_details.college_name')
                     ->on('universities.Course', '=', 'course_details.course_name');
            })
            ->select('universities.*', 'course_details.uuid as course_detail_uuid')
            ->get();

        return response()->json($data);
    }

    public function filterOptions(): JsonResponse
    {
        return response()->json(
            Cache::remember('university_filter_options', 60, function () {
                return [
                    'levels'       => University::query()->distinct()->orderBy('level')->pluck('level')->filter()->values(),
                    'streams'      => University::query()->distinct()->orderBy('stream')->pluck('stream')->filter()->values(),
                    'courses'      => University::query()->distinct()->orderBy('Course')->pluck('Course')->filter()->values(),
                    'universities' => University::query()->distinct()->orderBy('University')->pluck('University')->filter()->values(),
                    'colleges'     => University::query()->distinct()->orderBy('College')->pluck('College')->filter()->values(),
                    'locations'    => University::query()->distinct()->orderBy('Location')->pluck('Location')->filter()->values(),
                ];
            })
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'universityName'                  => 'required|string|max:255',
            'level'                           => 'required|string|max:255',
            'intake'                          => 'required|string|max:255',
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
                
                if (method_exists($university, 'linkMatchingCourseDetail')) {
                    $university->linkMatchingCourseDetail();
                }

                $results[] = $university;
            }
        }

        Cache::forget('university_filter_options');

        return response()->json([
            'message'    => 'University data saved successfully.',
            'total'      => count($results),
            'entries'    => $results,
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $target = University::findOrFail($id);
        $oldUniversityName = $target->University;

        $validated = $request->validate([
            'universityName'                  => 'required|string|max:255',
            'level'                           => 'required|string|max:255',
            'intake'                          => 'required|string|max:255',
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

        $firstNewId = null; // Track the newly generated row ID

        DB::transaction(function() use ($oldUniversityName, $validated, &$firstNewId) {
            University::where('University', $oldUniversityName)->delete();

            foreach ($validated['colleges'] as $college) {
                foreach ($college['courses'] as $course) {
                    $u = University::create([
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
                    
                    if (method_exists($u, 'linkMatchingCourseDetail')) {
                        $u->linkMatchingCourseDetail();
                    }
                    
                    // Capture the ID of the first newly generated record
                    if (!$firstNewId) {
                        $firstNewId = $u->id;
                    }
                }
            }
        });

        Cache::forget('university_filter_options');

        return response()->json([
            'message' => 'University updated successfully.',
            'new_id'  => $firstNewId // Pass this back to frontend
        ]);
    }

    public function show($id): JsonResponse
    {
        $entry = University::findOrFail($id);

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

            $entry->delete();

            Cache::forget('university_filter_options');

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
                        $record->university_logo_url,
                        $record->level,
                        $record->Intake,
                        $record->College,
                        $record->college_logo_url,
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
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:10240'
        ]);

        $file = $request->file('file');
        $filePath = $file->getRealPath();

        $createdCount = 0;
        $updatedCount = 0;

        DB::beginTransaction();
        try {
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            if (count($rows) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'The uploaded spreadsheet does not contain enough records to import.'
                ], 400);
            }

            $header = array_shift($rows);
            $header = array_map(function($val) {
                return is_null($val) ? '' : trim($val);
            }, $header);

            foreach ($rows as $row) {
                if (empty(array_filter($row))) {
                    continue;
                }

                if (count($row) !== count($header)) {
                    if (count($row) < count($header)) {
                        $row = array_pad($row, count($header), null);
                    } else {
                        $row = array_slice($row, 0, count($header));
                    }
                }

                $data = array_combine($header, $row);

                if (empty($data['University']) || empty($data['Course'])) {
                    continue;
                }

                $record = University::updateOrCreate(
                    [
                        'University' => trim($data['University']),
                        'College'     => trim($data['College']),
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
                
                if (method_exists($record, 'linkMatchingCourseDetail')) {
                    $record->linkMatchingCourseDetail();
                }

                if ($record->wasRecentlyCreated) {
                    $createdCount++;
                } else {
                    $updatedCount++;
                }
            }

            DB::commit();

            Cache::forget('university_filter_options');

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