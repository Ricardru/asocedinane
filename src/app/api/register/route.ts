import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log('=== REGISTER API CALLED ===');

  try {
    const body = await request.json();
    console.log('Raw request body:', body);

    const { nombre_completo, email, password, rol } = body;
    console.log('Parsed data:', { nombre_completo, email, rol, hasPassword: !!password });

    if (!nombre_completo || !email || !password || !rol) {
      console.log('Validation failed - missing fields');
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment variables check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!supabaseServiceRoleKey,
      urlLength: supabaseUrl?.length,
      keyLength: supabaseServiceRoleKey?.length
    });

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
    }

    // Crear cliente con service role para todas las operaciones
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Supabase client created successfully');

    // Crear usuario en Auth
    console.log('Attempting auth signup for email:', email);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Auth signup failed:', {
        message: authError.message,
        status: authError.status,
        code: (authError as any).code
      });
      return NextResponse.json({ error: `Error de autenticación: ${authError.message}` }, { status: 400 });
    }

    if (!authData.user) {
      console.error('Auth signup succeeded but no user data returned');
      return NextResponse.json({ error: 'Error al crear usuario de autenticación' }, { status: 400 });
    }

    console.log('Auth signup successful, user ID:', authData.user.id);

    // Insertar en tabla usuarios
    console.log('Attempting user profile insertion...');
    const { error: insertError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nombre_completo,
        email,
        rol,
        activo: true,
      });

    if (insertError) {
      console.error('User profile insertion failed:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });

      // Intentar eliminar el usuario de Auth si falla la inserción
      try {
        console.log('Attempting to clean up auth user...');
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('Auth user cleaned up successfully');
      } catch (deleteError) {
        console.error('Failed to clean up auth user:', deleteError);
      }

      return NextResponse.json({
        error: `Error al crear perfil de usuario: ${insertError.message}`
      }, { status: 400 });
    }

    console.log('User registration completed successfully');
    return NextResponse.json({
      message: 'Usuario registrado exitosamente',
      userId: authData.user.id
    });

  } catch (error) {
    console.error('Unexpected error in register API:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}