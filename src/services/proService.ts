import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SupabaseProfessional {
  id: string;
  name: string;
  company_name?: string;
  profession: string;
  rating: number;
  reviews_count?: number;
  languages: string[];
  image_url: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  location: string;
  lat?: number;
  lng?: number;
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

    console.log('[proService] Raw data from Supabase:', data);

    const mappedData = data.map((item: any) => {
      // Normalize lat/lng from columns, handling strings if necessary
      let lat = typeof item.lat === 'string' ? parseFloat(item.lat) : item.lat;
      let lng = typeof item.lng === 'string' ? parseFloat(item.lng) : item.lng;
      let displayLocation = item.location || '';

      // Fallback: Check if coordinates are bundled in the location field if columns are empty/invalid
      // We check both lat and lng to be safe, using a small epsilon
      const hasValidColumns = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && 
                              (Math.abs(lat) > 0.0001 || Math.abs(lng) > 0.0001);
      
      if (!hasValidColumns && typeof displayLocation === 'string' && (displayLocation.startsWith('GEO:') || displayLocation.includes('GEO:'))) {
        try {
          // More flexible regex to match GEO:lat,lng|Address even if there are spaces
          const geoMatch = displayLocation.match(/GEO:\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\|(.*)/);
          if (geoMatch) {
            lat = parseFloat(geoMatch[1]);
            lng = parseFloat(geoMatch[2]);
            displayLocation = geoMatch[3].trim();
            console.log(`[proService] Recovered coordinates from location bundle for ${item.name || 'Pro'}: ${lat}, ${lng}`);
          }
        } catch (e) {
          console.error('[proService] Error parsing bundled coordinates:', e);
        }
      }

      return {
        ...item,
        location: displayLocation,
        category: item.profession || item.category, // Map profession to category for frontend compatibility
        image: item.image_url || item.image, // Map image_url or image for frontend compatibility
        bio: item.description || item.bio, // Map description to bio for frontend compatibility
        reviews_count: item.reviews_count || 0, // Fallback to 0 if column is missing
        languages: typeof item.languages === 'string' ? JSON.parse(item.languages) : item.languages || [],
        coordinates: (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && (Math.abs(lat) > 0.0001 || Math.abs(lng) > 0.0001)) ? 
          { lat, lng } : null
      };
    });

    console.log('[proService] Mapped data from Supabase:', mappedData);
    return mappedData;
  },

  async createProfessional(pro: any) {
    if (!isSupabaseConfigured) return null;

    // Normalize coordinates and ensure they are numbers
    let lat = typeof pro.lat === 'string' ? parseFloat(pro.lat) : pro.lat;
    let lng = typeof pro.lng === 'string' ? parseFloat(pro.lng) : pro.lng;
    
    // Fallback back to 0 if NaN
    if (isNaN(lat)) lat = 0;
    if (isNaN(lng)) lng = 0;

    // Strip existing GEO: prefix if somehow present
    let cleanLocation = pro.location || '';
    if (typeof cleanLocation === 'string' && cleanLocation.startsWith('GEO:')) {
      const match = cleanLocation.match(/^GEO:[\d.-]+,[\d.-]+\|(.*)$/);
      if (match) cleanLocation = match[1];
    }

    const finalPro: any = {
      name: pro.name,
      company_name: pro.company_name,
      profession: pro.profession || pro.category,
      rating: pro.rating,
      languages: pro.languages,
      image_url: pro.image_url || pro.image,
      description: pro.description || pro.bio,
      phone: pro.phone,
      email: pro.email,
      website: pro.website,
      instagram: pro.instagram,
      lat: lat,
      lng: lng,
      location: cleanLocation
    };

    // Remove undefined values to avoid Supabase errors
    Object.keys(finalPro).forEach(key => {
      if (finalPro[key] === undefined) {
        delete finalPro[key];
      }
    });

    console.log('[proService] Creating pro with payload:', JSON.stringify(finalPro, null, 2));
    const { data: insertData, error } = await supabase
      .from('professionals')
      .insert([finalPro])
      .select();

    if (error) {
      console.error('Supabase create error:', error);
      throw error;
    }
    return insertData;
  },

  async updateProfessional(id: string | number, pro: any) {
    if (!isSupabaseConfigured) return null;

    console.log('[proService] updateProfessional requested for ID:', id);

    // Normalize ID - only parse as int if it's strictly digit-only
    let finalId = id;
    if (typeof id === 'string' && /^\d+$/.test(id)) {
      finalId = parseInt(id, 10);
      console.log('[proService] Normalized numeric string ID to number:', finalId);
    }

    // Diagnostic: Check auth state
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[proService] Current user:', session?.user?.email || 'Anonymous');

    // Diagnostic: Check if record exists before update and get its current state to see columns
    const { data: existingRecord, error: checkError } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', finalId)
      .maybeSingle();
    
    if (checkError) {
      console.error('[proService] Error fetching existing record:', checkError);
    }
    
    if (!existingRecord) {
      console.warn('[proService] Record not found in database for ID:', finalId);
      return { 
        success: false, 
        message: `Professional with ID ${finalId} not found. Please refresh the page.` 
      };
    }

    console.log('[proService] Found record. Comparing IDs - Input:', finalId, 'DB:', existingRecord.id);

    // Normalize coordinates
    let lat = typeof pro.lat === 'string' ? parseFloat(pro.lat) : pro.lat;
    let lng = typeof pro.lng === 'string' ? parseFloat(pro.lng) : pro.lng;
    if (isNaN(lat)) lat = 0;
    if (isNaN(lng)) lng = 0;

    // Clean location (remove GEO: prefix if provided in input)
    let cleanLocation = pro.location || '';
    if (typeof cleanLocation === 'string' && cleanLocation.startsWith('GEO:')) {
      const match = cleanLocation.match(/^GEO:[\d.-]+,[\d.-]+\|(.*)$/);
      if (match) cleanLocation = match[1];
    }

    // Build payload dynamically based on existing columns in the table
    // and ONLY include fields that have actually changed to minimize RLS conflicts
    const columns = Object.keys(existingRecord);
    const updatePayload: any = {};
    
    const setIfChanged = (colName: string, newValue: any, existingValue: any) => {
      if (!columns.includes(colName)) return;
      
      // Basic comparison
      let isChanged = false;
      if (Array.isArray(newValue) && Array.isArray(existingValue)) {
        isChanged = JSON.stringify(newValue) !== JSON.stringify(existingValue);
      } else if (typeof newValue === 'number' && typeof existingValue === 'number') {
        isChanged = Math.abs(newValue - existingValue) > 0.000001;
      } else {
        isChanged = String(newValue || '') !== String(existingValue || '');
      }

      if (isChanged) {
        updatePayload[colName] = newValue;
      }
    };

    setIfChanged('name', pro.name, existingRecord.name);
    setIfChanged('company_name', pro.company_name, existingRecord.company_name);
    
    // Profession mapping
    const newProfession = pro.profession || pro.category;
    const existingProfession = existingRecord.profession || existingRecord.category;
    if (columns.includes('profession')) {
      setIfChanged('profession', newProfession, existingRecord.profession);
    } else if (columns.includes('category')) {
      setIfChanged('category', newProfession, existingRecord.category);
    }

    setIfChanged('rating', pro.rating, existingRecord.rating);
    setIfChanged('languages', Array.isArray(pro.languages) ? pro.languages : [], existingRecord.languages);
    
    // Image mapping
    const newImageUrl = pro.image_url || pro.image;
    if (columns.includes('image_url')) {
      setIfChanged('image_url', newImageUrl, existingRecord.image_url);
    }
    if (columns.includes('image')) {
      setIfChanged('image', newImageUrl, existingRecord.image);
    }
    if (columns.includes('avatar_url')) {
      setIfChanged('avatar_url', newImageUrl, existingRecord.avatar_url);
    }

    // Description/Bio mapping
    const newBio = pro.description || pro.bio;
    if (columns.includes('description')) {
      setIfChanged('description', newBio, existingRecord.description);
    }
    if (columns.includes('bio')) {
      setIfChanged('bio', newBio, existingRecord.bio);
    }

    setIfChanged('phone', pro.phone, existingRecord.phone);
    setIfChanged('email', pro.email, existingRecord.email);
    setIfChanged('website', pro.website, existingRecord.website);
    setIfChanged('instagram', pro.instagram, existingRecord.instagram);
    setIfChanged('lat', lat, existingRecord.lat);
    setIfChanged('lng', lng, existingRecord.lng);
    setIfChanged('location', cleanLocation, existingRecord.location);

    // Remove undefined
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    if (Object.keys(updatePayload).length === 0) {
      console.log('[proService] No fields changed, skipping update call.');
      return { success: true, data: existingRecord };
    }

    console.log('[proService] Executing UPDATE. ID:', finalId, 'Payload:', JSON.stringify(updatePayload, null, 2));
    
    const { data: updateData, error } = await supabase
      .from('professionals')
      .update(updatePayload)
      .eq('id', finalId)
      .select();

    if (error) {
      console.error('[proService] Supabase update ERROR:', error);
      return { success: false, message: `Database error: ${error.message}` };
    }
    
    if (!updateData || updateData.length === 0) {
      console.warn('[proService] UPDATE succeeded but returned no rows. This usually means Row Level Security (RLS) policies are preventing this user from updating this specific record or no fields actually changed.');
      return { 
        success: false, 
        message: 'The update was rejected by the database. This usually happens if you are not logged in as an administrator or do not have permission to modify this record.' 
      };
    }

    console.log('[proService] Update SUCCESS. New data:', updateData[0]);
    return { success: true, data: updateData[0] };
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
