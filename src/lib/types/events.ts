export type PublicEvent = {
  _id: string;
  title: string;
  slug: string;
  date: string; // ISO string
  location: string;
  image?: string;
  blogUrl?: string;
};
