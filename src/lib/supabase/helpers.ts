import { SupabaseClient } from '@supabase/supabase-js'
import { Database, InsertTables, UpdateTables } from '@/types/database'

type Tables = Database['public']['Tables']
type TableName = keyof Tables

/**
 * Type-safe insert helper
 * Use: await typedInsert(supabase, 'posts', { user_id: '...', content: '...' })
 */
export async function typedInsert<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  data: InsertTables<T>
) {
  return supabase.from(table).insert(data as any)
}

/**
 * Type-safe update helper
 */
export async function typedUpdate<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  data: UpdateTables<T>
) {
  return supabase.from(table).update(data as any)
}

/**
 * Type-safe upsert helper
 */
export async function typedUpsert<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  data: InsertTables<T>
) {
  return supabase.from(table).upsert(data as any)
}
