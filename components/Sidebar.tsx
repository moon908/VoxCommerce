'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Mic, 
  History, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut,
  PlusSquare
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div style={{
            width: 32, height: 32, borderRadius: '8px', 
            overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0, 122, 255, 0.15)'
          }}>
            <Image 
              src="/icon.jpg" 
              alt="VoxCommerce Logo" 
              width={32} 
              height={32} 
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="logo-text">
            VoxCommerce <span className="logo-ai">AI</span>
          </div>
        </div>
        
        <div className="system-status">
          <div className="status-dot"></div>
          <div className="status-text">
            System Active
            <span>v2.4.1-stable</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {pathname === '/analyst' || pathname === '/archive' ? (
          <div style={{ padding: '0 4px', marginBottom: '12px' }}>
            <Link href="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 12px', textDecoration: 'none' }}>
              <PlusSquare size={17} /> New Support Session
            </Link>
          </div>
        ) : null}

        <Link 
          href="/" 
          className={`sidebar-link ${pathname === '/' ? 'active' : ''}`}
        >
          <Mic size={17} /> Live Monitor
        </Link>
        
        <Link 
          href="/archive" 
          className={`sidebar-link ${pathname === '/archive' ? 'active' : ''}`}
        >
          <History size={17} /> Call History
        </Link>
        
        <Link 
          href="/analyst" 
          className={`sidebar-link ${pathname === '/analyst' ? 'active' : ''}`}
        >
          <BarChart3 size={17} /> Analytics
        </Link>

        <Link 
          href="#" 
          className="sidebar-link"
        >
          <Settings size={17} /> Settings
        </Link>
      </nav>

      <div className="sidebar-footer">
        <Link href="#" className="sidebar-link">
          <HelpCircle size={17} /> Help & Documentation
        </Link>
        <Link href="#" className="sidebar-link">
          <LogOut size={17} /> Logout
        </Link>
      </div>
    </aside>
  );
}
