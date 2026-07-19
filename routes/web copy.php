<?php


use App\Http\Controllers\AgencySurveyApiController;

use App\Http\Controllers\InstitutionalSurveyController;

use App\Http\Controllers\SurveyApiController;
use App\Http\Controllers\UniversityApiControler; // Note: verify spelling (Controler vs Controller)

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::inertia('/', 'auth/login')->name('home');
Route::post('/api/survey', [SurveyApiController::class, 'store']);
Route::get('/course-details/{courseDetail:uuid}', [CourseDetailController::class, 'coursedetails'])->name('coursedetails');

/*
|--------------------------------------------------------------------------
| Protected Routes (Authenticated & Verified)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Web & Inertia View Routes
    |--------------------------------------------------------------------------
    */

    // Surveys
    Route::inertia('/online/survey', 'survey/survey')->name('survey');
    Route::inertia('/survey', 'survey/surveyindex')->name('surveyindex');
    Route::inertia('/agency/survey', 'survey/agent/agencysurveyindex')->name('agencysurveyindex');
    Route::inertia('/institutional-survey', 'survey/institutional/InstitutionalSurveyIndex');

    // Courses
    Route::inertia('/courses', 'university/course/coursesearch')->name('courses');
    Route::get('/courses/{uuid}', [CourseDetailController::class, 'show'])->name('courses.show');
    Route::get('/course/create', [CourseDetailController::class, 'create'])->name('create');
    Route::get('/course-details', [CourseDetailController::class, 'index'])->name('index');
    Route::post('/course-details', [CourseDetailController::class, 'store'])->name('store');
    Route::get('/course-details/{courseDetail:uuid}/edit', [CourseDetailController::class, 'edit'])->name('edit');
    Route::put('/course-details/{courseDetail:uuid}', [CourseDetailController::class, 'update'])->name('update');
    Route::delete('/course-details/{courseDetail:uuid}', [CourseDetailController::class, 'destroy'])->name('destroy');

   
    /*
    |--------------------------------------------------------------------------
    | API Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('api')->group(function () {

        // Universities API
        Route::get('/university', [UniversityApiControler::class, 'index']);
        Route::post('/universities', [UniversityApiControler::class, 'store']);
        Route::get('/universities/{id}', [UniversityApiControler::class, 'show']);
        Route::put('/universities/{id}', [UniversityApiControler::class, 'update']);
        Route::delete('/universities/{id}', [UniversityApiControler::class, 'destroy']);
        Route::get('/university/export', [UniversityApiControler::class, 'export']);
        Route::post('/university/import', [UniversityApiControler::class, 'import']);
        

        // Survey API
        Route::get('/survey', [SurveyApiController::class, 'index']);
        Route::get('/survey/stats', [SurveyApiController::class, 'stats']);
        Route::get('/survey/{id}', [SurveyApiController::class, 'show'])->where('id', '[0-9]+');
        Route::delete('/survey/{id}', [SurveyApiController::class, 'destroy'])->where('id', '[0-9]+');

        // Institutional Surveys API
        Route::get('/institutional-surveys', [InstitutionalSurveyController::class, 'index']);
        Route::post('/institutional-surveys', [InstitutionalSurveyController::class, 'store']);
        Route::delete('/institutional-surveys/{id}', [InstitutionalSurveyController::class, 'destroy']);

        // Agency Survey API
        Route::get('/agency/survey', [AgencySurveyApiController::class, 'index']);
        Route::post('/agency/survey', [AgencySurveyApiController::class, 'store']);
        Route::get('/agency/survey/stats', [AgencySurveyApiController::class, 'stats']);
        Route::get('/agency/survey/{survey}', [AgencySurveyApiController::class, 'show']);
        Route::delete('/agency/survey/{survey}', [AgencySurveyApiController::class, 'destroy']);

       

    });
});

require __DIR__.'/settings.php';