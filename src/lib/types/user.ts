export type UserProfileDTO = {
  id: string;
  name: string;
  image?: string;
  bio?: string;
  isPrivate?: boolean;
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
