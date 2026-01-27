
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xjtcvxctnhzhcjcweefy.supabase.co';
const supabaseAnonKey = 'sb_publishable_hckW2zevii1V79Qk6a56KA_055e-DUQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
