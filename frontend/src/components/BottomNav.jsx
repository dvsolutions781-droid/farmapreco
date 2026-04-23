import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, BasketIcon, ChartIcon } from './Icons';
import { useBasket } from '../hooks/useBasket';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { count } = useBasket();

  const items = [
    { path: '/', icon: HomeIcon, label: 'Início' },
    { path: '/basket', icon: BasketIcon, label: 'Cesta', badge: count },
    { path: '/dashboard', icon: ChartIcon, label: 'Dashboard' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      {items.map(({ path, icon: Icon, label, badge }) => (
        <button
          key={path}
          className={`nav-item ${isActive(path) ? 'active' : ''}`}
          onClick={() => navigate(path)}
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Icon size={22} />
            {badge > 0 && <span className="nav-badge">{badge}</span>}
          </div>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
