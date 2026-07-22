import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Groq from 'groq-sdk';

const ANALYST_SYSTEM_PROMPT = `You are a Customer Support AI Analyst Engine.
Analyze the customer support chat transcript provided by the user.
Extract the following structured details in valid JSON format:
{
  "customer_name": "Full name of the customer (or 'Anonymous' if not mentioned)",
  "customer_email": "Email address of the customer (or empty string if not mentioned)",
  "order_id": "Order ID mentioned, e.g. ORD-12345 (or empty string if not mentioned)",
  "category": "One of: Billing, Shipping, Refund, Technical, Product Query, Other",
  "priority": "One of: Low, Medium, High, Urgent. Choose based on urgency, customer frustration, or financial issues.",
  "sentiment": "One of: Positive, Neutral, Negative. Assess based on tone and wording.",
  "summary": "A concise 1-2 sentence summary of the customer's main concern and what they are requesting.",
  "structured_data": {
     // A key-value object containing any other specific parameters found (e.g. item_name, size, refund_reason, delivery_delay, billing_discrepancy, etc.)
  }
}

Do not include any markdown wrappers (like \`\`\`json), comments, or preambles. Output ONLY the raw JSON object.`;

// Regex/rule-based fallback analysis if Groq is not configured
function analyzeTranscriptMock(messages: any[]): any {
  const text = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
  const userMessagesLower = userMessages.toLowerCase();

  // Extract Email
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const emailMatch = userMessages.match(emailRegex);
  const customer_email = emailMatch ? emailMatch[0] : '';

  // Extract Order ID
  const orderRegex = /ord-\d+/i;
  const orderMatch = userMessages.match(orderRegex);
  const order_id = orderMatch ? orderMatch[0].toUpperCase() : '';

  // Extract Customer Name (rough extraction)
  let customer_name = 'Anonymous';
  const nameRegexes = [
    /my name is\s+([A-Za-z\s]+)/i,
    /i am\s+([A-Za-z\s]+)/i,
    /this is\s+([A-Za-z\s]+)/i,
    /name:\s*([A-Za-z\s]+)/i
  ];
  for (const regex of nameRegexes) {
    const match = userMessages.match(regex);
    if (match && match[1]) {
      const name = match[1].trim().split(/\s+/, 2).join(' ');
      if (name && name.length > 2 && !name.toLowerCase().includes('order') && !name.toLowerCase().includes('refund')) {
        customer_name = name;
        break;
      }
    }
  }

  // Determine Category
  let category = 'Other';
  if (userMessagesLower.includes('refund') || userMessagesLower.includes('money back') || userMessagesLower.includes('return item')) {
    category = 'Refund';
  } else if (userMessagesLower.includes('charge') || userMessagesLower.includes('billing') || userMessagesLower.includes('invoice') || userMessagesLower.includes('double charge')) {
    category = 'Billing';
  } else if (userMessagesLower.includes('ship') || userMessagesLower.includes('delivery') || userMessagesLower.includes('track') || userMessagesLower.includes('arrive') || userMessagesLower.includes('package')) {
    category = 'Shipping';
  } else if (userMessagesLower.includes('broken') || userMessagesLower.includes('faulty') || userMessagesLower.includes('login') || userMessagesLower.includes('password') || userMessagesLower.includes('bug')) {
    category = 'Technical';
  } else if (userMessagesLower.includes('product') || userMessagesLower.includes('size') || userMessagesLower.includes('color') || userMessagesLower.includes('spec') || userMessagesLower.includes('question')) {
    category = 'Product Query';
  }

  // Determine Priority
  let priority = 'Low';
  if (userMessagesLower.includes('urgent') || userMessagesLower.includes('asap') || userMessagesLower.includes('immediately') || userMessagesLower.includes('lawyer') || userMessagesLower.includes('police')) {
    priority = 'Urgent';
  } else if (userMessagesLower.includes('angry') || userMessagesLower.includes('broken') || userMessagesLower.includes('disappointed') || userMessagesLower.includes('damaged') || userMessagesLower.includes('worst')) {
    priority = 'High';
  } else if (userMessagesLower.includes('refund') || userMessagesLower.includes('double charge') || userMessagesLower.includes('wrong size')) {
    priority = 'Medium';
  }

  // Determine Sentiment
  let sentiment = 'Neutral';
  const negativeWords = ['angry', 'bad', 'broken', 'disappointed', 'damaged', 'worst', 'fail', 'error', 'poor', 'annoyed', 'hate', 'refund'];
  const positiveWords = ['thank', 'great', 'love', 'perfect', 'awesome', 'appreciate', 'happy', 'solved'];
  
  let negCount = 0;
  let posCount = 0;
  negativeWords.forEach(w => {
    if (userMessagesLower.includes(w)) negCount++;
  });
  positiveWords.forEach(w => {
    if (userMessagesLower.includes(w)) posCount++;
  });

  if (negCount > posCount) {
    sentiment = 'Negative';
  } else if (posCount > negCount) {
    sentiment = 'Positive';
  }

  // Generate Summary
  let summary = 'Customer reached out for support regarding an issue.';
  if (category === 'Refund') {
    summary = `Customer is requesting a return/refund${order_id ? ' for order ' + order_id : ''}.`;
  } else if (category === 'Billing') {
    summary = 'Customer is reporting a billing/invoice discrepancy.';
  } else if (category === 'Shipping') {
    summary = 'Customer is inquiring about order shipment, delivery delay, or tracking information.';
  } else if (category === 'Technical') {
    summary = 'Customer is reporting a technical issue or product defect.';
  } else if (category === 'Product Query') {
    summary = 'Customer is asking a question about product details or specifications.';
  }

  // Structured Data
  const structured_data: any = {};
  if (order_id) structured_data.extracted_order_id = order_id;
  if (customer_email) structured_data.extracted_email = customer_email;
  
  const sizeMatch = userMessagesLower.match(/(size\s+xs|size\s+s|size\s+m|size\s+l|size\s+xl)/i);
  if (sizeMatch) structured_data.product_size = sizeMatch[0].toUpperCase();

  return {
    customer_name,
    customer_email,
    order_id,
    category,
    priority,
    sentiment,
    summary,
    structured_data
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required for analysis.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    let analysisResult: any;

    if (!apiKey) {
      console.warn("GROQ_API_KEY is not set. Running mock/rule-based parser on transcript.");
      analysisResult = analyzeTranscriptMock(messages);
    } else {
      try {
        const groq = new Groq({ apiKey });
        
        const transcriptText = messages
          .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n\n');

        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: ANALYST_SYSTEM_PROMPT },
            { role: 'user', content: `Analyze this transcript:\n\n${transcriptText}` }
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.1,
          response_format: { type: 'json_object' } // Ensure structured JSON output
        });

        const jsonText = completion.choices[0]?.message?.content || '{}';
        analysisResult = JSON.parse(jsonText.trim());
      } catch (err: any) {
        console.error("Groq AI analysis failed, falling back to rule-based analysis:", err);
        analysisResult = analyzeTranscriptMock(messages);
      }
    }

    // Standardize variables
    const {
      customer_name = 'Anonymous',
      customer_email = '',
      order_id = '',
      category = 'Other',
      priority = 'Low',
      sentiment = 'Neutral',
      summary = 'Summary extraction failed.',
      structured_data = {}
    } = analysisResult;

    // Save ticket into NeonDB (or mock db fallback)
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
      'Open', // default status
      JSON.stringify(messages),
      JSON.stringify(structured_data),
      '' // initial analyst notes are empty
    ];

    const result = await db.query(queryText, params);

    return NextResponse.json({
      success: true,
      ticket: result[0],
      message: 'Transcript analyzed and saved successfully.'
    });

  } catch (error: any) {
    console.error("Analyze & Save Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to analyze and save ticket.' },
      { status: 500 }
    );
  }
}
