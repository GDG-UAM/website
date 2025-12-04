export type PublicEvent = {
  _id: string;
  title: string;
  slug: string;
  date: string; // ISO string
  location: string;
  image?: string;
  imageBlurHash?: string; // BlurHash placeholder for the image
  blogUrl?: string;
};
