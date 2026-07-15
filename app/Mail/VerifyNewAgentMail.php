<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerifyNewAgentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $verificationUrl,
        public string $agencyName,
        public string $newUserName,
        public string $newUserEmail,
        public string $newUserContact,
        public ?string $recipientName = null,
        public int $expireDays = 7,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New agent pending verification: '.$this->newUserName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verify-new-agent',
            with: [
                'url' => $this->verificationUrl,
                'agencyName' => $this->agencyName,
                'newUserName' => $this->newUserName,
                'newUserEmail' => $this->newUserEmail,
                'newUserContact' => $this->newUserContact,
                'recipientName' => $this->recipientName,
                'expireDays' => $this->expireDays,
            ],
        );
    }
}