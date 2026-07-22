import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const tickets = await db.query(
      `SELECT * FROM tickets ORDER BY created_at DESC`
    );
    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tickets.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_name = 'Anonymous',
      customer_email = '',
      order_id = '',
      category = 'Other',
      priority = 'Low',
      sentiment = 'Neutral',
      summary = '',
      status = 'Open',
      messages = [],
      structured_data = {},
      analyst_notes = ''
    } = body;

    const queryText = `
      INSERT INTO tickets (
        customer_name, customer_email, order_id, category, priority, 
        sentiment, summary, status, messages, structured_data, analyst_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const params = [
      customer_name,
      customer_email,
      order_id,
      category,
      priority,
      sentiment,
      summary,
      status,
      JSON.stringify(messages),
      JSON.stringify(structured_data),
      analyst_notes
    ];

    const result = await db.query(queryText, params);
    
    return NextResponse.json({ 
      success: true, 
      ticket: result[0],
      message: 'Ticket created successfully.' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create ticket.' },
      { status: 500 }
    );
  }
}
