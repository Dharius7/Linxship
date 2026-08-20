/**
 * Supabase database types for the schema in `supabase/migrations`.
 *
 * Keep this file in sync with migrations, or replace it with the output of
 * `supabase gen types typescript` after connecting the production project.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          details: Json;
          entity_id: string | null;
          entity_type: string;
          id: string;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          details?: Json;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          details?: Json;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
        };
        Relationships: [];
      };
      admin_profiles: {
        Row: {
          created_at: string;
          display_name: string;
          is_active: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          is_active?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          is_active?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          is_read: boolean;
          message: string;
          name: string;
          read_at: string | null;
          read_by: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          is_read?: boolean;
          message: string;
          name: string;
          read_at?: string | null;
          read_by?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          name?: string;
          read_at?: string | null;
          read_by?: string | null;
        };
        Relationships: [];
      };
      shipment_messages: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          message: string;
          shipment_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          message: string;
          shipment_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          message?: string;
          shipment_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "shipment_messages_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      shipment_statuses: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_terminal: boolean;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_terminal?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_terminal?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      shipments: {
        Row: {
          billing_status: string;
          cargo_image_path: string | null;
          collection_date: string;
          created_at: string;
          created_by: string | null;
          currency: string;
          current_status: string;
          delivery_date: string | null;
          destination: string;
          freight_price: number;
          id: string;
          insurance: number;
          is_delivered: boolean;
          office_of_origin: string;
          package_description: string;
          package_value: number;
          payment_status: string;
          quantity: number;
          recipient_address: string;
          recipient_email: string | null;
          recipient_name: string;
          recipient_phone: string | null;
          sender_address: string;
          sender_email: string | null;
          sender_name: string;
          sender_phone: string | null;
          service_type: string;
          shipment_details: string | null;
          show_billing: boolean;
          tracking_number: string;
          updated_at: string;
          updated_by: string | null;
          weight: number;
          weight_unit: string;
        };
        Insert: {
          billing_status?: string;
          cargo_image_path?: string | null;
          collection_date: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          current_status?: string;
          delivery_date?: string | null;
          destination: string;
          freight_price?: number;
          id?: string;
          insurance?: number;
          is_delivered?: boolean;
          office_of_origin: string;
          package_description: string;
          package_value?: number;
          payment_status?: string;
          quantity?: number;
          recipient_address: string;
          recipient_email?: string | null;
          recipient_name: string;
          recipient_phone?: string | null;
          sender_address: string;
          sender_email?: string | null;
          sender_name: string;
          sender_phone?: string | null;
          service_type: string;
          shipment_details?: string | null;
          show_billing?: boolean;
          tracking_number: string;
          updated_at?: string;
          updated_by?: string | null;
          weight?: number;
          weight_unit?: string;
        };
        Update: {
          billing_status?: string;
          cargo_image_path?: string | null;
          collection_date?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          current_status?: string;
          delivery_date?: string | null;
          destination?: string;
          freight_price?: number;
          id?: string;
          insurance?: number;
          is_delivered?: boolean;
          office_of_origin?: string;
          package_description?: string;
          package_value?: number;
          payment_status?: string;
          quantity?: number;
          recipient_address?: string;
          recipient_email?: string | null;
          recipient_name?: string;
          recipient_phone?: string | null;
          sender_address?: string;
          sender_email?: string | null;
          sender_name?: string;
          sender_phone?: string | null;
          service_type?: string;
          shipment_details?: string | null;
          show_billing?: boolean;
          tracking_number?: string;
          updated_at?: string;
          updated_by?: string | null;
          weight?: number;
          weight_unit?: string;
        };
        Relationships: [];
      };
      tracking_events: {
        Row: {
          billing_amount: number;
          created_at: string;
          created_by: string | null;
          event_time: string;
          id: string;
          location: string;
          requires_payment: boolean;
          shipment_id: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          billing_amount?: number;
          created_at?: string;
          created_by?: string | null;
          event_time: string;
          id?: string;
          location: string;
          requires_payment?: boolean;
          shipment_id: string;
          status: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          billing_amount?: number;
          created_at?: string;
          created_by?: string | null;
          event_time?: string;
          id?: string;
          location?: string;
          requires_payment?: boolean;
          shipment_id?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_events_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_active_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      submit_contact_message: {
        Args: {
          p_email: string;
          p_message: string;
          p_name: string;
          p_website?: string;
        };
        Returns: string;
      };
      track_shipment: {
        Args: { p_tracking_number: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];
type PublicTableName = keyof PublicSchema["Tables"];

export type Tables<TableName extends PublicTableName> =
  PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends PublicTableName> =
  PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends PublicTableName> =
  PublicSchema["Tables"][TableName]["Update"];

