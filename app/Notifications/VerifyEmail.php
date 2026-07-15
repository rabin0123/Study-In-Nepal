<?php

namespace App\Notifications;

use App\Mail\VerifyEmailMail;
use Illuminate\Auth\Notifications\VerifyEmail as VerifyEmailNotification;
use Illuminate\Mail\Mailable;

class VerifyEmail extends VerifyEmailNotification
{
    /**
     * Get the mail representation of the notification.
     *
     * Returning a Mailable here (instead of a MailMessage) gives full
     * control over the HTML, so we can match the Study in Nepal brand
     * exactly instead of using Laravel's default markdown components.
     */
    public function toMail($notifiable): Mailable
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new VerifyEmailMail($verificationUrl, $notifiable->name ?? null))
            ->to($notifiable->email);
    }
}