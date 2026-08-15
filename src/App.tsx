import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import LoginPage from './LoginPage';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        buscarPerfil(session.user.id);
      } else {
        setCarregando(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        buscarPerfil(session.user.id);
      } else {
        setRole(null);
        setCarregando(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function buscarPerfil(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setRole(data.role);
    }
    setCarregando(false);
  }

  if (carregando) {
    return <p>Carregando...</p>;
  }

  if (!session) {
    return <LoginPage />;
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}