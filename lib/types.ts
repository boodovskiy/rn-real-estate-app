import { Property } from "@/components/Cards";
import { Models } from "react-native-appwrite";

export interface GalleryItem extends Models.Document {
  image: string;
  property?: string; // Optional, for the link to property $id
}

export interface Review extends Models.Document {
  avatar: string;
  name: string;
  review: string;
  rating?: number;
  property?: string;
}

export interface PropertyWithDetails extends Property {
  gallery: GalleryItem[];
  reviews: Review[];
}
