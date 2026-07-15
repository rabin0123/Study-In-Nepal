<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
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

        // Fetch and format the comments/remarks associated with this application
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

        // Append the formatted comments as a dynamic attribute to the model
        $application->setAttribute('comments', $formattedComments);

        $payload = [
            'success' => true,
            'data' => $application,
            'can_manage_assignment' => $canManageAssignment,
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

    public function getComments(StudentApplication $application, Request $request): JsonResponse
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

        return response()->json([
            'success' => true,
            'data' => $formattedComments,
        ]);
    }

    public function getStatuses(): JsonResponse
    {
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

        $formatted = collect(StudentApplication::STATUSES)->map(function ($status) use ($statusMapping) {
            return [
                'value' => $status,
                'label' => $statusMapping[$status]['label'] ?? ucwords(strtolower($status)),
                'color' => $statusMapping[$status]['color'] ?? '#94a3b8',
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $formatted,
        ]);
    }

    /**
     * GET /api/agent/applications/{application}/activities
     */
    public function getActivities(StudentApplication $application, Request $request): JsonResponse
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

        return response()->json([
            'success' => true,
            'data' => $activities,
        ]);
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