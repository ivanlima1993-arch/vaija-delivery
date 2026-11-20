export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      franchise_leads: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          city: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone: string
          city: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string
          city?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          facebook_url: string | null
          franchisee_id: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          name: string
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          facebook_url?: string | null
          franchisee_id?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          name: string
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          facebook_url?: string | null
          franchisee_id?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          name?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          city_id: string | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          establishment_id: string | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order_value: number | null
          neighborhood_id: string | null
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          city_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          establishment_id?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          neighborhood_id?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          city_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          establishment_id?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          neighborhood_id?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          order_id: string | null
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          order_id?: string | null
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          order_id?: string | null
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string | null
          agency: string | null
          bank_code: string | null
          bank_name: string | null
          created_at: string
          establishment_id: string
          holder_document: string | null
          holder_name: string | null
          id: string
          pix_key: string | null
          pix_key_type: string | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          establishment_id: string
          holder_document?: string | null
          holder_name?: string | null
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          establishment_id?: string
          holder_document?: string | null
          holder_name?: string | null
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_bank_accounts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: true
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          establishment_id: string
          id: string
          paid_at: string | null
          period: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          establishment_id: string
          id?: string
          paid_at?: string | null
          period: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          establishment_id?: string
          id?: string
          paid_at?: string | null
          period?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_invoices_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_payment_methods: {
        Row: {
          created_at: string
          description: string | null
          establishment_id: string
          id: string
          is_enabled: boolean
          method_key: string
          method_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          establishment_id: string
          id?: string
          is_enabled?: boolean
          method_key: string
          method_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          establishment_id?: string
          id?: string
          is_enabled?: boolean
          method_key?: string
          method_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_payment_methods_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_settings: {
        Row: {
          cashback_enabled: boolean
          cashback_percent: number
          created_at: string
          establishment_id: string
          id: string
          loyalty_enabled: boolean
          loyalty_reward_description: string | null
          loyalty_stamps_required: number
          own_delivery_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          cashback_enabled?: boolean
          cashback_percent?: number
          created_at?: string
          establishment_id: string
          id?: string
          loyalty_enabled?: boolean
          loyalty_reward_description?: string | null
          loyalty_stamps_required?: number
          own_delivery_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          cashback_enabled?: boolean
          cashback_percent?: number
          created_at?: string
          establishment_id?: string
          id?: string
          loyalty_enabled?: boolean
          loyalty_reward_description?: string | null
          loyalty_stamps_required?: number
          own_delivery_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_settings_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: true
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_withdrawals: {
        Row: {
          amount: number
          created_at: string
          establishment_id: string
          id: string
          processed_at: string | null
          requested_at: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          establishment_id: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          establishment_id?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_withdrawals_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          address: string | null
          category: string
          city: string | null
          city_id: string | null
          cover_url: string | null
          cpf_cnpj: string | null
          created_at: string
          delivery_fee: number | null
          description: string | null
          id: string
          is_approved: boolean | null
          is_open: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          max_delivery_time: number | null
          min_delivery_time: number | null
          min_order_value: number | null
          name: string
          neighborhood: string | null
          opening_hours: Json | null
          owner_id: string
          phone: string | null
          rating: number | null
          total_reviews: number | null
          updated_at: string
          whatsapp_chatbot_enabled: boolean | null
          whatsapp_closing_message: string | null
          whatsapp_enabled: boolean | null
          whatsapp_instance_name: string | null
          whatsapp_status: string | null
          whatsapp_welcome_message: string | null
        }
        Insert: {
          address?: string | null
          category?: string
          city?: string | null
          city_id?: string | null
          cover_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          delivery_fee?: number | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          is_open?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_delivery_time?: number | null
          min_delivery_time?: number | null
          min_order_value?: number | null
          name: string
          neighborhood?: string | null
          opening_hours?: Json | null
          owner_id: string
          phone?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string
          whatsapp_chatbot_enabled?: boolean | null
          whatsapp_closing_message?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_instance_name?: string | null
          whatsapp_status?: string | null
          whatsapp_welcome_message?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string | null
          city_id?: string | null
          cover_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          delivery_fee?: number | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          is_open?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_delivery_time?: number | null
          min_delivery_time?: number | null
          min_order_value?: number | null
          name?: string
          neighborhood?: string | null
          opening_hours?: Json | null
          owner_id?: string
          phone?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string
          whatsapp_chatbot_enabled?: boolean | null
          whatsapp_closing_message?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_instance_name?: string | null
          whatsapp_status?: string | null
          whatsapp_welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "establishments_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          city_id: string
          created_at: string
          delivery_fee: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          city_id: string
          created_at?: string
          delivery_fee?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          delivery_fee?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          options: Json | null
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          options?: Json | null
          order_id: string
          product_id?: string | null
          product_name: string
          product_price: number
          quantity?: number
          subtotal: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          options?: Json | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivery_address: string
          delivery_fee: number
          delivery_latitude: number | null
          delivery_longitude: number | null
          discount: number | null
          driver_id: string | null
          establishment_id: string
          estimated_delivery_time: string | null
          id: string
          notes: string | null
          order_number: number
          out_for_delivery_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: string | null
          preparing_at: string | null
          ready_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          delivery_address: string
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          discount?: number | null
          driver_id?: string | null
          establishment_id: string
          estimated_delivery_time?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          out_for_delivery_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: string | null
          preparing_at?: string | null
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          discount?: number | null
          driver_id?: string | null
          establishment_id?: string
          estimated_delivery_time?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          out_for_delivery_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: string | null
          preparing_at?: string | null
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          establishment_id: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          establishment_id: string
          id: string
          image_url: string | null
          is_available: boolean | null
          is_featured: boolean | null
          name: string
          original_price: number | null
          preparation_time: number | null
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          establishment_id: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name: string
          original_price?: number | null
          preparation_time?: number | null
          price: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          establishment_id?: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name?: string
          original_price?: number | null
          preparation_time?: number | null
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          cpf_cnpj: string | null
          driver_address: string | null
          driver_birth_date: string | null
          driver_id_photo_url: string | null
          driver_registration_submitted_at: string | null
          driver_rejection_reason: string | null
          driver_vehicle_plate: string | null
          email: string | null
          face_photo_url: string | null
          full_name: string
          id: string
          is_driver_approved: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
          wallet_balance: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          cpf_cnpj?: string | null
          driver_address?: string | null
          driver_birth_date?: string | null
          driver_id_photo_url?: string | null
          driver_registration_submitted_at?: string | null
          driver_rejection_reason?: string | null
          driver_vehicle_plate?: string | null
          email?: string | null
          face_photo_url?: string | null
          full_name: string
          id?: string
          is_driver_approved?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
          wallet_balance?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          cpf_cnpj?: string | null
          driver_address?: string | null
          driver_birth_date?: string | null
          driver_id_photo_url?: string | null
          driver_registration_submitted_at?: string | null
          driver_rejection_reason?: string | null
          driver_vehicle_plate?: string | null
          email?: string | null
          face_photo_url?: string | null
          full_name?: string
          id?: string
          is_driver_approved?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      promotions: {
        Row: {
          banner_url: string | null
          city_id: string | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number | null
          establishment_id: string | null
          id: string
          is_active: boolean | null
          min_order_value: number | null
          neighborhood_id: string | null
          title: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          banner_url?: string | null
          city_id?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number | null
          establishment_id?: string | null
          id?: string
          is_active?: boolean | null
          min_order_value?: number | null
          neighborhood_id?: string | null
          title: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          banner_url?: string | null
          city_id?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number | null
          establishment_id?: string | null
          id?: string
          is_active?: boolean | null
          min_order_value?: number | null
          neighborhood_id?: string | null
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          customer_id: string
          driver_comment: string | null
          driver_id: string | null
          driver_rating: number | null
          establishment_comment: string | null
          establishment_id: string | null
          establishment_rating: number | null
          id: string
          order_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          driver_comment?: string | null
          driver_id?: string | null
          driver_rating?: number | null
          establishment_comment?: string | null
          establishment_id?: string | null
          establishment_rating?: number | null
          id?: string
          order_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          driver_comment?: string | null
          driver_id?: string | null
          driver_rating?: number | null
          establishment_comment?: string | null
          establishment_id?: string | null
          establishment_rating?: number | null
          id?: string
          order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          id: string
          order_id: string
          customer_id: string
          participant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          customer_id: string
          participant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          customer_id?: string
          participant_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      franchisees: {
        Row: {
          active: boolean | null
          bank_account_info: Json | null
          commission_rate: number | null
          created_at: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          bank_account_info?: Json | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          bank_account_info?: Json | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      franchisee_cities: {
        Row: {
          city_id: string | null
          created_at: string
          franchisee_id: string | null
          id: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          franchisee_id?: string | null
          id?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          franchisee_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchisee_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      franchisee_withdrawals: {
        Row: {
          amount: number
          created_at: string
          franchisee_id: string
          id: string
          pix_key: string | null
          processed_at: string | null
          rejection_reason: string | null
          requested_at: string
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          franchisee_id: string
          id?: string
          pix_key?: string | null
          processed_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          franchisee_id?: string
          id?: string
          pix_key?: string | null
          processed_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string | null
        }
        Relationships: []
      }
      home_banners: {
        Row: {
          button_text: string | null
          created_at: string
          expires_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          position: number | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          button_text?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          position?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          button_text?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          position?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      real_estate_images: {
        Row: {
          created_at: string
          id: string
          is_featured: boolean | null
          property_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_featured?: boolean | null
          property_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_featured?: boolean | null
          property_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "real_estate_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "real_estate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_leads: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          id: string
          message: string | null
          property_id: string
          realtor_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          message?: string | null
          property_id: string
          realtor_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          message?: string | null
          property_id?: string
          realtor_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "real_estate_leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "real_estate_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_properties: {
        Row: {
          address: string | null
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          condominium_fee: number | null
          created_at: string
          description: string | null
          id: string
          iptu_fee: number | null
          latitude: number | null
          longitude: number | null
          owner_id: string
          parking_spots: number | null
          price: number
          property_type: string
          state: string | null
          status: Database["public"]["Enums"]["real_estate_status"] | null
          title: string
          transaction_type: Database["public"]["Enums"]["real_estate_transaction_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          condominium_fee?: number | null
          created_at?: string
          description?: string | null
          id?: string
          iptu_fee?: number | null
          latitude?: number | null
          longitude?: number | null
          owner_id: string
          parking_spots?: number | null
          price: number
          property_type: string
          state?: string | null
          status?: Database["public"]["Enums"]["real_estate_status"] | null
          title: string
          transaction_type: Database["public"]["Enums"]["real_estate_transaction_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          condominium_fee?: number | null
          created_at?: string
          description?: string | null
          id?: string
          iptu_fee?: number | null
          latitude?: number | null
          longitude?: number | null
          owner_id?: string
          parking_spots?: number | null
          price?: number
          property_type?: string
          state?: string | null
          status?: Database["public"]["Enums"]["real_estate_status"] | null
          title?: string
          transaction_type?: Database["public"]["Enums"]["real_estate_transaction_type"]
          updated_at?: string
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          address: string | null
          asaas_customer_id: string | null
          birth_date: string | null
          category: string
          city_id: string | null
          created_at: string
          cpf: string | null
          description: string | null
          email: string | null
          full_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood_id: string | null
          phone: string | null
          rating: number | null
          total_reviews: number | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string | null
          wallet_balance: number
        }
        Insert: {
          address?: string | null
          asaas_customer_id?: string | null
          birth_date?: string | null
          category: string
          city_id?: string | null
          created_at?: string
          cpf?: string | null
          description?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood_id?: string | null
          phone?: string | null
          rating?: number | null
          total_reviews?: number | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_balance?: number
        }
        Update: {
          address?: string | null
          asaas_customer_id?: string | null
          birth_date?: string | null
          category?: string
          city_id?: string | null
          created_at?: string
          cpf?: string | null
          description?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood_id?: string | null
          phone?: string | null
          rating?: number | null
          total_reviews?: number | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address: string
          created_at: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          id: string
          price: number | null
          provider_id: string | null
          scheduled_at: string | null
          service_type: string
          status: Database["public"]["Enums"]["service_request_status"] | null
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          price?: number | null
          provider_id?: string | null
          scheduled_at?: string | null
          service_type: string
          status?: Database["public"]["Enums"]["service_request_status"] | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          price?: number | null
          provider_id?: string | null
          scheduled_at?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["service_request_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          payment_method: string | null
          pix_copy_paste: string | null
          pix_qr_code: string | null
          provider_id: string | null
          status: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          provider_id?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["wallet_transaction_type"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          provider_id?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["wallet_transaction_type"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          context: Json | null
          created_at: string
          current_state: string | null
          customer_phone: string
          establishment_id: string | null
          id: string
          order_id: string | null
          updated_at: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          current_state?: string | null
          customer_phone: string
          establishment_id?: string | null
          id?: string
          order_id?: string | null
          updated_at?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          current_state?: string | null
          customer_phone?: string
          establishment_id?: string | null
          id?: string
          order_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_drivers: {
        Row: {
          created_at: string
          driver_id: string
          establishment_id: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          establishment_id: string
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          establishment_id?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      product_option_groups: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          max_options: number
          min_options: number
          name: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          max_options?: number
          min_options?: number
          name: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          max_options?: number
          min_options?: number
          name?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_available: boolean
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_available?: boolean
          name: string
          price: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_available?: boolean
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "product_option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          city: string
          contact_info: string
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          type: string
        }
        Insert: {
          city: string
          contact_info: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          type?: string
        }
        Update: {
          city?: string
          contact_info?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      provider_withdrawals: {
        Row: {
          amount: number
          bank_details: string | null
          created_at: string
          id: string
          pix_key: string | null
          provider_id: string
          status: string
        }
        Insert: {
          amount: number
          bank_details?: string | null
          created_at?: string
          id?: string
          pix_key?: string | null
          provider_id: string
          status?: string
        }
        Update: {
          amount?: number
          bank_details?: string | null
          created_at?: string
          id?: string
          pix_key?: string | null
          provider_id?: string
          status?: string
        }
        Relationships: []
      }
      real_estate_realtors: {
        Row: {
          city: string | null
          created_at: string
          creci: string
          full_name: string
          id: string
          phone: string
          state: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          creci: string
          full_name: string
          id?: string
          phone: string
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          creci?: string
          full_name?: string
          id?: string
          phone?: string
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
          sender_id: string
          status: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
          sender_id: string
          status?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_establishment: {
        Args: { _establishment_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "establishment" | "driver" | "provider" | "franchisee"
      order_status:
      | "pending"
      | "confirmed"
      | "preparing"
      | "ready"
      | "out_for_delivery"
      | "delivered"
      | "cancelled"
      payment_method: "pix" | "credit_card" | "debit_card" | "cash" | "wallet"
      real_estate_status: "available" | "reserved" | "sold" | "rented"
      real_estate_transaction_type: "sale" | "rent"
      service_request_status: "pending" | "accepted" | "scheduled" | "completed" | "cancelled"
      wallet_transaction_type: "credit" | "debit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer", "establishment", "driver", "provider", "franchisee"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      payment_method: ["pix", "credit_card", "debit_card", "cash", "wallet"],
      real_estate_status: ["available", "reserved", "sold", "rented"],
      real_estate_transaction_type: ["sale", "rent"],
      service_request_status: ["pending", "accepted", "scheduled", "completed", "cancelled"],
      wallet_transaction_type: ["credit", "debit"],
    },
  },
} as const
