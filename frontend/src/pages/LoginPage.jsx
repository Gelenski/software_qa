import { useState } from 'react';
import { login } from '../auth.js';
import { useEnvio } from '../components/ui.jsx';

export default function LoginPage({ aoLogar }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, enviar] = useEnvio();

  function submeter(e) {
    e.preventDefault();
    return enviar(async () => {
      setErro('');
      try {
        const sessao = await login(usuario, senha);
        aoLogar(sessao);
      } catch (e) {
        setErro(e.message);
      }
    });
  }

  return (
    <div className="app" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <form
        className={`card ${enviando ? 'enviando' : ''}`}
        style={{ width: 320 }}
        onSubmit={submeter}
      >
        <h2>TestAudit</h2>
        {erro && <div className="erro">{erro}</div>}
        <label>Usuario</label>
        <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus />
        <label>Senha</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
          auditor / auditor123 &nbsp;·&nbsp; e-mail do responsavel / tester123
        </p>
      </form>
    </div>
  );
}
