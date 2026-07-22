import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await db.query(
      `SELECT * FROM tickets WHERE id = $1`,
      [id]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, ticket: result[0] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ticket.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, priority, analyst_notes } = body;

    // Fetch existing ticket to check existence
    const existing = await db.query(
      `SELECT * FROM tickets WHERE id = $1`,
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    const ticket = existing[0];
    const newStatus = status !== undefined ? status : ticket.status;
    const newPriority = priority !== undefined ? priority : ticket.priority;
    const newNotes = analyst_notes !== undefined ? analyst_notes : ticket.analyst_notes;

    const queryText = `
      UPDATE tickets 
      SET status = $1, priority = $2, analyst_notes = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const updated = await db.query(queryText, [newStatus, newPriority, newNotes, id]);

    return NextResponse.json({
      success: true,
      ticket: updated[0],
      message: 'Ticket updated successfully.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update ticket.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await db.query(
      `DELETE FROM tickets WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete ticket.' },
      { status: 500 }
    );
  }
}
