import { neon } from '@neondatabase/serverless';

// Core interfaces for ticket data
export interface Ticket {
  id: string;
  customer_name: string;
  customer_email: string;
  order_id: string;
  category: string;
  priority: string;
  sentiment: string;
  summary: string;
  status: string;
  messages: any[]; // JSON array of messages
  structured_data: Record<string, any>;
  analyst_notes: string;
  created_at: string;
  updated_at: string;
}

// Check if Neon DB URL is available
const databaseUrl = process.env.NEON_DATABASE_URL;
const isNeonConfigured = !!databaseUrl;

// Simple in-memory fallback store for development/testing if Neon DB is not set up
class MockDatabase {
  private tickets: Map<string, Ticket> = new Map();

  constructor() {
    // Seed with a couple of mock tickets
    this.seed();
  }

  private seed() {
    const seedTickets: Ticket[] = [
      {
        id: "ticket-1",
        customer_name: "Sarah Jenkins",
        customer_email: "sarah.j@example.com",
        order_id: "ORD-99823",
        category: "Refund",
        priority: "High",
        sentiment: "Negative",
        summary: "Customer received the wrong product size and wants a full refund immediately.",
        status: "Open",
        messages: [
          { role: "user", content: "Hi, I ordered a size M jacket but received a size XS. I need a refund.", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
          { role: "assistant", content: "Hello Sarah, I am so sorry for the mixup. I can certainly help you with a refund for order ORD-99823. Let me generate a pre-paid return label for you.", timestamp: new Date(Date.now() - 3600000 * 1.9).toISOString() }
        ],
        structured_data: {
          ordered_item: "Winter Fleece Jacket",
          ordered_size: "M",
          received_size: "XS",
          resolution_offered: "Pre-paid return label and refund"
        },
        analyst_notes: "Checked inventory, size M is out of stock. Processed refund as requested.",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "ticket-2",
        customer_name: "Michael Chen",
        customer_email: "mchen@example.com",
        order_id: "ORD-44129",
        category: "Billing",
        priority: "Medium",
        sentiment: "Neutral",
        summary: "Inquiring about double charge on invoice.",
        status: "In Progress",
        messages: [
          { role: "user", content: "Hello, my card was charged twice for order ORD-44129.", timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
          { role: "assistant", content: "Hi Michael, let me check the transaction log. It looks like a duplicate authorization hold. I will reach out to our billing team to release it.", timestamp: new Date(Date.now() - 3600000 * 23.8).toISOString() }
        ],
        structured_data: {
          duplicate_charge_detected: true,
          authorized_hold_amount: "$49.99",
          billing_gateway: "Stripe"
        },
        analyst_notes: "Contacted Stripe support. The second hold will automatically fall off in 3 business days.",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    seedTickets.forEach(t => this.tickets.set(t.id, t));
  }

  async query(queryString: string, params: any[] = []): Promise<any[]> {
    console.log("[MockDB Query]", queryString, params);

    // Mock implementation of basic queries
    if (queryString.includes("INSERT INTO tickets")) {
      const id = crypto.randomUUID();
      const ticket: Ticket = {
        id,
        customer_name: params[0] || 'Anonymous',
        customer_email: params[1] || '',
        order_id: params[2] || '',
        category: params[3] || 'Other',
        priority: params[4] || 'Low',
        sentiment: params[5] || 'Neutral',
        summary: params[6] || '',
        status: params[7] || 'Open',
        messages: JSON.parse(params[8] || '[]'),
        structured_data: JSON.parse(params[9] || '{}'),
        analyst_notes: params[10] || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.tickets.set(id, ticket);
      return [ticket];
    }

    if (queryString.includes("SELECT * FROM tickets") && queryString.includes("WHERE id =")) {
      const id = params[0];
      const ticket = this.tickets.get(id);
      return ticket ? [ticket] : [];
    }

    if (queryString.includes("SELECT * FROM tickets")) {
      // Sorting tickets by date desc
      return Array.from(this.tickets.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    if (queryString.includes("UPDATE tickets")) {
      // Check parameters: UPDATE tickets SET status = $1, priority = $2, analyst_notes = $3, updated_at = NOW() WHERE id = $4
      const status = params[0];
      const priority = params[1];
      const analyst_notes = params[2];
      const id = params[3];

      const ticket = this.tickets.get(id);
      if (ticket) {
        ticket.status = status;
        ticket.priority = priority;
        ticket.analyst_notes = analyst_notes;
        ticket.updated_at = new Date().toISOString();
        this.tickets.set(id, ticket);
        return [ticket];
      }
      return [];
    }

    return [];
  }
}

const mockDb = new MockDatabase();

// Wrapper DB client
export const db = {
  isConfigured: isNeonConfigured,
  
  async query(queryString: string, params: any[] = []): Promise<any[]> {
    if (isNeonConfigured) {
      try {
        const sql = neon(databaseUrl);
        return await sql.query(queryString, params);
      } catch (error) {
        console.error("Neon DB query error, falling back to mock database:", error);
        return await mockDb.query(queryString, params);
      }
    } else {
      return await mockDb.query(queryString, params);
    }
  },

  async initSchema() {
    if (!isNeonConfigured) {
      console.log("NeonDB is not configured. Running schema initialization on Mock DB.");
      return { success: true, message: "Initialized Mock Database (in-memory)." };
    }

    try {
      const sql = neon(databaseUrl);
      
      // Create the tickets table
      await sql.query(`
        CREATE TABLE IF NOT EXISTS tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_name VARCHAR(100),
          customer_email VARCHAR(100),
          order_id VARCHAR(50),
          category VARCHAR(50),
          priority VARCHAR(20),
          sentiment VARCHAR(20),
          summary TEXT,
          status VARCHAR(20) DEFAULT 'Open',
          messages JSONB DEFAULT '[]'::jsonb,
          structured_data JSONB DEFAULT '{}'::jsonb,
          analyst_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      return { success: true, message: "Neon DB Schema initialized successfully." };
    } catch (error: any) {
      console.error("Neon DB schema initialization failed:", error);
      throw error;
    }
  }
};
