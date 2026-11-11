import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Lock, SearchX, ServerCrash, Wrench } from 'lucide-react';
import { PageProps } from '@/types';
import { ThemeToggleButton } from '@/Components/ThemeToggle';

interface Props {
    status: number;
    message?: string | null;
}

const COPY: Record<number, { title: string; text: string; icon: typeof Lock }> = {
    403: { title: 'You don’t have access to this page', text: 'Your role doesn’t include this section. Ask an administrator if you need it.', icon: Lock },
    404: { title: 'Page not found', text: 'The page you’re looking for doesn’t exist or was moved.', icon: SearchX },
    500: { title: 'Something went wrong', text: 'An unexpected error occurred. Please try again in a moment.', icon: ServerCrash },
    503: { title: 'Down for maintenance', text: 'We’re making improvements. Please check back shortly.', icon: Wrench },
};

export default function Error({ status, message }: Props) {
    const { auth } = usePage<PageProps>().props;
    const copy = COPY[status] ?? COPY[500];
    const Icon = copy.icon;

    return (
        <div className="min-h-[100dvh] bg-deep text-slate-100 flex items-center justify-center p-6 relative">
            <Head title={copy.title} />
            <div className="absolute top-4 right-4">
                <ThemeToggleButton />
            </div>
            <div className="max-w-md w-full text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="mt-6 text-sm font-bold text-emerald-400 tracking-widest">ERROR {status}</p>
                <h1 className="mt-2 text-2xl font-bold text-white">{copy.title}</h1>
                <p className="mt-2 text-slate-400">{message || copy.text}</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Go back
                    </button>
                    <Link
                        href={auth?.user ? '/' : '/login'}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-ink text-sm font-bold"
                    >
                        {auth?.user ? 'Go to dashboard' : 'Sign in'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
