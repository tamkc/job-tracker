import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-(family-name:--font-geist-sans)">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start text-center sm:text-left">
        <h1 className="text-5xl font-extrabold tracking-tight">Job Tracker</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg">
          Manage your job search journey in one place. Keep track of
          applications, interviews, and offers effortlessly.
        </p>
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-4">
          <Link
            href="/login"
            className="rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center text-base h-12 px-8 font-medium shadow-lg"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center text-base h-12 px-8 font-medium"
          >
            My Applications
          </Link>
        </div>
      </main>
    </div>
  );
}
