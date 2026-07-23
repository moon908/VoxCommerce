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
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  const userText = userMessages.join(' ');
  const userTextLower = userText.toLowerCase();

  // Extract Email
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const emailMatch = userText.match(emailRegex);
  const customer_email = emailMatch ? emailMatch[0] : '';

  // Extract Order ID
  let order_id = '';
  const orderRegexes = [
    /ord[er]*[-\s]*#?(\d+|\w+)/i,
    /cust[omer]*[-\s]*id\s*#?(\d+|\w+)/i,
    /#(\d{4,8})/i,
    /\b(\d{5,8})\b/i
  ];
  for (const regex of orderRegexes) {
    const match = userText.match(regex);
    if (match) {
      const raw = match[0].toUpperCase().replace(/\s+/g, '-');
      order_id = raw.startsWith('#') || raw.startsWith('ORD') || raw.startsWith('CUST') ? raw : `#${raw}`;
      break;
    }
  }

  // Extract Customer Name
  let customer_name = 'Anonymous';
  const nameRegexes = [
    /my name is\s+([A-Za-z\s]+)/i,
    /i am\s+([A-Za-z\s]+)/i,
    /this is\s+([A-Za-z\s]+)/i,
    /it's\s+([A-Za-z\s]+)/i,
    /name is\s+([A-Za-z\s]+)/i,
    /call me\s+([A-Za-z\s]+)/i
  ];
  for (const regex of nameRegexes) {
    const match = userText.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim().split(/\s+/).slice(0, 2).join(' ').replace(/[.,!?]/g, '');
      const candidateLower = candidate.toLowerCase();
      if (
        candidate.length > 1 &&
        !['order', 'refund', 'calling', 'help', 'having', 'issue', 'shipping', 'delayed'].some(w => candidateLower.includes(w))
      ) {
        customer_name = candidate;
        break;
      }
    }
  }

  // Turn-based fallback for customer name
  if (customer_name === 'Anonymous') {
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'assistant') {
        const aiText = messages[i].content.toLowerCase();
        if (aiText.includes('full name') || aiText.includes('your name') || aiText.includes('speaking')) {
          const userReply = messages[i + 1]?.content?.trim();
          if (userReply && messages[i + 1].role === 'user') {
            const cleanReply = userReply.replace(/^(hi|hello|hey|my name is|i am|it's|this is)\s+/i, '').replace(/[.,!?]/g, '');
            const candidate = cleanReply.split(/\s+/).slice(0, 2).join(' ');
            const candidateLower = candidate.toLowerCase();
            if (
              candidate.length > 1 &&
              !['don\'t', 'no', 'yes', 'not', 'order', 'refund', 'help'].some(w => candidateLower.includes(w))
            ) {
              customer_name = candidate;
              break;
            }
          }
        }
      }
    }
  }

  // Determine Category
  let category = 'Other';
  if (userTextLower.includes('ship') || userTextLower.includes('delivery') || userTextLower.includes('delayed') || userTextLower.includes('track') || userTextLower.includes('courier') || userTextLower.includes('package') || userTextLower.includes('arrive')) {
    category = 'Shipping';
  } else if (userTextLower.includes('refund') || userTextLower.includes('money back') || userTextLower.includes('return') || userTextLower.includes('cancel')) {
    category = 'Refund';
  } else if (userTextLower.includes('charge') || userTextLower.includes('billing') || userTextLower.includes('invoice') || userTextLower.includes('payment') || userTextLower.includes('double')) {
    category = 'Billing';
  } else if (userTextLower.includes('broken') || userTextLower.includes('faulty') || userTextLower.includes('defect') || userTextLower.includes('login') || userTextLower.includes('app') || userTextLower.includes('bug')) {
    category = 'Technical';
  } else if (userTextLower.includes('product') || userTextLower.includes('size') || userTextLower.includes('color') || userTextLower.includes('spec') || userTextLower.includes('question')) {
    category = 'Product Query';
  }

  // Determine Priority
  let priority = 'Low';
  if (userTextLower.includes('urgent') || userTextLower.includes('asap') || userTextLower.includes('immediately') || userTextLower.includes('lawyer')) {
    priority = 'Urgent';
  } else if (userTextLower.includes('angry') || userTextLower.includes('broken') || userTextLower.includes('disappointed') || userTextLower.includes('damaged')) {
    priority = 'High';
  } else if (userTextLower.includes('refund') || userTextLower.includes('double charge') || userTextLower.includes('wrong size')) {
    priority = 'Medium';
  }

  // Determine Sentiment
  let sentiment = 'Neutral';
  const negativeWords = ['angry', 'bad', 'broken', 'disappointed', 'damaged', 'worst', 'fail', 'error', 'poor', 'annoyed', 'hate', 'refund'];
  const positiveWords = ['thank', 'great', 'love', 'perfect', 'awesome', 'appreciate', 'happy', 'solved'];
  
  let negCount = 0;
  let posCount = 0;
  negativeWords.forEach(w => { if (userTextLower.includes(w)) negCount++; });
  positiveWords.forEach(w => { if (userTextLower.includes(w)) posCount++; });

  if (negCount > posCount) {
    sentiment = 'Negative';
  } else if (posCount > negCount) {
    sentiment = 'Positive';
  }

  // Generate Summary
  let summary = 'Customer reached out for support regarding an issue.';
  if (category === 'Shipping') {
    summary = `Customer is inquiring about order shipment, delivery delay, or tracking information${order_id ? ' for ' + order_id : ''}.`;
  } else if (category === 'Refund') {
    summary = `Customer is requesting a product return or refund${order_id ? ' for order ' + order_id : ''}.`;
  } else if (category === 'Billing') {
    summary = 'Customer reported a billing, invoice, or payment discrepancy.';
  } else if (category === 'Technical') {
    summary = 'Customer reported a technical issue, login error, or product defect.';
  } else if (category === 'Product Query') {
    summary = 'Customer asked a question about product specifications, sizing, or details.';
  } else if (userMessages.length > 0) {
    const last = userMessages[userMessages.length - 1];
    summary = `Customer reported: "${last.length > 100 ? last.substring(0, 100) + '...' : last}"`;
  }

  // Structured Data
  const structured_data: any = {};
  if (order_id) structured_data.extracted_order_id = order_id;
  if (customer_email) structured_data.extracted_email = customer_email;
  
  const sizeMatch = userTextLower.match(/(size\s+xs|size\s+s|size\s+m|size\s+l|size\s+xl)/i);
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
