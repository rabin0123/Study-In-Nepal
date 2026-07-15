<?php
// app/Notifications/NewApplicationAssigned.php

namespace App\Notifications;

use App\Models\StudentApplication;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;

class NewApplicationAssigned extends Notification
{
    public function __construct(public StudentApplication $application) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'broadcast', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Student Application Assigned: ' . $this->application->student_name)
            ->view('emails.application-assigned', [
                'notifiableName'  => $notifiable->name ?? null,
                'studentName'     => $this->application->student_name,
                'universityName'  => $this->application->university_name,
                'collegeName'     => $this->application->college_name,
                'actionUrl'       => url('/applications/' . $this->application->id),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'application_id'  => $this->application->id,
            'student_name'    => $this->application->student_name,
            'university_name' => $this->application->university_name,
            'avatar_url'     => $this->application->avatar_url,
            'message'         => "New application from {$this->application->student_name} has been assigned to you.",
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}