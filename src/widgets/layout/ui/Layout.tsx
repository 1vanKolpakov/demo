import React from 'react';
import { Link, Outlet } from 'react-router';
import { useAppSelector } from '../../../shared/store/hooks';

const Layout: React.FC = () => {
  const user = useAppSelector((s) => s.user.data);

  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/">Заказ ВМ</Link>
        <Link to="/administration">Администрирование</Link>
        {user && <span style={{ marginLeft: 'auto' }}>{user.username}</span>}
      </nav>
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
