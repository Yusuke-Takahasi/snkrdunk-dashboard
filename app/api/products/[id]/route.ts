import { NextRequest } from 'next/server';
import { supabase } from '../../../../utils/supabase';

export const dynamic = 'force-dynamic';

type PatchBody = {
  is_favorite?: boolean;
  is_blacklisted?: boolean;
};

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: 'id is required' }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await _request.json()) as PatchBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: { is_favorite?: boolean; is_blacklisted?: boolean } = {};
  if (typeof body.is_favorite === 'boolean') updates.is_favorite = body.is_favorite;
  if (typeof body.is_blacklisted === 'boolean') updates.is_blacklisted = body.is_blacklisted;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'Provide at least one of is_favorite, is_blacklisted' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select('id, is_favorite, is_blacklisted')
    .single();

  if (error) {
    console.error('products PATCH error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
  return Response.json(data);
}
