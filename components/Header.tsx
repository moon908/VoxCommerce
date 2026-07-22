'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Bell, Mic, History, BarChart3, User } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="top-header">
      <div className="header-tabs">
        <Link 
          href="/" 
          className={`header-tab ${pathname === '/' ? 'active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Mic size={15} /> Active Call
        </Link>
        <Link 
          href="/archive" 
          className={`header-tab ${pathname === '/archive' ? 'active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <History size={15} /> History
        </Link>
        <Link 
          href="/analyst" 
          className={`header-tab ${pathname === '/analyst' ? 'active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <BarChart3 size={15} /> Analyst Dashboard
        </Link>
      </div>

      <div className="header-actions">
        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
          <Settings size={18} />
        </button>
        <div style={{ position: 'relative', cursor: 'pointer', display: 'flex' }}>
          <Bell size={18} />
          <div style={{
            position: 'absolute', top: -2, right: -2, 
            width: 8, height: 8, backgroundColor: 'var(--danger)', 
            borderRadius: '50%', border: '2px solid var(--surface)'
          }}></div>
        </div>
        <div className="avatar">
          <User size={16} />
        </div>
      </div>
    </header>
  );
}
