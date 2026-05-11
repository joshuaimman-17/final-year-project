export interface Listing {
  id: string;
  farmer_id: string;
  farm_id: string;
  crop_name: string;
  category: string;
  price_per_unit: number;
  unit: string;
  available_quantity: number;
  status: "ACTIVE" | "SOLD_OUT" | "ARCHIVED";
  image_urls: string[];
  is_organic?: boolean;
  created_at?: string;
  seller_id?: string; // Adding for convenience
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: any[];
  shipping_address?: string | any;
}
