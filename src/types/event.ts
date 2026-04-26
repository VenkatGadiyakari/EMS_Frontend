export const EventStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CANCELLED: 'CANCELLED',
} as const;

export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const EventCategory = {
  CONCERT: 'CONCERT',
  SPORTS: 'SPORTS',
  CONFERENCE: 'CONFERENCE',
  OTHER: 'OTHER',
} as const;

export type EventCategory = (typeof EventCategory)[keyof typeof EventCategory];

export const TicketTierStatus = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  SOLD_OUT: 'SOLD_OUT',
} as const;

export type TicketTierStatus = (typeof TicketTierStatus)[keyof typeof TicketTierStatus];

export interface Venue {
  id: string;
  name: string;
  address?: string;
  city: string;
  country?: string;
  capacity?: number;
}

export interface TicketTier {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  totalQty: number;
  remainingQty: number;
  maxPerOrder: number;
  status: TicketTierStatus;
  saleStartsAt?: string;
  saleEndsAt?: string;
  createdAt?: string;
  updatedAt?: string;
  hasConfirmedOrders?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  category: EventCategory;
  eventDate: string;
  status: EventStatus;
  bannerImageUrl?: string;
  organiserId?: string;
  venueId?: string;
  venueName?: string;
  venue: Venue;
  tiers?: TicketTier[];
  tierCount?: number;
}

export interface EventSummary {
  id: string;
  title: string;
  category: EventCategory;
  eventDate: string;
  city: string;
  lowestPrice: number;
  bannerImageUrl?: string;
  status?: EventStatus;
  venue?: {
    name: string;
    city: string;
  };
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number?: number;
  currentPage?: number;
  pageSize?: number;
}

export interface TierDeletionCheck {
  canDelete: boolean;
  orderCount: number;
  tierName: string;
  message: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  category: EventCategory;
  eventDate: string;
  venueId: string;
  bannerImageUrl?: string;
}

export interface UpdateEventRequest {
  title: string;
  description?: string;
  category: EventCategory;
  eventDate?: string;
  venueId?: string;
  bannerImageUrl?: string;
}

export interface CreateTierRequest {
  name: string;
  description?: string;
  price: number;
  totalQty: number;
  maxPerOrder: number;
  saleStartsAt?: string;
  saleEndsAt?: string;
}

export interface UpdateTierRequest extends CreateTierRequest {}

export interface TierSalesDto {
  tierId: string;
  tierName: string;
  totalQty: number;
  remainingQty: number;
  soldQty: number;
  revenue: number;
}

export interface SalesSummaryResponse {
  eventId: string;
  eventTitle: string;
  totalOrders: number;
  totalRevenue: number;
  tiers: TierSalesDto[];
}
