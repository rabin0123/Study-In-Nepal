<?php

namespace App\Exceptions;

use Exception;

class ProtectedUserException extends Exception
{
    protected $message = 'This account is protected and cannot be deactivated, deleted, or modified in this way.';

    public function render($request)
    {
        return response()->json([
            'message' => $this->getMessage(),
        ], 403);
    }
}
