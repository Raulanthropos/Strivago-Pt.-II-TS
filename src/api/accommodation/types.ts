import { Model, Document, ObjectId } from "mongoose";

interface Accommodation {
  name: string;
  host: ObjectId;
  description: string;
  maxGuests: number;
  city: string;
}

export interface AccommodationDocument extends Accommodation, Document {}

export interface AccommodationsModel extends Model<AccommodationDocument> {}