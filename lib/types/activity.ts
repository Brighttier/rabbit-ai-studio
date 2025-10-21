/**
 * Admin Activity Types
 */

export type ActivityType = 
  | 'chat_created'
  | 'image_generated'
  | 'model_updated'
  | 'user_registered'
  | 'model_seeded'
  | 'system_error';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  userId: string;
  userEmail?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface ActivityLog {
  activities: Activity[];
  hasMore: boolean;
  lastTimestamp?: Date;
}