<?php

namespace App\Http\Controllers;

use App\Models\StudentApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Base query with agency scoping rules (matching your ApiController)
        $query = StudentApplication::query();
        $isInternalUser = $user->hasAnyRole(['developer', 'main-agent', 'main-agent-staff']);

        if (!$isInternalUser) {
            $agencyName = $user->agency_name;
            $query->whereHas('creator', function ($q) use ($agencyName) {
                $q->where('agency_name', $agencyName);
            });
        }

        // 1. Total Applications
        $totalApplications = (clone $query)->count();

        // 2. Processed Applications (Applications that are no longer pending)
        $processedApplications = (clone $query)
            ->whereIn('status', ['APPROVED', 'REJECTED'])
            ->count();

        // 3. Case Closed Applications (For example, Approved applications)
        $closedApplications = (clone $query)
            ->where('status', 'APPROVED')
            ->count();

        // 4. Latest Applications (Retrieve the 5 most recent records)
        $latestApplications = $query->with('creator')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($app) {
                return [
                    'id' => $app->id,
                    'app_id' => $app->app_id,
                    'student_name' => $app->student_name,
                    'university_name' => $app->university_name,
                    'college_name' => $app->college_name,
                    'course_name' => $app->course_name,
                    'status' => $app->status,
                    'created_at' => $app->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalApplications' => $totalApplications,
                'processedApplications' => $processedApplications,
                'closedApplications' => $closedApplications,
            ],
            'latestApplications' => $latestApplications,
        ]);
    }
}