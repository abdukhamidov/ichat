export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface Account {
  id: string;
  igUserId: string;
  username: string;
  profilePic: string | null;
  followersCount: number;
  tokenExpiry: string;
  webhookActive: boolean;
  createdAt: string;
  automationCount: number;
}

export interface Button {
  label: string;
  url: string;
}

export interface AutomationStats {
  triggered: number;
  dmsSent: number;
  linksClicked: number;
}

export interface Automation {
  id: string;
  accountId: string;
  accountUsername?: string;
  accountProfilePic?: string | null;
  name: string;
  isActive: boolean;
  triggerType: string;
  keywords: string[];
  exactMatch: boolean;
  checkFollow: boolean;
  welcomeMsg: string;
  noFollowMsg: string | null;
  afterFollowMsg: string | null;
  reminderMsg: string | null;
  reminderDelay: number | null;
  extraMsg: string | null;
  extraDelay: number | null;
  buttons: Button[] | null;
  commentReplies: string[];
  stats: AutomationStats | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationLog {
  id: string;
  automationId: string;
  contactIgId: string;
  contactName: string | null;
  triggerType: string;
  triggerText: string | null;
  dmSent: boolean;
  error: string | null;
  createdAt: string;
}

export interface Contact {
  id: string;
  accountId: string;
  igUserId: string;
  username: string;
  fullName: string | null;
  profilePic: string | null;
  tags: string[];
  notes: string | null;
  followsUs: boolean | null;
  firstContact: string;
  lastContact: string;
  dmCount: number;
}

export interface ContactsResponse {
  items: Contact[];
  total: number;
}

export interface AnalyticsSummary {
  triggered: number;
  dmsSent: number;
  linksClicked: number;
  conversionRate: number;
  daily: Record<string, number>;
  accounts: {
    id: string;
    username: string;
    profilePic: string | null;
    triggered: number;
    dmsSent: number;
    linksClicked: number;
  }[];
  errors: {
    id: string;
    error: string;
    contactName: string | null;
    createdAt: string;
  }[];
}

export interface AutomationFormData {
  accountId: string;
  name: string;
  triggerType: string;
  keywords: string[];
  exactMatch: boolean;
  checkFollow: boolean;
  welcomeMsg: string;
  noFollowMsg: string;
  afterFollowMsg: string;
  reminderMsg: string;
  reminderDelay: number;
  extraMsg: string;
  extraDelay: number;
  buttons: Button[];
  commentReplies: string[];
  enableReminder: boolean;
  enableExtra: boolean;
  enableCommentReply: boolean;
  triggerDM: boolean;
  triggerComment: boolean;
}
