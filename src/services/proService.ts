import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SupabaseProfessional {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  languages: string[];
  image: string;
  verified: boolean;
  services: any[];
  bio: string;
  testimonials: any[];
  phone: string;
  email: string;
  website: string;
  experience: string;
  location: string;
  lat: number;
  lng: number;
  created_at?: string;
}

export const proService = {
  isAdmin(email?: string | null) {
    const adminEmails = ['vincentdurroux@gmail.com']; // You can add more admins here
    return !!email && adminEmails.includes(email);
  },

  async getProfessionals() {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty list');
      return [];
    }

    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching professionals:', error);
      throw error;
    }

    return data.map((item: SupabaseProfessional) => ({
      ...item,
      coordinates: item.lat && item.lng ? { lat: item.lat, lng: item.lng } : undefined,
      services: typeof item.services === 'string' ? JSON.parse(item.services) : item.services || [],
      testimonials: typeof item.testimonials === 'string' ? JSON.parse(item.testimonials) : item.testimonials || [],
      languages: typeof item.languages === 'string' ? JSON.parse(item.languages) : item.languages || []
    }));
  },

  async submitRecommendation(recommendation: {
    user_email: string;
    pro_name: string;
    pro_category: string;
    pro_contact?: string;
    notes?: string;
  }) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('recommendations')
      .insert([recommendation]);

    if (error) throw error;
    return data;
  },

  async getRecommendations() {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
