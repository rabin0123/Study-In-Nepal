<?php

namespace App\Mail;

use App\Models\StudentApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public StudentApplication $application) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: sprintf(
                'New Application - %s - %s - %s - SIN-%s',
                $this->application->student_name,
                $this->application->college_name ?: 'N/A',
                $this->application->university_name ?: 'N/A',
                $this->application->app_id
            ),
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.app-submit',
        );
    }
}