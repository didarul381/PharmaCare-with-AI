<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role, array $attributes = []): User
    {
        return User::create(array_merge([
            'name' => ucfirst($role).' User',
            'email' => $role.'-'.uniqid().'@example.test',
            'password' => Hash::make('correct-horse-battery'),
            'role' => $role,
            'is_active' => true,
        ], $attributes));
    }

    public function test_user_can_log_in_with_correct_password(): void
    {
        $user = $this->makeUser('pharmacist');

        $this->post('/login', ['email' => $user->email, 'password' => 'correct-horse-battery'])
            ->assertRedirect('/');

        $this->assertAuthenticatedAs($user);
    }

    public function test_default_demo_password_is_not_a_master_key(): void
    {
        $user = $this->makeUser('super_admin');

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_deactivated_staff_cannot_log_in(): void
    {
        $user = $this->makeUser('cashier', ['is_active' => false]);

        $this->post('/login', ['email' => $user->email, 'password' => 'correct-horse-battery'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_deactivated_staff_are_signed_out_mid_session(): void
    {
        $user = $this->makeUser('cashier', ['is_active' => false]);

        $this->actingAs($user)->get('/pos')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_login_is_rate_limited(): void
    {
        $user = $this->makeUser('cashier');

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', ['email' => $user->email, 'password' => 'wrong']);
        }

        $this->post('/login', ['email' => $user->email, 'password' => 'correct-horse-battery'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    /**
     * @return array<string, array{string, string, int}>
     */
    public static function moduleMatrix(): array
    {
        return [
            'cashier → POS' => ['cashier', '/pos', 200],
            'cashier → invoices' => ['cashier', '/invoices', 200],
            'cashier → staff' => ['cashier', '/users', 403],
            'cashier → settings' => ['cashier', '/settings', 403],
            'cashier → inventory' => ['cashier', '/inventory', 403],
            'cashier → reports' => ['cashier', '/reports', 403],
            'inventory manager → inventory' => ['inventory_manager', '/inventory', 200],
            'inventory manager → POS' => ['inventory_manager', '/pos', 403],
            'pharmacist → prescriptions' => ['pharmacist', '/prescriptions', 200],
            'pharmacist → staff' => ['pharmacist', '/users', 403],
            'super admin → staff' => ['super_admin', '/users', 200],
            'super admin → settings' => ['super_admin', '/settings', 200],
        ];
    }

    #[DataProvider('moduleMatrix')]
    public function test_role_based_module_access_is_enforced_on_the_server(string $role, string $path, int $status): void
    {
        $this->actingAs($this->makeUser($role))->get($path)->assertStatus($status);
    }

    public function test_cashier_cannot_create_staff_accounts_via_direct_request(): void
    {
        $this->actingAs($this->makeUser('cashier'))
            ->post('/users', [
                'name' => 'Intruder', 'email' => 'intruder@example.test',
                'password' => 'secret-password', 'role' => 'super_admin',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('users', ['email' => 'intruder@example.test']);
    }

    public function test_role_switcher_is_disabled_outside_demo_mode(): void
    {
        config(['pharmacare.demo_mode' => false]);
        $this->makeUser('super_admin');

        $this->actingAs($this->makeUser('cashier'))
            ->post('/switch-role', ['role' => 'super_admin'])
            ->assertNotFound();
    }

    public function test_role_switcher_works_in_demo_mode(): void
    {
        config(['pharmacare.demo_mode' => true]);
        $admin = $this->makeUser('super_admin');

        $this->actingAs($this->makeUser('cashier'))
            ->post('/switch-role', ['role' => 'super_admin'])
            ->assertRedirect('/');

        $this->assertAuthenticatedAs($admin);
    }

    public function test_demo_mode_blocks_destructive_actions(): void
    {
        config(['pharmacare.demo_mode' => true]);
        $admin = $this->makeUser('super_admin');
        $victim = $this->makeUser('cashier');

        $this->actingAs($admin)
            ->from('/users')
            ->delete("/users/{$victim->id}", [], ['X-Inertia' => 'true'])
            ->assertRedirect('/users')
            ->assertSessionHas('warning');

        $this->assertTrue($victim->fresh()->is_active);
    }

    public function test_ai_key_cannot_inject_extra_env_lines(): void
    {
        $this->actingAs($this->makeUser('pharmacist'))
            ->postJson('/prescriptions/save-ai-key', ['gemini_api_key' => "abc\nAPP_DEBUG=true"])
            ->assertUnprocessable();
    }
}
