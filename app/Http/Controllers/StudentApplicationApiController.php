<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudentApplicationRequest;
use App\Models\StudentApplication;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Spatie\Activitylog\Models\Activity;
use ZipArchive;

class StudentApplicationApiController extends Controller
{
    private function logActivity($causer, $subject, string $description, array $properties = []): void
    {
        try {
            activity()
                ->performedOn($subject)
                ->causedBy($causer)
                ->withProperties($properties)
                ->log($description);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Activity log failed: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            if (app()->environment(['local', 'testing'])) {
                throw $e;
            }
        }
    }

    /**
     * GET /api/agent/applications
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user() ?? auth()->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if (!$user->hasPermissionTo('view.application')) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 500));

        $query = StudentApplication::query()->with('creator');

        // Check if the user is an internal staff/developer member to bypass agency restrictions
        $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);

        if (!$isInternalUser) {
            $agencyName = $user->agency_name;
            $query->whereHas('creator', function ($query) use ($agencyName) {
                $query->where('agency_name', $agencyName);
            });
        }

        $applications = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $applications,
        ]);
    }

    /**
     * GET /api/agent/applications/search-students?q=...
     *
     * Live search for existing students (StudentApplication records) by
     * student_name or app_id, so an agent can pick an existing student
     * and apply them to a new university/college/course.
     *
     * Scoped to the same agency-visibility rules as index().
     */
    public function searchStudents(Request $request): JsonResponse
    {
        $user = $request->user() ?? auth()->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if (!$user->hasPermissionTo('view.application')) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $validated = $request->validate([
            'q' => 'required|string|min:1|max:255',
        ]);

        $q = trim($validated['q']);

        $query = StudentApplication::query()->with('creator');

        $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);

        if (!$isInternalUser) {
            $agencyName = $user->agency_name;
            $query->whereHas('creator', function ($query) use ($agencyName) {
                $query->where('agency_name', $agencyName);
            });
        }

        $query->where(function ($sub) use ($q) {
            $sub->where('student_name', 'like', "%{$q}%")
                ->orWhere('app_id', 'like', "%{$q}%");
        });

        // Since each student can have multiple application rows (one per
        // course/university applied to), de-duplicate to one result per
        // student by picking their most recently updated record.
        $matches = $query->latest('updated_at')->limit(50)->get();

        $seen = [];
        $results = [];

        foreach ($matches as $application) {
            // app_id identifies the student across their applications.
            $key = $application->app_id;

            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;

            $results[] = [
                'id' => $application->id,
                'app_id' => $application->app_id,
                'student_name' => $application->student_name,
                'email' => $application->email,
                'phone_number' => $application->phone_number,
                'country' => $application->country,
                'avatar_url' => $application->avatar_url,
                'university_name' => $application->university_name,
                'college_name' => $application->college_name,
                'course_name' => $application->course_name,
                'status' => $application->status,
            ];

            if (count($results) >= 20) {
                break;
            }
        }

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * POST /api/agent/applications/{application}/apply-to-course
     *
     * Given an existing student's application record (found via
     * searchStudents), create a NEW StudentApplication that carries over
     * all of that student's profile fields, but targets the given
     * university/college/course. This represents the student applying to
     * an additional program.
     */
    public function applyToCourse(Request $request, StudentApplication $application): JsonResponse
    {
        $user = $request->user() ?? auth()->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if (!$user->hasPermissionTo('create.application')) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);

        if (!$isInternalUser && $application->creator->agency_name !== $user->agency_name) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $validated = $request->validate([
            'university_name' => 'required|string|max:255',
            'college_name' => 'required|string|max:255',
            'course_name' => 'required|string|max:255',
        ]);

        // Prevent an accidental duplicate: same student, same course/college/university.
        $duplicate = StudentApplication::where('app_id', $application->app_id)
            ->where('university_name', $validated['university_name'])
            ->where('college_name', $validated['college_name'])
            ->where('course_name', $validated['course_name'])
            ->exists();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'This student already has an application for this course at this college.',
            ], 422);
        }

        $assignedUser = \App\Models\User::mainAgents()->inRandomOrder()->first();

        // Carry over every available student profile field, then overwrite
        // the study-plan fields with the newly selected course details.
        $carriedOverData = collect($application->only([
            'student_name',
            'phone_number',
            'email',
            'country',
            'date_of_birth',
            'passport_number',
            'address_line_1',
            'address_line_2',
            'city',
            'state_province_region',
            'postal_code',
            'agency_reference_notes',
        ]))->toArray();

        // Keep the same app_id so this new row is recognized as belonging
        // to the same student across their multiple course applications.
        $newApplication = StudentApplication::create($carriedOverData + [
            'app_id'          => $application->app_id,
            'university_name' => $validated['university_name'],
            'college_name'    => $validated['college_name'],
            'course_name'     => $validated['course_name'],
            'status'          => StudentApplication::STATUSES[0],
            'created_by'      => $user->id,
            'assigned_to'     => $assignedUser?->id,
            'ip_address'      => $request->ip(),
            'user_agent'      => (string) $request->userAgent(),
        ]);

        // The boot() creating hook overwrites app_id with a freshly
        // generated one, so re-apply the student's original app_id and save.
        $newApplication->app_id = $application->app_id;
        $newApplication->save();

        $this->logActivity(
            $user,
            $newApplication,
            "applied existing student '{$newApplication->student_name}' ({$newApplication->app_id}) to '{$validated['course_name']}' at '{$validated['college_name']}'",
            [
                'action' => 'created_application',
                'old'    => null,
                'new'    => [
                    'student_name'    => $newApplication->student_name,
                    'app_id'          => $newApplication->app_id,
                    'university_name' => $newApplication->university_name,
                    'college_name'    => $newApplication->college_name,
                    'course_name'     => $newApplication->course_name,
                    'status'          => $newApplication->status,
                    'assigned_to'     => $assignedUser?->id,
                ],
            ]
        );

        $user->notify(new \App\Notifications\ApplicationSubmitted($newApplication));

        if ($assignedUser) {
            $assignedUser->notify(new \App\Notifications\NewApplicationAssigned($newApplication));
        } else {
            \Illuminate\Support\Facades\Log::warning(
                'No main_agent/main_agent_staff user available to assign application ' . $newApplication->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Student applied to course successfully.',
            'data' => $newApplication->load('creator', 'assignedAgent'),
        ], 201);
    }

    /**
     * GET /api/agent/applications/{application}
     */
    public function show(StudentApplication $application, Request $request): JsonResponse
    {
        $user = $request->user() ?? auth()->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if (!$user->hasPermissionTo('view.application')) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);

        if (!$isInternalUser && $application->creator->agency_name !== $user->agency_name) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $canManageAssignment = $user->hasAnyRole(['main-agent', 'main-agent-staff', 'developer']);

        $application->load('creator');

        if ($canManageAssignment) {
            $application->load('assignedAgent');
        } else {
            $application->setRelation('assignedAgent', null);
            $application->makeHidden(['assigned_to']);
        }

        // 1. Fetch and format the comments
        $remarks = $application->remarks()->with('user')->get();
        $formattedComments = $remarks->map(function ($remark) {
            return [
                'id' => $remark->id,
                'avatar_url' => $remark->user ? $remark->user->avatar_url : asset('assets/avatar/default.jpg'), 
                'application_id' => $remark->student_application_id,
                'author_name' => $remark->user ? $remark->user->name : 'Unknown',
                'author_id' => $remark->user_id,
                'comment' => $remark->comment,
                'created_at' => $remark->created_at->toIso8601String(),
            ];
        });
        $application->setAttribute('comments', $formattedComments);

        // 2. Fetch and format the activities
        $activities = Activity::where('subject_type', StudentApplication::class)
            ->where('subject_id', $application->id)
            ->with('causer')
            ->latest()
            ->get()
            ->map(function (Activity $activity) {
                $action = $activity->properties['action'] ?? null;

                $type = 'update';
                if ($action === 'created_application') {
                    $type = 'creation';
                } elseif ($action === 'updated_status') {
                    $type = 'status_change';
                }

                return [
                    'id' => $activity->id,
                    'type' => $type,
                    'description' => $activity->description,
                    'user_name' => $activity->causer ? $activity->causer->name : 'System',
                    'created_at' => $activity->created_at->toIso8601String(),
                    'old' => $activity->properties['old'] ?? null,
                    'new' => $activity->properties['new'] ?? null,
                ];
            });
        $application->setAttribute('activities', $activities);

        // 3. Format status mapping configurations
        $statusMapping = [
            'PENDING REVIEW' => [
                'label' => 'Pending Review',
                'color' => '#fbbf24',
            ],
            'APPROVED' => [
                'label' => 'Approved',
                'color' => '#22c55e',
            ],
            'REJECTED' => [
                'label' => 'Rejected',
                'color' => '#ef4444',
            ],
        ];

        $statuses = collect(StudentApplication::STATUSES)->map(function ($status) use ($statusMapping) {
            return [
                'value' => $status,
                'label' => $statusMapping[$status]['label'] ?? ucwords(strtolower($status)),
                'color' => $statusMapping[$status]['color'] ?? '#94a3b8',
            ];
        })->values();

        $payload = [
            'success' => true,
            'data' => $application,
            'can_manage_assignment' => $canManageAssignment,
            'statuses' => $statuses,
        ];

        if ($canManageAssignment) {
            $payload['assignable_users'] = \App\Models\User::mainAgents()
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get();
        }

        return response()->json($payload);
    }

    /**
     * POST /api/agent/applications
     */
    public function store(StoreStudentApplicationRequest $request): JsonResponse
    {
        $user = $request->user() ?? auth()->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if (!$user->hasPermissionTo('create.application')) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $assignedUser = \App\Models\User::mainAgents()->inRandomOrder()->first();

        $application = StudentApplication::create($request->validated() + [
            'created_by'  => $user->id,
            'assigned_to' => $assignedUser?->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => (string) $request->userAgent(),
        ]);

        $this->logActivity(
            $user,
            $application,
            "created a new application for '{$application->student_name}'",
            [
                'action' => 'created_application',
                'old'    => null,
                'new'    => [
                    'student_name'    => $application->student_name,
                    'email'           => $application->email,
                    'country'         => $application->country,
                    'status'          => $application->status,
                    'assigned_to'     => $assignedUser?->id,
                ],
            ]
        );

        $user->notify(new \App\Notifications\ApplicationSubmitted($application));

        if ($assignedUser) {
            $assignedUser->notify(new \App\Notifications\NewApplicationAssigned($application));
        } else {
            \Illuminate\Support\Facades\Log::warning(
                'No main_agent/main_agent_staff user available to assign application ' . $application->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Application submitted successfully.',
            'data' => $application->load('creator', 'assignedAgent'),
        ], 201);
    }

    /**
     * PUT /api/agent/applications/{application}
     */
    public function update(Request $request, StudentApplication $application): JsonResponse
    {
        $user = $request->user() ?? auth()->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);

        if (!$isInternalUser && $application->creator->agency_name !== $user->agency_name) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $validated = $request->validate([
            'student_name' => 'sometimes|nullable|string|max:255',
            'email' => 'sometimes|nullable|email|max:255',
            'passport_number' => 'sometimes|nullable|string|max:100',
            'date_of_birth' => 'sometimes|nullable|date',
            'phone_number' => 'sometimes|nullable|string|max:50',
            'country' => 'sometimes|nullable|string|max:100',
            'address' => 'sometimes|nullable|string|max:500',
            'university_name' => 'sometimes|nullable|string|max:255',
            'college_name' => 'sometimes|nullable|string|max:255',
            'course_name' => 'sometimes|nullable|string|max:255',
            'agency_reference_notes' => 'sometimes|nullable|string|max:1000',
            'status'                 => ['sometimes', Rule::in(StudentApplication::STATUSES)],
        ]);

        // Evaluate updates to determine appropriate permission level
        $updatingStatus = array_key_exists('status', $validated);
        $updatingFields = collect($validated)->except('status')->isNotEmpty();

        if ($updatingStatus && !$user->hasPermissionTo('update.applicationstatus')) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized (missing status update permissions).'
            ], 403);
        }

        if ($updatingFields && !$user->hasPermissionTo('update.application')) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized (missing record update permissions).'
            ], 403);
        }

        if (array_key_exists('address', $validated)) {
            $validated['address_line_1'] = $validated['address'];
            $validated['address_line_2'] = null;
            $validated['city'] = null;
            $validated['state_province_region'] = null;
            $validated['postal_code'] = null;
            unset($validated['address']);
        }

        $oldValues = [];
        foreach ($validated as $field => $newValue) {
            $oldValues[$field] = $application->{$field} ?? null;
        }

        $application->update($validated);
        $application->refresh();

        if ($updatingStatus && (string) ($oldValues['status'] ?? '') !== (string) $validated['status']) {
            $this->logActivity(
                $user,
                $application,
                "changed status for '{$application->student_name}' from '{$oldValues['status']}' to '{$validated['status']}'",
                [
                    'action' => 'updated_status',
                    'old'    => ['status' => $oldValues['status']],
                    'new'    => ['status' => $validated['status']],
                ]
            );
        }

        $fieldLabels = [
            'student_name' => 'Student Name',
            'email' => 'Email Address',
            'passport_number' => 'Passport Number',
            'date_of_birth' => 'Date of Birth',
            'phone_number' => 'Phone',
            'country' => 'Country',
            'address_line_1' => 'Address',
            'university_name' => 'University Placement',
            'college_name' => 'College Placement',
            'course_name' => 'Course / Program',
            'agency_reference_notes' => 'Reference Notes',
        ];

        $otherFields = array_diff(array_keys($validated), ['status']);
        $changedOtherFields = array_values(array_filter(
            $otherFields,
            fn ($field) => (string) ($oldValues[$field] ?? '') !== (string) $validated[$field]
        ));

        if (!empty($changedOtherFields)) {
            $changedLabels = array_map(fn ($f) => $fieldLabels[$f] ?? $f, $changedOtherFields);

            $this->logActivity(
                $user,
                $application,
                "updated " . implode(', ', $changedLabels) . " for '{$application->student_name}'",
                [
                    'action' => 'updated_application_field',
                    'fields' => $changedOtherFields,
                    'old'    => array_intersect_key($oldValues, array_flip($changedOtherFields)),
                    'new'    => array_intersect_key($validated, array_flip($changedOtherFields)),
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Application record updated successfully.',
            'data' => $application->load('creator'),
        ]);
    }

    /**
     * DELETE /api/agent/applications/{application}
     */
    public function destroy(StudentApplication $application, Request $request): JsonResponse
    {
        $user = $request->user() ?? auth()->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if (!$user->hasPermissionTo('delete.application')) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);

        if (!$isInternalUser && $application->creator->agency_name !== $user->agency_name) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $this->logActivity(
            $user,
            $application,
            "deleted the application for '{$application->student_name}'",
            [
                'action' => 'deleted_application',
                'old'    => [
                    'student_name' => $application->student_name,
                    'email'        => $application->email,
                    'country'      => $application->country,
                    'status'       => $application->status,
                    'assigned_to'  => $application->assigned_to,
                ],
                'new' => null,
            ]
        );

        $application->delete();

        return response()->json([
            'success' => true,
            'message' => 'Application deleted.',
        ]);
    }

    /**
     * GET /api/agent/applications/{application}/pdf
     */
    public function downloadPdf(StudentApplication $application, Request $request): Response
    {
        $user = $request->user() ?? auth()->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        if (!$user->hasPermissionTo('download.application')) {
            abort(403, 'This action is unauthorized.');
        }

        $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);

        if (!$isInternalUser && $application->creator->agency_name !== $user->agency_name) {
            abort(403, 'This action is unauthorized.');
        }

        $application->load('creator');

        $pdf = Pdf::loadView('student-application-pdf', [
            'application' => $application,
        ])->setPaper('a4', 'portrait');

        $filename = sprintf(
            '%s-application-%s.pdf',
            str()->slug($application->student_name),
            $application->id
        );

        return $pdf->download($filename);
    }

    public function downloadZip(Request $request): BinaryFileResponse
    {
        $user = $request->user() ?? auth()->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        if (!$user->hasPermissionTo('export.application')) {
            abort(403, 'This action is unauthorized.');
        }

        $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:student_applications,id',
        ]);

        $ids = $request->input('ids');
        $applications = StudentApplication::whereIn('id', $ids)->get();

        foreach ($applications as $application) {
            if (!$isInternalUser && $application->creator->agency_name !== $user->agency_name) {
                abort(403, 'This action is unauthorized.');
            }
        }

        $zipFileName = 'student-applications-' . time() . '.zip';
        $zipPath = storage_path($zipFileName);

        $zip = new ZipArchive();

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            foreach ($applications as $application) {
                $pdf = Pdf::loadView('student-application-pdf', [
                    'application' => $application,
                ])->setPaper('a4', 'portrait');

                $filename = sprintf(
                    '%s-application-%s.pdf',
                    str()->slug($application->student_name),
                    $application->id
                );

                $pdfContent = $pdf->output();
                $zip->addFromString($filename, $pdfContent);
            }
            $zip->close();
        }

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

    public function storeComment(Request $request, StudentApplication $application): JsonResponse
    {
        $user = $request->user() ?? auth()->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if (!$user->hasPermissionTo('update.application')) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);

        if (!$isInternalUser && $application->creator->agency_name !== $user->agency_name) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        $remark = $application->remarks()->create([
            'comment' => $validated['comment'],
            'user_id' => $user->id,
        ]);

        $remark->load('user');

        $this->logActivity(
            $user,
            $application,
            "added a remark on the application for '{$application->student_name}'",
            [
                'action'     => 'added_remark',
                'comment_id' => $remark->id,
                'old'        => null,
                'new'        => ['comment' => $remark->comment],
            ]
        );

        $formattedComment = [
            'id' => $remark->id,
             'avatar_url' => $remark->user ? $remark->user->avatar_url : null, 
            'application_id' => $remark->student_application_id,
            'author_name' => $remark->user ? $remark->user->name : 'Unknown',
            'author_id' => $remark->user_id,
            'comment' => $remark->comment,
            'created_at' => $remark->created_at->toIso8601String(),
        ];

        return response()->json([
            'success' => true,
            'data' => $formattedComment,
        ], 201);
    }

    /**
     * PUT /api/agent/applications/{application}/assign
     */
    public function assign(Request $request, StudentApplication $application): JsonResponse
    {
        $user = $request->user() ?? auth()->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (!$user->hasPermissionTo('update.application')) {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized.'
            ], 403);
        }

        $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);
        $isCurrentAssignee = $application->assigned_to === $user->id;

        if (!$isInternalUser && !$isCurrentAssignee) {
            return response()->json([
                'success' => false,
                'message' => 'Only the currently assigned agent can reassign this application.'
            ], 403);
        }

        $validated = $request->validate([
            'assigned_to' => ['required', 'integer', Rule::exists('users', 'id')],
        ]);

        $newAssignee = \App\Models\User::mainAgents()->whereKey($validated['assigned_to'])->first();
        if (!$newAssignee) {
            return response()->json([
                'success' => false,
                'message' => 'Selected user is not eligible to be assigned applications.'
            ], 422);
        }

        $oldAssignee = $application->assignedAgent;

        $application->update(['assigned_to' => $newAssignee->id]);
        $application->refresh();

        $this->logActivity(
            $user,
            $application,
            "reassigned '{$application->student_name}' from " . ($oldAssignee?->name ?? 'Unassigned') . " to '{$newAssignee->name}'",
            [
                'action' => 'reassigned_application',
                'old'    => [
                    'assigned_to'   => $oldAssignee?->id,
                    'assigned_name' => $oldAssignee?->name,
                ],
                'new' => [
                    'assigned_to'   => $newAssignee->id,
                    'assigned_name' => $newAssignee->name,
                ],
            ]
        );

        $newAssignee->notify(new \App\Notifications\NewApplicationAssigned($application));

        return response()->json([
            'success' => true,
            'message' => "Application reassigned to {$newAssignee->name}.",
            'data' => $application->load('creator', 'assignedAgent'),
        ]);
    }
}