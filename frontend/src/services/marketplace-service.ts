import apiClient from "./api-client";
import { Listing, Order } from "../types/marketplace";

export const marketplaceService = {
  async searchListings(params: any): Promise<Listing[]> {
    const response = await apiClient.get("/marketplace/listings", { params });
    return response.data;
  },

  async getListing(id: string): Promise<Listing> {
    const response = await apiClient.get(`/marketplace/listings/${id}`);
    return response.data;
  },

  async createListing(payload: any): Promise<Listing> {
    const response = await apiClient.post("/marketplace/listings", payload);
    return response.data;
  },

  async placeOrder(payload: any): Promise<Order> {
    const response = await apiClient.post("/marketplace/orders", payload);
    return response.data;
  },

  async getOrderHistory(): Promise<Order[]> {
    const response = await apiClient.get("/marketplace/orders/history");
    return response.data;
  },

  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    const response = await apiClient.patch(`/marketplace/orders/${orderId}/status`, status, {
      headers: { "Content-Type": "application/json" }
    });
    return response.data;
  }
};
