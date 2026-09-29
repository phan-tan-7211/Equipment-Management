export interface SessionOrganization {
  id: string;
  name: string;
  plan: 'free' | 'premium';
  memberCount: number;
  maxMembers: number;
  features: string[];
  billingCycle?: 'monthly' | 'yearly';
  nextBillingDate?: string;
  logo?: string;
  backgroundColor?: string;
  scanLocationCollectionEnabled: boolean;
  inventoryDefaultLocationName?: string;
  inventoryDefaultLocationAddress?: string;
  inventoryDefaultLocationCity?: string;
  inventoryDefaultLocationState?: string;
  inventoryDefaultLocationCountry?: string;
  inventoryDefaultLocationLat?: number;
  inventoryDefaultLocationLng?: number;
  userRole: 'owner' | 'admin' | 'member';
  userStatus: 'active' | 'pending' | 'inactive';
}

export interface SessionTeamMembership {
  teamId: string;
  teamName: string;
  role: 'manager' | 'technician' | 'requestor' | 'viewer';
  joinedDate: string;
  /**
   * Effective configurable permissions for this team (organization owner
   * overrides applied). Absent when they could not be loaded; callers then use
   * the built-in defaults, and the database still enforces the real rule.
   */
  permissions?: Array<'equipment.create' | 'equipment.update'>;
}

export interface SessionData {
  organizations: SessionOrganization[];
  currentOrganizationId: string | null;
  teamMemberships: SessionTeamMembership[];
  lastUpdated: string;
  version: number;
}
