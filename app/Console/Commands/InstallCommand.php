<?php

namespace App\Console\Commands;

use App\Models\StoreSetting;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoSalesSeeder;
use Database\Seeders\MasterDataSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\password;
use function Laravel\Prompts\select;
use function Laravel\Prompts\text;

class InstallCommand extends Command
{
    protected $signature = 'pharmacare:install
        {--demo : Load the full demo dataset (sample staff, medicines and 30 days of sales)}
        {--store-name= : Pharmacy name shown on screens and receipts}
        {--admin-name= : Super admin full name}
        {--admin-email= : Super admin email (used to sign in)}
        {--admin-password= : Super admin password (min 8 characters)}';

    protected $description = 'Set up PharmaCare: database tables, reference data and the first admin account';

    public function handle(): int
    {
        $this->components->info('PharmaCare installer');

        if (! $this->checkDatabase()) {
            return self::FAILURE;
        }

        if (empty(config('app.key'))) {
            $this->call('key:generate', ['--force' => true]);
        }

        $demo = $this->option('demo') || ($this->input->isInteractive() && select(
            label: 'What would you like to install?',
            options: [
                'fresh' => 'A clean pharmacy (recommended for real use)',
                'demo' => 'Demo data (sample staff, medicines and sales to explore)',
            ],
            default: 'fresh',
        ) === 'demo');

        if (Schema::hasTable('users') && User::query()->exists() && $this->input->isInteractive()
            && ! confirm('This database already has users. Continue anyway?', default: false)) {
            return self::FAILURE;
        }

        $this->components->task('Creating database tables', fn () => $this->callSilent('migrate', ['--force' => true]) === 0);

        if ($demo) {
            $this->components->task('Loading demo data', function () {
                $this->callSilent('db:seed', ['--class' => DatabaseSeeder::class, '--force' => true]);
                $this->callSilent('db:seed', ['--class' => \Database\Seeders\MedexExpandedSeeder::class, '--force' => true]);
                $this->callSilent('db:seed', ['--class' => DemoSalesSeeder::class, '--force' => true]);

                return true;
            });
        } else {
            $this->components->task('Loading medicine reference data', fn () => $this->callSilent('db:seed', ['--class' => MasterDataSeeder::class, '--force' => true]) === 0);

            $store = $this->option('store-name') ?: ($this->input->isInteractive() ? text('Pharmacy name', default: 'My Pharmacy', required: true) : null);
            if ($store) {
                StoreSetting::getSettings()->update(['store_name' => $store]);
            }

            if (! $this->createAdmin()) {
                return self::FAILURE;
            }
        }

        $this->callSilent('storage:link');
        $this->callSilent('optimize:clear');

        $this->newLine();
        $this->components->info('PharmaCare is ready.');

        if ($demo) {
            $this->components->bulletList([
                'Sign in with admin@pharmacare.ai / password',
                'Demo accounts use the password "password" — do not use demo data for a real pharmacy.',
            ]);
        } else {
            $this->components->bulletList([
                'Open '.config('app.url').' and sign in with the admin email you just created.',
                'Next: Settings → store details, VAT and receipt; Staff & Roles → add your team.',
            ]);
        }

        return self::SUCCESS;
    }

    private function checkDatabase(): bool
    {
        try {
            DB::connection()->getPdo();

            return true;
        } catch (\Throwable $e) {
            $this->components->error('Cannot connect to the database. Check DB_HOST, DB_DATABASE, DB_USERNAME and DB_PASSWORD in your .env file.');
            $this->line('  '.$e->getMessage());

            return false;
        }
    }

    private function createAdmin(): bool
    {
        $interactive = $this->input->isInteractive();

        $data = [
            'name' => $this->option('admin-name') ?: ($interactive ? text('Admin full name', required: true) : null),
            'email' => $this->option('admin-email') ?: ($interactive ? text('Admin email (used to sign in)', required: true) : null),
            'password' => $this->option('admin-password') ?: ($interactive ? password('Admin password (min 8 characters)', required: true) : null),
        ];

        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', Password::min(8)],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->components->error($error);
            }
            $this->line('  Re-run with --admin-name, --admin-email and --admin-password, or interactively.');

            return false;
        }

        User::updateOrCreate(['email' => $data['email']], [
            'name' => $data['name'],
            'password' => $data['password'],
            'role' => User::ROLE_SUPER_ADMIN,
            'is_active' => true,
        ]);

        $this->components->task("Creating super admin {$data['email']}");

        return true;
    }
}
