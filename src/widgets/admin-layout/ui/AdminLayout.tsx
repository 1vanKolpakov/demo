import React from 'react';
import { Link, Outlet } from 'react-router';
import { useAdminLayout } from '../model/useAdminLayout';

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '0.5rem 1rem',
  textDecoration: 'none',
  display: 'inline-block',
  borderBottom: active ? '2px solid #1890ff' : '2px solid transparent',
  color: active ? '#1890ff' : '#333',
  fontWeight: active ? 600 : 400,
});

const AdminLayout: React.FC = () => {
  const {
    groupsInitialized,
    topMenuItems,
    subMenuItems,
    activeTopValue,
    activeSubValue,
    handleTopSelect,
    handleSubSelect,
  } = useAdminLayout();

  if (!groupsInitialized) return null;

  return (
    <div>
      {/* Replace with <UITabs items={topMenuItems} value={activeTopValue} onSelect={handleTopSelect} /> */}
      <nav style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #ddd' }}>
        {topMenuItems.map((item) => (
          <Link
            key={item.value}
            to={item.value}
            onClick={(e) => { e.preventDefault(); handleTopSelect(item.value); }}
            style={tabStyle(item.value === activeTopValue)}
          >
            {item.header}
          </Link>
        ))}
      </nav>

      {/* Replace with <UITabs items={subMenuItems} value={activeSubValue} onSelect={handleSubSelect} /> */}
      {subMenuItems.length > 0 && (
        <nav
          style={{
            display: 'flex',
            gap: '0.25rem',
            borderBottom: '1px solid #eee',
            backgroundColor: '#fafafa',
            paddingLeft: '1rem',
          }}
        >
          {subMenuItems.map((item) => (
            <Link
              key={item.value}
              to={item.value}
              onClick={(e) => { e.preventDefault(); handleSubSelect(item.value); }}
              style={tabStyle(item.value === activeSubValue)}
            >
              {item.header}
            </Link>
          ))}
        </nav>
      )}

      <div style={{ padding: '1.5rem' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
