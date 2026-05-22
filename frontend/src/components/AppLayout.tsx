import { Link, useNavigate } from 'react-router-dom';
import { clearToken, getStoredToken } from '../auth';

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function AppLayout({ title, children }: Props) {
  const navigate = useNavigate();

  if (!getStoredToken()) {
    navigate('/');
    return null;
  }

  const logout = () => {
    clearToken();
    navigate('/');
  };

  return (
    <main className="app">
      <header>
        <h1>Inventory QAS</h1>
        <p>{title}</p>
      </header>
      <nav className="nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/products">Productos</Link>
        <Link to="/audit">Auditoría</Link>
        <button type="button" onClick={logout}>
          Salir
        </button>
      </nav>
      {children}
    </main>
  );
}
