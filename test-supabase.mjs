// Script de prueba para verificar la conexión a Supabase y la inserción en usuarios
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');

    // Test basic query
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Error querying usuarios table:', error);
      return;
    }

    console.log('Connection successful, usuarios table accessible');

    // Test auth signup
    console.log('Testing auth signup...');
    const testEmail = `test${Date.now()}@gmail.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Testpassword123!',
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return;
    }

    console.log('Auth signup successful:', authData.user?.id);

    // Test user profile insertion
    if (authData.user) {
      console.log('Testing user profile insertion...');

      // First check if user already exists
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (existingUser) {
        console.log('User profile already exists, this is expected for duplicate test');
      } else {
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert({
            id: authData.user.id,
            nombre_completo: 'Test User',
            email: testEmail,
            rol: 'vendedor',
            activo: true,
          });

        if (insertError) {
          console.error('User profile insertion error:', insertError);
        } else {
          console.log('User profile insertion successful');
        }
      }

      // Clean up - delete test user from usuarios table first
      try {
        await supabase
          .from('usuarios')
          .delete()
          .eq('id', authData.user.id);
        console.log('Test user profile deleted from usuarios table');
      } catch (deleteError) {
        console.error('Error deleting test user profile:', deleteError);
      }

      // Clean up - delete test user from auth
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('Test user deleted from auth');
      } catch (deleteError) {
        console.error('Error deleting test user from auth:', deleteError);
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();