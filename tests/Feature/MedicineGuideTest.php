<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MedicineGuideTest extends TestCase
{
    use RefreshDatabase;

    public function test_digit_index_and_brand_cap_work_on_any_database(): void
    {
        $this->seed();

        $this->actingAs(User::where('role', 'pharmacist')->first())
            ->get('/clinical-reference?letter=%23')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('brands_total'));
    }
}
