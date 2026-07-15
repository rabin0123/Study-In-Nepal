<?php

namespace App\Notifications;

use App\Mail\ApplicationSubmittedMail;
use App\Models\StudentApplication;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class ApplicationSubmitted extends Notification
{
    public function __construct(public StudentApplication $application) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): ApplicationSubmittedMail
    {
        return (new ApplicationSubmittedMail($this->application))
            ->to($notifiable->email);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'application_id' => $this->application->id,
            'student_name'   => $this->application->student_name,
            'avatar_url'     => $this->application->avatar_url,
            'message'        => sprintf(
                'New Application - %s - %s - SIN-%s',
                $this->application->college_name ?: 'N/A',
                $this->application->university_name ?: 'N/A',
                $this->application->id
            ),
        ];
    }

  
}