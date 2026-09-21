'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, LogIn, Store } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fulsiuajohtyotcpbxti.supabase.co';
const JWT_ANON_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHNpdWFqb2h0eW90Y3BieHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI3MTg3MDMsImV4cCI6MjAyODMwMDcwM30.eXNBMklpQU93a0ZvbXlhWDF3QUFfU3N1a3I3MGg0dzNhUGVfa1NodEw0UQ==';
const PUBLISHABLE_ANON_FALLBACK = 'sb_publishable_iMOUS7O7-Qx7Urau9WhpyQ_VipWYXSh';
function resolvePublicAnonKey() {
  const envKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const isPlaceholder = (key) => !key || key.includes('...') || key.includes('eXNBMklpQU93a0ZvbXlhWDF3QUFfU3N1a3I3MGg0dzNhUGVfa1NodEw0UQ');
  if (!isPlaceholder(envKey)) return envKey;
  if (!isPlaceholder(JWT_ANON_FALLBACK)) return JWT_ANON_FALLBACK;
  return PUBLISHABLE_ANON_FALLBACK;
}
const SUPABASE_ANON_KEY = resolvePublicAnonKey();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function hasOwnerRole() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { allowed: false, error: null };
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const res = await fetch(`${origin}/api/owner-data`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${session.access_token}` }
  });
  if (res.ok) return { allowed: true, error: null };
  if (res.status === 401) return { allowed: false, error: null };
  return { allowed: false, error: true };
}

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const roleCheck = session?.user?.email ? await hasOwnerRole() : { allowed: false };
      if (roleCheck.allowed) router.replace('/owner');
      else {
        if (session) await supabase.auth.signOut();
        setCheckingSession(false);
      }
    });
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (signInError) {
      setError('ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
      setSubmitting(false);
      return;
    }

    const roleCheck = await hasOwnerRole();
    if (!roleCheck.allowed) {
      await supabase.auth.signOut();
      setError(roleCheck.error ? 'ບໍ່ສາມາດກວດສິດໄດ້: ໃຫ້ run SQL policy ສໍາລັບ staffs ກ່ອນ' : 'ບັນຊີນີ້ບໍ່ມີສິດເຈົ້າຂອງຮ້ານ');
      setSubmitting(false);
      return;
    }

    router.replace('/owner');
  };

  if (checkingSession) {
    return <main className="modern-admin-loading"><div className="loading-mark"><Store size={22} /></div><p>ກຳລັງກວດສອບ...</p></main>;
  }

  return (
    <main className="owner-login-page min-h-screen flex items-center justify-center p-4">
      <section className="owner-login-card w-full max-w-md bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="owner-login-icon flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 mb-4"><Store size={28} /></div>
          <h1 className="text-2xl font-black text-gray-950">ເຂົ້າສູ່ Dashboard</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">ສໍາລັບເຈົ້າຂອງຮ້ານ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-black text-gray-800">
            ອີເມວ
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="owner@example.com" className="mt-1.5 w-full rounded-xl border-2 border-gray-200 bg-white p-3 text-black outline-none transition focus:border-orange-500" />
          </label>
          <label className="block text-sm font-black text-gray-800">
            ລະຫັດຜ່ານ
            <div className="relative mt-1.5"><LockKeyhole size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="ປ້ອນລະຫັດຜ່ານ" className="w-full rounded-xl border-2 border-gray-200 bg-white p-3 pl-10 text-black outline-none transition focus:border-orange-500" /></div>
          </label>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
          <button disabled={submitting} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-black text-white shadow-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"><LogIn size={18} />{submitting ? 'ກໍາລັງເຂົ້າ...' : 'ເຂົ້າສູ່ລະບົບ'}</button>
        </form>
      </section>
    </main>
  );
}
