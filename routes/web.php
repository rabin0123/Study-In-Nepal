<?php

use App\Http\Controllers\UniversityApiControler;
use App\Http\Controllers\AgencySurveyApiController;
use App\Http\Controllers\InstitutionalSurveyController;
use App\Http\Controllers\StudentApplicationApiController;
use App\Http\Controllers\SurveyApiController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\CommissionListController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AgencyApiController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\UserApiController;
use App\Http\Controllers\Settings\UserVerificationController;

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'auth/login')->name('home');
Route::post('/api/survey', [SurveyApiController::class, 'store']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('universities', 'university/universityentryform')->name('universityentryform');
    Route::inertia('universities/{id}', 'university/universityedit')->name('universityedit');
    Route::inertia('university', 'university/universitylist')->name('universitylist');
    Route::inertia('explorecourses', 'university/coursesearch')->name('coursesearch');
    Route::inertia('/online/survey', 'survey/survey')->name('survey');
    Route::inertia('/agency/survey', 'survey/agent/agencysurveyindex')->name('agencysurveyindex');
   
    Route::inertia('/survey', 'survey/surveyindex')->name('surveyindex');
    Route::inertia('/institutional-survey', 'survey/institutional/InstitutionalSurveyIndex');

    Route::inertia('/applications', 'application/Studentapplicationsindex')->name('Studentapplicationsindex');
    Route::inertia('/applications/create', 'application/Studentapplicationform')->name('Studentapplicationform');
    Route::inertia('/applications/{application}', 'application/StudentApplicationDetail')->name('StudentApplicationDetail');

    Route::inertia('/commissions', 'commission/commissionindex')->name('commissionindex');
    Route::inertia('/commission', 'commission/commissionstructure')->name('commissionstructure');
    Route::inertia('/roles/create', 'roles/RoleCreatePage')->name('RolesCreatePage');
    Route::inertia('courses', 'courses/coursesearch')->name('courses');
    Route::put('/users/{user}/profile-field', [ProfileController::class, 'updateField']);
    Route::get('users', [UserApiController::class, 'index'])->name('users.index');
    Route::patch('/users/{user}/toggle-status', [UserApiController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::delete('/users/{user}', [UserApiController::class, 'destroy'])->name('users.destroy');
    Route::get('users/{user}', [ProfileController::class, 'show']);
    Route::get('/agencies', [AgencyApiController::class, 'index'])->name('agencies.index');
    Route::patch('/agencies/{agency}/toggle-status', [AgencyApiController::class, 'toggleStatus'])->name('agencies.toggle-status');
    Route::patch('/users/{user}/update-role', [UserApiController::class, 'updateRole']);
    Route::get('/agency-users', [AgencyApiController::class, 'users']);
    Route::get('/users/{user}/manual-verification', [UserVerificationController::class, 'show'])
        ->middleware('signed')
        ->name('users.manual-verification.show');
    Route::post('/users/{user}/manual-verification', [UserVerificationController::class, 'verify'])
        ->name('users.manual-verification.verify');
    Route::post('/users/{user}/verify-inline', [UserApiController::class, 'verifyManually'])
        ->name('users.verify-inline');
    Route::put('/users/{user}/verifier-access', [UserApiController::class, 'toggleVerifierAccess'])
        ->name('users.toggle-verifier-access');
        Route::post('/users', [UserApiController::class, 'store'])->name('users.store');

        Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');

        
Route::prefix('api')->middleware(['auth', 'verified'])->group(function () {

    Route::post('/universities', [UniversityApiControler::class, 'store']);
    Route::get('/universities/{id}', [UniversityApiControler::class, 'show']);
    Route::put('/universities/{id}', [UniversityApiControler::class, 'update']);
    Route::get('/university', [UniversityApiControler::class, 'index']);
    Route::delete('/universities/{id}', [UniversityApiControler::class, 'destroy']);
    Route::get('/university/export', [UniversityApiControler::class, 'export']);
    Route::post('/university/import', [UniversityApiControler::class, 'import']);


    Route::get('/survey', [SurveyApiController::class, 'index']);
    Route::get('/survey/stats', [SurveyApiController::class, 'stats']);
    Route::get('/survey/{id}', [SurveyApiController::class, 'show'])->where('id', '[0-9]+');
    Route::delete('/survey/{id}', [SurveyApiController::class, 'destroy'])->where('id', '[0-9]+');

    Route::get('/institutional-surveys', [InstitutionalSurveyController::class, 'index']);
    Route::post('/institutional-surveys', [InstitutionalSurveyController::class, 'store']);
    Route::delete('/institutional-surveys/{id}', [InstitutionalSurveyController::class, 'destroy']);


    
    Route::get('/agency/survey', [AgencySurveyApiController::class, 'index']);
    Route::post('/agency/survey', [AgencySurveyApiController::class, 'store']);
    Route::get('/agency/survey/stats', [AgencySurveyApiController::class, 'stats']);
    Route::get('/agency/survey/{survey}', [AgencySurveyApiController::class, 'show']);
    Route::delete('/agency/survey/{survey}', [AgencySurveyApiController::class, 'destroy']);



Route::post('/agent/applications', [StudentApplicationApiController::class, 'store']);
Route::get('/agent/applications', [StudentApplicationApiController::class, 'index']);
Route::get('/agent/applications/{application}', [StudentApplicationApiController::class, 'show']);
Route::put('/agent/applications/{application}', [StudentApplicationApiController::class, 'update']);
Route::get('/agent/applications/{application}/pdf', [StudentApplicationApiController::class, 'downloadPdf']);
Route::delete('/agent/applications/{application}', [StudentApplicationApiController::class, 'destroy']);
Route::post('/agent/applications/download-zip', [StudentApplicationApiController::class, 'downloadZip']);
Route::post('/agent/applications/{application}/comments', [StudentApplicationApiController::class, 'storeComment']);


Route::put('/agent/applications/{application}/assign', [StudentApplicationApiController::class, 'assign']);

    
    Route::get('/commissions', [CommissionListController::class, 'index']);
    Route::get('/commission', [CommissionListController::class, 'commissionindex']);
    Route::post('/commissions', [CommissionListController::class, 'store']);
    Route::put('/commissions/{id}', [CommissionListController::class, 'update']);
    Route::delete('/commissions/{id}', [CommissionListController::class, 'destroy']);
    Route::get('/commissions-export', [CommissionListController::class, 'export']);
    Route::post('/commissions-import', [CommissionListController::class, 'import']);
    Route::get('/commissions/export-pdf', [CommissionListController::class, 'exportPdf']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::patch('/users/{user}', [UserController::class, 'update']);
    Route::post('/users/{user}/deactivate', [UserController::class, 'deactivate']);
    Route::post('/users/{user}/activate', [UserController::class, 'activate']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::post('/users/{user}/roles', [UserController::class, 'assignRoles']);

    // Roles
    
    Route::post('/roles', [RoleController::class, 'store']);
    Route::patch('/roles/{role}', [RoleController::class, 'update']);
    Route::delete('/roles/{role}', [RoleController::class, 'destroy']);

    // Permissions (read-only — the master list from PermissionSeeder)
    Route::get('/permissions', [PermissionController::class, 'index']);
    


    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);


});
});

require __DIR__.'/settings.php';