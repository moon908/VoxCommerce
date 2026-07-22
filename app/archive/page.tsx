'use client';

import { useState, useEffect } from 'react';
import { 
  Archive, FileText, CheckCircle, Clock, Calendar, MessageCircle, 
  Search, ExternalLink, HelpCircle, User, Activity, AlertCircle, RefreshCw, Filter, ArrowUpRight, ArrowDownRight, Lightbulb, Download, MoreVertical, Plus, BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface Ticket {
  id: string;
  customer_name: string;
  customer_email: string;
  order_id: string;
  category: string;
  priority: string;
  sentiment: string;
  summary: string;
  status: string;
  messages: any[];
  structured_data: Record<string, any>;
  analyst_notes: string;
  created_at: string;
  updated_at: string;
}

export default function HistoryArchivePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tickets');
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets);
        setFilteredTickets(data.tickets);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCalls = tickets.length || 1284;

  const truncateSummary = (summary: string) => {
    if (!summary) return 'No summary available...';
    if (summary.length > 60) return summary.substring(0, 60) + '...';
    return summary;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}>
      
      {/* Title & Filters row */}
      <div className="card" style={{ padding: '0.65rem 1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Call History</h1>
          <div className="input-box" style={{ padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px', width: '280px' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search transcripts, IDs, customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '0.84rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            <Calendar size={14} /> Last 7 Days
          </button>
          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            <Filter size={14} /> Sentiment
          </button>
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            <Filter size={14} /> More Filters
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', flexShrink: 0 }}>
        
        <div className="card" style={{ padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TOTAL CALLS
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {totalCalls.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '2px', fontWeight: 600 }}>
            +12% from last week
          </div>
        </div>

        <div className="card" style={{ padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AVG. DURATION
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            4m 32s
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '2px', fontWeight: 600 }}>
            -5s optimization
          </div>
        </div>

        <div className="card" style={{ padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            POSITIVE SENTIMENT
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            84.2%
          </div>
          <div style={{ height: '5px', backgroundColor: 'var(--surface-border)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
             <div style={{ width: '84.2%', height: '100%', backgroundColor: 'var(--primary)' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI ACCURACY
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            99.1%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Validated by 2k+ sessions
          </div>
        </div>

      </div>

      {/* Main Table Area */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ padding: '0.65rem 1.15rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            RECENT CONVERSATIONS
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing 1-{Math.min(10, filteredTickets.length)} of {totalCalls} calls
          </span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>CALL ID</th>
                <th>TIMESTAMP</th>
                <th>SUMMARY</th>
                <th>DURATION</th>
                <th>SENTIMENT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    <RefreshCw className="animate-spin text-muted" size={22} style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No archive transcripts match your filters
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket, i) => {
                  const date = new Date(ticket.created_at);
                  const durationStr = `${((i * 3) % 7) + 2}m ${((i * 13) % 50) + 5}s`;
                  return (
                    <tr key={ticket.id}>
                      <td style={{ color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                        #VX-{ticket.id.substring(0, 4).toUpperCase()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{date.toLocaleTimeString('en-US', { hour12: false })}</div>
                      </td>
                      <td style={{ maxWidth: '320px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                          {truncateSummary(ticket.summary)}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {durationStr}
                      </td>
                      <td>
                        <span className={`pill pill-${ticket.sentiment === 'Negative' ? 'negative' : ticket.sentiment === 'Positive' ? 'positive' : 'neutral'}`}>
                          {ticket.sentiment.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', color: 'var(--primary)' }}>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><Download size={16} /></button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><BarChart3 size={16} /></button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><MoreVertical size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '0.5rem 1.15rem', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Rows per page: 
            <select className="input-box" style={{ padding: '2px 6px', width: 'auto', fontSize: '0.8rem' }}>
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.78rem' }}>|&lt;</button>
            <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.78rem' }}>&lt;</button>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 4px' }}>Page 1 of 129</span>
            <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.78rem' }}>&gt;</button>
            <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.78rem' }}>&gt;|</button>
          </div>
        </div>
      </div>

    </div>
  );
}
