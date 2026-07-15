<?php

namespace App\Notifications;

use App\Mail\VerifyNewAgentMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerifyNewAgentNotification extends Notification
{
    use Queueable;

    public function __construct(public User $newUser)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Returning a Mailable here (instead of a MailMessage) gives full control
     * over the HTML, matching the Study in Nepal brand the same way
     * App\Notifications\VerifyEmail does for the account email-verification
     * flow — rather than falling back to Laravel's default markdown mail.
     */
    public function toMail(object $notifiable): Mailable
    {
        // Signed, temporary link. Expires in 7 days — long enough that a Main
        // Agent checking email occasionally will still catch it, but bounded
        // so stale links don't linger forever.
        $verifyUrl = URL::temporarySignedRoute(
            'users.manual-verification.show',
            now()->addDays(7),
            ['user' => $this->newUser->getKey()]
        );

        return (new VerifyNewAgentMail(
            verificationUrl: $verifyUrl,
            agencyName: $this->newUser->agency_name,
            newUserName: $this->newUser->name,
            newUserEmail: $this->newUser->email,
            newUserContact: $this->newUser->contact_number,
            recipientName: $notifiable->name ?? null,
            expireDays: 7,
        ))->to($notifiable->email);
    }
}