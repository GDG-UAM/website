export type UserProfileDTO = {
  id: string;
  name: string;
  image?: string;
  bio?: string;
  isPrivate?: boolean;
  role?: "user" | "team" | "admin";
  customTags?: Array<"founder" | "president" | "vice-president" | "treasurer" | "secretary">;
  socials: {
    website?: string;
    github?: string;
    linkedin?: string;
    x?: string;
    instagram?: string;
    // Allow unknown future keys without breaking
    [k: string]: string | undefined;
  };
};
