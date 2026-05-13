import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SupabaseProfessional {
  id: string;
  name: string;
  company_name?: string;
  profession: string;
  rating: number;
  languages: string[];
  image_url: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  location: string;
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

    return data.map((item: any) => ({
      ...item,
      category: item.profession, // Map profession to category for frontend compatibility
      image: item.image_url, // Map image_url to image for frontend compatibility
      bio: item.description, // Map description to bio for frontend compatibility
      languages: typeof item.languages === 'string' ? JSON.parse(item.languages) : item.languages || []
    }));
  },

  async createProfessional(pro: any) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('professionals')
      .insert([pro]);

    if (error) throw error;
    return data;
  },

  async submitRecommendation(recommendation: {
    user_email: string;
    pro_name?: string;
    company_name?: string;
    pro_category: string;
    pro_email?: string;
    pro_phone?: string;
    pro_image_url?: string;
    notes: string;
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
  },

  async updateRecommendationStatus(id: string, status: 'pending' | 'validated' | 'refused', adminNotes?: string | null) {
    if (!isSupabaseConfigured) return null;

    const updatePayload: any = { status };
    if (adminNotes !== undefined) {
      updatePayload.admin_notes = adminNotes;
    } else if (status === 'pending' || status === 'validated') {
      // Clear notes when moving away from refused status unless specifically provided
      updatePayload.admin_notes = null;
    }

    const { data, error } = await supabase
      .from('recommendations')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error(`No recommendation found with ID: ${id}`);
    }

    return data;
  }
};
