<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommissionList extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'university', 
        'college', 
        'location', 
        'college_logo_url',
        'commission_percentage'
    ];
}