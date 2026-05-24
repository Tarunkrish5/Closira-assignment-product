/**
 * Mock data — shaped exactly like the backend would return.
 *
 * Timestamps are computed relative to "now" at module load so the dashboard
 * always feels alive when an evaluator opens the app, no matter when. In
 * production we'd swap this single module for an API client and nothing else
 * changes — every component types its props against ``src/types``.
 */
import type {
  ActivityItem,
  Conversation,
  DashboardStats,
  Escalation,
  Followup,
  Lead,
} from '../types';

// All times are computed at module import. Captured here so all relative
// offsets share one reference point and the list stays internally consistent.
const NOW = Date.now();
const minsAgo = (m: number): string => new Date(NOW - m * 60_000).toISOString();
const minsAhead = (m: number): string => new Date(NOW + m * 60_000).toISOString();

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export const mockStats: DashboardStats = {
  leadsToday: 24,
  leadsTodayDelta: 6, // +6 vs yesterday
  missedEnquiries: 3,
  openEscalations: 4,
  followupsDue: 7,
};

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export const mockLeads: Lead[] = [
  {
    id: 'enq_001',
    customer: 'Sarah M.',
    channel: 'whatsapp',
    status: 'qualified',
    preview: 'Hi, can I get a quote for the deluxe package?',
    receivedAt: minsAgo(4),
    matchedSop: 'pricing_question',
  },
  {
    id: 'enq_002',
    customer: 'Rohan K.',
    channel: 'email',
    status: 'escalated',
    preview: 'The pricing was completely wrong on my invoice. I want a refund.',
    receivedAt: minsAgo(12),
    matchedSop: 'complaint',
  },
  {
    id: 'enq_003',
    customer: 'Priya N.',
    channel: 'whatsapp',
    status: 'new',
    preview: 'Looking to book a slot for next Tuesday around 4pm.',
    receivedAt: minsAgo(23),
  },
  {
    id: 'enq_004',
    customer: 'Daniel O.',
    channel: 'call',
    status: 'qualified',
    preview: 'Voice transcript — wants pricing for a 12-month plan.',
    receivedAt: minsAgo(42),
    matchedSop: 'pricing_question',
  },
  {
    id: 'enq_005',
    customer: 'Aisha R.',
    channel: 'email',
    status: 'qualified',
    preview: 'Are you still open this weekend? Need to confirm hours.',
    receivedAt: minsAgo(58),
    matchedSop: 'after_hours',
  },
  {
    id: 'enq_006',
    customer: 'Marcus T.',
    channel: 'whatsapp',
    status: 'escalated',
    preview: "This is terrible service. I've been waiting two days for a reply.",
    receivedAt: minsAgo(90),
    matchedSop: 'complaint',
  },
  {
    id: 'enq_007',
    customer: 'Lena F.',
    channel: 'call',
    status: 'new',
    preview: 'Asked about features and integrations.',
    receivedAt: minsAgo(130),
  },
  {
    id: 'enq_008',
    customer: 'Vikram J.',
    channel: 'email',
    status: 'qualified',
    preview: 'Can you tell me about the enterprise tier?',
    receivedAt: minsAgo(180),
    matchedSop: 'product_info',
  },
  {
    id: 'enq_009',
    customer: 'Hannah B.',
    channel: 'whatsapp',
    status: 'qualified',
    preview: 'Want to schedule an appointment for tomorrow morning.',
    receivedAt: minsAgo(240),
    matchedSop: 'booking_enquiry',
  },
];

// ---------------------------------------------------------------------------
// Escalations — a subset of leads, with extra metadata
// ---------------------------------------------------------------------------

export const mockEscalations: Escalation[] = [
  {
    id: 'enq_002',
    customer: 'Rohan K.',
    channel: 'email',
    reason: 'Refund request — customer unhappy with invoice',
    urgency: 'high',
    receivedAt: minsAgo(12),
    summary:
      'Customer disputes a ₹4,200 line item on this month\'s invoice and is requesting a full refund. Tone is frustrated.',
  },
  {
    id: 'enq_006',
    customer: 'Marcus T.',
    channel: 'whatsapp',
    reason: 'Complaint — slow response time',
    urgency: 'high',
    receivedAt: minsAgo(90),
    summary:
      'Customer waited 48h without a reply and is threatening to leave a public review. Needs immediate outreach.',
  },
  {
    id: 'enq_010',
    customer: 'Jaya M.',
    channel: 'call',
    reason: 'Voicemail — possible cancellation',
    urgency: 'medium',
    receivedAt: minsAgo(165),
    summary:
      'Left a voicemail saying she is "thinking about switching providers". No specifics — likely a price-driven churn risk.',
  },
  {
    id: 'enq_011',
    customer: 'Omar S.',
    channel: 'email',
    reason: 'Technical issue — integration failing',
    urgency: 'medium',
    receivedAt: minsAgo(220),
    summary:
      'Webhook deliveries to their CRM started failing this morning. Has shared error logs in the thread.',
  },
];

// ---------------------------------------------------------------------------
// Follow-ups
// ---------------------------------------------------------------------------

export const mockFollowups: Followup[] = [
  {
    id: 'fu_001',
    enquiryId: 'enq_001',
    customer: 'Sarah M.',
    channel: 'whatsapp',
    dueAt: minsAhead(25),
    messagePreview: 'Hi Sarah, just checking — did the deluxe quote work for you?',
    status: 'pending',
  },
  {
    id: 'fu_002',
    enquiryId: 'enq_004',
    customer: 'Daniel O.',
    channel: 'call',
    dueAt: minsAhead(75),
    messagePreview: 'Daniel, ready to schedule the demo we discussed?',
    status: 'pending',
  },
  {
    id: 'fu_003',
    enquiryId: 'enq_008',
    customer: 'Vikram J.',
    channel: 'email',
    dueAt: minsAhead(180),
    messagePreview: 'Enterprise tier deck attached — happy to set up a call.',
    status: 'pending',
  },
  {
    id: 'fu_004',
    enquiryId: 'enq_009',
    customer: 'Hannah B.',
    channel: 'whatsapp',
    dueAt: minsAhead(360),
    messagePreview: 'Confirming tomorrow at 10am — see you then!',
    status: 'pending',
  },
  {
    id: 'fu_005',
    enquiryId: 'enq_005',
    customer: 'Aisha R.',
    channel: 'email',
    dueAt: minsAhead(720),
    messagePreview: 'Weekend hours are 10am–4pm — let us know if you\'d like to book.',
    status: 'pending',
  },
];

// ---------------------------------------------------------------------------
// Activity feed — interleaves recent events
// ---------------------------------------------------------------------------

export const mockActivity: ActivityItem[] = [
  {
    id: 'act_1',
    kind: 'qualified',
    customer: 'Sarah M.',
    channel: 'whatsapp',
    description: 'Auto-qualified as pricing enquiry',
    occurredAt: minsAgo(3),
    enquiryId: 'enq_001',
  },
  {
    id: 'act_2',
    kind: 'escalation',
    customer: 'Rohan K.',
    channel: 'email',
    description: 'Escalated — refund request',
    occurredAt: minsAgo(11),
    enquiryId: 'enq_002',
  },
  {
    id: 'act_3',
    kind: 'lead',
    customer: 'Priya N.',
    channel: 'whatsapp',
    description: 'New booking enquiry',
    occurredAt: minsAgo(22),
    enquiryId: 'enq_003',
  },
  {
    id: 'act_4',
    kind: 'followup',
    customer: 'Daniel O.',
    channel: 'call',
    description: 'Follow-up scheduled in 1h 15m',
    occurredAt: minsAgo(40),
    enquiryId: 'enq_004',
  },
  {
    id: 'act_5',
    kind: 'escalation',
    customer: 'Marcus T.',
    channel: 'whatsapp',
    description: 'Escalated — complaint about response time',
    occurredAt: minsAgo(88),
    enquiryId: 'enq_006',
  },
];

// ---------------------------------------------------------------------------
// Conversations — keyed by enquiry id
// ---------------------------------------------------------------------------

export const mockConversations: Record<string, Conversation> = {
  enq_001: {
    id: 'enq_001',
    customer: 'Sarah M.',
    channel: 'whatsapp',
    status: 'qualified',
    matchedSop: 'pricing_question',
    aiSummary:
      'Sarah is asking for a quote on the deluxe package. Auto-qualified as a pricing enquiry — Closira sent a templated response asking what she\'s looking for. Awaiting reply.',
    messages: [
      {
        id: 'm1',
        role: 'customer',
        content: 'Hi, can I get a quote for the deluxe package? How much does it cost?',
        createdAt: minsAgo(4),
      },
      {
        id: 'm2',
        role: 'ai',
        content:
          'Thanks for your interest! Pricing depends on the package — could you share a little more about what you\'re looking for so I can send the right quote?',
        createdAt: minsAgo(3),
      },
    ],
    timeline: [
      { id: 't1', fromStatus: null, toStatus: 'new', createdAt: minsAgo(4) },
      { id: 't2', fromStatus: 'new', toStatus: 'processing', createdAt: minsAgo(4) },
      { id: 't3', fromStatus: 'processing', toStatus: 'qualified', createdAt: minsAgo(3) },
    ],
  },
  enq_002: {
    id: 'enq_002',
    customer: 'Rohan K.',
    channel: 'email',
    status: 'escalated',
    matchedSop: 'complaint',
    aiSummary:
      'Rohan is disputing a charge on his most recent invoice and asking for a refund. Tone is frustrated. Auto-escalated — needs a senior account manager.',
    messages: [
      {
        id: 'm1',
        role: 'customer',
        content:
          'The pricing was completely wrong on my invoice. I want a refund — this is terrible. I\'ve been a customer for two years and this is the third time.',
        createdAt: minsAgo(12),
      },
      {
        id: 'm2',
        role: 'ai',
        content:
          'I\'m sorry to hear about this experience. I\'m flagging your case for a senior team member who will reach out within the next hour.',
        createdAt: minsAgo(11),
      },
      {
        id: 'm3',
        role: 'system',
        content: 'Escalated to human agent: complaint SOP matched, urgency flagged high.',
        createdAt: minsAgo(11),
      },
    ],
    timeline: [
      { id: 't1', fromStatus: null, toStatus: 'new', createdAt: minsAgo(12) },
      { id: 't2', fromStatus: 'new', toStatus: 'processing', createdAt: minsAgo(12) },
      {
        id: 't3',
        fromStatus: 'processing',
        toStatus: 'escalated',
        reason: 'Refund request — customer unhappy with invoice',
        createdAt: minsAgo(11),
      },
    ],
  },
  enq_003: {
    id: 'enq_003',
    customer: 'Priya N.',
    channel: 'whatsapp',
    status: 'new',
    aiSummary: 'New inbound enquiry about a booking for next Tuesday. Processing now.',
    messages: [
      {
        id: 'm1',
        role: 'customer',
        content: 'Looking to book a slot for next Tuesday around 4pm. Is that possible?',
        createdAt: minsAgo(23),
      },
    ],
    timeline: [
      { id: 't1', fromStatus: null, toStatus: 'new', createdAt: minsAgo(23) },
    ],
  },
  enq_006: {
    id: 'enq_006',
    customer: 'Marcus T.',
    channel: 'whatsapp',
    status: 'escalated',
    matchedSop: 'complaint',
    aiSummary:
      'Marcus has been waiting 48 hours without a reply and is threatening to leave a public review. High-priority outreach needed.',
    messages: [
      {
        id: 'm1',
        role: 'customer',
        content:
          "This is terrible service. I've been waiting two days for a reply. If I don't hear back today I'm going to leave a review.",
        createdAt: minsAgo(90),
      },
      {
        id: 'm2',
        role: 'ai',
        content:
          "I'm sorry to hear about this experience. I'm flagging your case for a senior team member who will reach out within the next hour.",
        createdAt: minsAgo(89),
      },
    ],
    timeline: [
      { id: 't1', fromStatus: null, toStatus: 'new', createdAt: minsAgo(90) },
      { id: 't2', fromStatus: 'new', toStatus: 'processing', createdAt: minsAgo(90) },
      {
        id: 't3',
        fromStatus: 'processing',
        toStatus: 'escalated',
        reason: 'Complaint — slow response time',
        createdAt: minsAgo(89),
      },
    ],
  },
};

export function getConversation(id: string): Conversation | undefined {
  return mockConversations[id];
}
