import { Model, Document, ObjectId } from "mongoose";

interface Accommodation {
  name: string;
  description: string;
  city: string;
  maxGuests: number;
  host: ObjectId;
}

export interface AccommodationDocument extends Accommodation, Document {}
