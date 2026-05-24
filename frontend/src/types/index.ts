/**
 * Domain types.
 *
 * Mirrors the backend Pydantic schemas. Mock data and (eventually) the real
 * API both produce values that satisfy these — keeping a single shape means
 * components stay agnostic of where data came from.
 */

export type Channel = 'whatsapp' | 'email' | 'call';

export type EnquiryStatus =
  | 'new'
  | 'processing'
  | 'qualified'
  | 'escalated'
  | 'resolved';

export type Urgency = 'high' | 'medium' | 'low';

export type MessageRole = 'customer' | 'agent' | 'system' | 'ai';

export interface Lead {
  id: string;
  customer: string;
  channel: Channel;
  status: EnquiryStatus;
  preview: string;
  receivedAt: string; // ISO timestamp
  matchedSop?: string;
}

export interface Escalation {
  id: string;
  customer: string;
  channel: Channel;
  reason: string;
  urgency: Urgency;
  receivedAt: string;
  summary: string;
}

export interface Followup {
  id: string;
  enquiryId: string;
  customer: string;
  channel: Channel;
  dueAt: string;
  messagePreview: string;
  status: 'pending' | 'sent' | 'cancelled';
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  fromStatus: EnquiryStatus | null;
  toStatus: EnquiryStatus;
  reason?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  customer: string;
  channel: Channel;
  status: EnquiryStatus;
  matchedSop?: string;
  aiSummary: string;
  messages: ConversationMessage[];
  timeline: TimelineEntry[];
}

export interface DashboardStats {
  leadsToday: number;
  leadsTodayDelta: number; // vs yesterday
  missedEnquiries: number;
  openEscalations: number;
  followupsDue: number;
}

export interface ActivityItem {
  id: string;
  kind: 'lead' | 'escalation' | 'followup' | 'qualified';
  customer: string;
  channel: Channel;
  description: string;
  occurredAt: string;
  enquiryId?: string;
}
