import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yrbddprntgtykbpmaaaz.supabase.co';
const supabaseAnonKey = 'sb_publishable_sPqOyx0MYdaBI46MnUO-wA_TexqoB8O';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
