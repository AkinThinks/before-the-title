export interface Submission {
  id: string;
  created_at: string;
  source: "in-person" | "online";
  reflection: string;
  artwork_url: string | null;
  download_url: string | null;
  consent: boolean;
  short_film_opt_in: boolean;
  website_social_opt_in: boolean;
  name: string | null;
  email: string | null;
  context: string | null;
  participant_type: "in-person" | "online";
  selected_for_short_film: boolean;
  selected_for_website: boolean;
  selected_for_social: boolean;
  curator_notes: string;
  moderation_status: "pending" | "approved" | "rejected";
}

export type Screen =
  | "welcome"
  | "reflect"
  | "consent"
  | "generating"
  | "artwork"
  | "contribute"
  | "confirmation";

export interface AppState {
  screen: Screen;
  reflection: string;
  artworkUrl: string | null;
  submissionId: string | null;
  source: "in-person" | "online";
}
