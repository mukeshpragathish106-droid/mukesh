import { User } from './user.model';

export type ComplaintCategory =
  | 'Electrical'
  | 'Plumbing & Water'
  | 'Furniture & Benches'
  | 'Wi-Fi & Network'
  | 'HVAC & Fans'
  | 'Classroom Maintenance'
  | 'Cleanliness & Sanitation'
  | 'Other';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Emergency';
export type ComplaintStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected';

export interface LocationInfo {
  building: string;
  floor: string;
  room: string;
  landmark?: string;
}

export interface TimelineEntry {
  status: string;
  message: string;
  updatedBy: string;
  timestamp: string;
}

export interface FeedbackInfo {
  rating: number;
  comment?: string;
  submittedAt?: string;
}

export interface Complaint {
  _id: string;
  id?: string;
  complaintId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  location: LocationInfo;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  images: string[];
  submittedBy: User;
  assignedTo?: User | null;
  assignedAt?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string;
  resolutionProofImage?: string;
  estimatedHours?: number;
  upvotes: string[];
  timeline: TimelineEntry[];
  feedback?: FeedbackInfo | null;
  duplicateOf?: string | null;
  createdAt: string;
  updatedAt: string;
}
