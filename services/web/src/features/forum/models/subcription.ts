export interface ProjectSubscriptionStatus {
  project_id: number;
  subscribed: boolean;
}

export interface ProjectSubscriberCount {
  project_id: number;
  subscriber_count: number;
}

export interface ProjectSubscriptionRow {
  project_id: number;
  user_id: number;
  subscribed_at: string;
}

export interface ActionResponse {
  message: string;
}
