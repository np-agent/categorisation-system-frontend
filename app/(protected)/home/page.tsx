"use client";

import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { userId, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">SelfBrief Aero</h1>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-12">
        <h2 className="text-3xl font-bold text-slate-900">Welcome</h2>
        <p className="mt-2 text-slate-600">
          You are signed in
          {userId ? (
            <>
              {" "}
              as <span className="font-medium text-slate-800">{userId}</span>
            </>
          ) : null}
          .
        </p>
      </main>
    </div>
  );
}
