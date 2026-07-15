<?php

namespace App\Notifications;

use App\Mail\InviteUserMail;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class InviteNewUserNotification extends Notification
{
    use Queueable;

    public function __construct(public string $token) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $url = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        return (new InviteUserMail($url, $notifiable->name))->to($notifiable->email);
    }
}