import { useState } from 'react';
import { supabase } from './lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setErro('Não foi possível enviar o link. Tente novamente.');
    } else {
      setEnviado(true);
    }
  }

  return (
    <div>
      <header>
        <div className="logo-container">
          <span>LOGO</span>
        </div>
      </header>

      <main>
        <div className="login-box">
          <h1>Entrar</h1>

          {enviado ? (
            <p>Link enviado! Verifique seu e-mail para acessar.</p>
          ) : (
            <>
              <p>Digite seu e-mail para receber o link de acesso.</p>
              <form onSubmit={handleLogin}>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit">Enviar link de acesso</button>
              </form>
              {erro && <p style={{ color: 'red' }}>{erro}</p>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}