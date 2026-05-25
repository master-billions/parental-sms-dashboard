import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ubgbtioqsyypbbxrgkwx.supabase.co'
const supabaseAnonKey = 'sb_publishable_EccVV8TrscITmD3j-XrA9g_CtXojYnK'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)