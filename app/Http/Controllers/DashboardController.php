<?php

namespace App\Http\Controllers;

use App\Models\StudentApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
   public function index(Request $request): \Illuminate\Http\JsonResponse
{
    $user = $request->user();

    $query = StudentApplication::query();
    $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);

    if (!$isInternalUser) {
        $agencyName = $user->agency_name;
        $query->whereHas('creator', function ($q) use ($agencyName) {
            $q->where('agency_name', $agencyName);
        });
    }

    $totalApplications = (clone $query)->count();
    $processedApplications = (clone $query)->whereIn('status', ['APPROVED', 'REJECTED'])->count();
    $closedApplications = (clone $query)->where('status', 'APPROVED')->count();

    $latestApplications = $query->with('creator')
        ->latest()
        ->limit(5)
        ->get()
        ->map(fn ($app) => [
            'id' => $app->id,
            'app_id' => $app->app_id,
            'student_name' => $app->student_name,
            'university_name' => $app->university_name,
            'college_name' => $app->college_name,
            'course_name' => $app->course_name,
            'status' => $app->status,
            'created_at' => $app->created_at->diffForHumans(),
        ]);

    // Send JSON to useHttp instead of rendering a view
    return response()->json([
        'stats' => [
            'totalApplications' => $totalApplications,
            'processedApplications' => $processedApplications,
            'closedApplications' => $closedApplications,
        ],
        'latestApplications' => $latestApplications,
    ]);
}
}