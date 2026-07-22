'use client';

import { useState, useEffect } from 'react';
import { 
  Phone, Clock, Search, Filter, ArrowUpRight, ArrowDownRight, RefreshCw, X, Trash2, BarChart3
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

export default function AnalystDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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
      console.error("Error loading tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentScoreWidth = (sentiment: string) => {
    if (sentiment === 'Positive') return '85%';
    if (sentiment === 'Negative') return '25%';
    return '65%';
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'Positive') return 'var(--success)';
    if (sentiment === 'Negative') return 'var(--danger)';
    return 'var(--primary)';
  };

  const totalCalls = tickets.length || 1428;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}>
      
      {/* Top KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '0.75rem', flexShrink: 0 }}>
        
        <div className="card" style={{ padding: '0.85rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TOTAL CALLS TODAY
            </span>
            <Phone size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
              {totalCalls.toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--primary)', marginTop: '4px', fontWeight: 600 }}>
              <ArrowUpRight size={13} /> +12% from yesterday
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              AVG. RESOLUTION TIME
            </span>
            <Clock size={16} style={{ color: 'var(--secondary)' }} />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
              4m 32s
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--tertiary)', marginTop: '4px', fontWeight: 600 }}>
              <ArrowUpRight size={13} /> +15s slowdown
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1.15rem', backgroundColor: '#1C1C1E', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
           <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#A1A1A6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              SENTIMENT ENGINE
           </span>
           <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '40px', marginTop: '0.4rem' }}>
             {/* Simulated Bar Chart */}
             {[40, 50, 30, 70, 90, 60, 45, 80, 55, 100].map((h, i) => (
               <div key={i} style={{ flex: 1, backgroundColor: 'var(--primary)', height: `${h}%`, borderRadius: '2px' }} />
             ))}
           </div>
        </div>

      </div>

      {/* Main Table Area */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ padding: '0.75rem 1.15rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Conversation History</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Real-time captured conversation data and AI sentiment analysis</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="input-box" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', width: '220px' }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search conversations..." style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '0.84rem' }} />
            </div>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>DATE/TIME</th>
                <th>CUSTOMER</th>
                <th>ISSUE TYPE</th>
                <th>SENTIMENT SCORE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    <RefreshCw className="animate-spin text-muted" size={22} style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No conversations found.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => {
                  const date = new Date(ticket.created_at);
                  const scoreWidth = getSentimentScoreWidth(ticket.sentiment);
                  const color = getSentimentColor(ticket.sentiment);
                  
                  return (
                    <tr key={ticket.id}>
                      <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                        {date.toISOString().split('T')[0]} &nbsp; {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {ticket.customer_name.substring(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600 }}>{ticket.customer_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`pill pill-${ticket.sentiment === 'Negative' ? 'negative' : 'neutral'}`}>
                          {ticket.category.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ width: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: scoreWidth, height: '100%', backgroundColor: color, borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', width: '32px' }}>
                            {scoreWidth.replace('%', '')}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-outline" style={{ border: 'none', color: 'var(--primary)', fontWeight: 600, padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setSelectedTicket(ticket)}>
                          View Details &rarr;
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '0.5rem 1.15rem', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
          <span>Showing {filteredTickets.length} of {totalCalls} entries</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '0.78rem' }}>&lt;</button>
            <button className="btn btn-primary" style={{ padding: '3px 10px', fontSize: '0.78rem' }}>1</button>
            <button className="btn btn-outline" style={{ padding: '3px 10px', fontSize: '0.78rem' }}>2</button>
            <button className="btn btn-outline" style={{ padding: '3px 10px', fontSize: '0.78rem' }}>3</button>
            <button className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '0.78rem' }}>&gt;</button>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flexShrink: 0 }}>
        <div className="card" style={{ padding: '0.85rem 1.15rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Volume by Issue Type</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>Shipping Delay</span><span>42%</span>
              </div>
              <div style={{ height: '5px', backgroundColor: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '42%', height: '100%', backgroundColor: 'var(--tertiary)' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>Refund Requests</span><span>28%</span>
              </div>
              <div style={{ height: '5px', backgroundColor: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '28%', height: '100%', backgroundColor: 'var(--primary)' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>Technical Support</span><span>30%</span>
              </div>
              <div style={{ height: '5px', backgroundColor: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '30%', height: '100%', backgroundColor: 'var(--secondary)' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1.15rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.25rem' }}>AI Training Status</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '0.75rem', maxWidth: '280px' }}>
            Models are currently processing real-time feedback for optimization.
          </p>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '2px' }}>v3.2</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Core Engine</div>
            </div>
            <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--surface-border)' }}></div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '2px' }}>Live</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Transcription</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Details */}
      {selectedTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedTicket(null)}>
          <div className="card" style={{ width: '560px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Ticket Details - {selectedTicket.id.split('-')[0]}</h2>
                <button className="btn btn-outline" style={{ padding: '4px', borderRadius: '50%' }} onClick={() => setSelectedTicket(null)}>
                  <X size={16} />
                </button>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
               <div>
                 <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Customer</div>
                 <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedTicket.customer_name} ({selectedTicket.customer_email || 'No email'})</div>
               </div>
               <div>
                 <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Summary</div>
                 <div style={{ padding: '10px', backgroundColor: 'var(--neutral-bg)', borderRadius: '10px', fontSize: '0.85rem' }}>
                   {selectedTicket.summary}
                 </div>
               </div>
               <div>
                 <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>JSON Data</div>
                 <pre style={{ padding: '10px', backgroundColor: '#F8F9FA', borderRadius: '10px', fontSize: '0.8rem', overflowX: 'auto', border: '1px solid var(--surface-border)' }}>
                   {JSON.stringify(selectedTicket.structured_data, null, 2)}
                 </pre>
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
