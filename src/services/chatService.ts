import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Conversation {
  id: string;
  created_at: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  created_at: string;
  conversation_id: string;
  sender_id: string;
  content: string;
}

export const chatService = {
  // Récupérer ou créer une conversation entre deux utilisateurs
  async getOrCreateConversation(user1Id: string, user2Id: string) {
    if (!isSupabaseConfigured) return null;

    // Chercher si une conversation existe déjà (dans les deux sens)
    const { data: existing, error: searchError } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(participant_1.eq.${user1Id},participant_2.eq.${user2Id}),and(participant_1.eq.${user2Id},participant_2.eq.${user1Id})`)
      .maybeSingle();

    if (existing) return existing as Conversation;

    // Sinon, la créer
    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert([
        { participant_1: user1Id, participant_2: user2Id }
      ])
      .select()
      .single();

    if (createError) throw createError;
    return created as Conversation;
  },

  // Récupérer les messages d'une conversation
  async getMessages(conversationId: string) {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
  },

  // Envoyer un message
  async sendMessage(conversationId: string, senderId: string, content: string) {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('messages')
      .insert([
        { conversation_id: conversationId, sender_id: senderId, content }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Message;
  },

  // S'abonner aux nouveaux messages en temps réel
  subscribeToMessages(conversationId: string, onNewMessage: (message: Message) => void) {
    if (!isSupabaseConfigured) return () => {};

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          onNewMessage(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
