import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// GET /api/listings/[id]/fields
// Returns field values with field definitions for a listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();

    // Verify listing exists
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, category_id')
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Fetch field values joined with field definitions
    const { data, error } = await supabase
      .from('listing_field_values')
      .select('*, field:category_fields(*)')
      .eq('listing_id', id);

    if (error) {
      console.error('Listing field values fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch field values' },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Listing field values error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/listings/[id]/fields
// Updates field values for a listing (auth required, own listing only)
// Body: { fields: [{ field_id: string, value: string }] }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();

    // Auth check
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify user owns the listing
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.seller_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { fields } = body as {
      fields: { field_id: string; value: string }[];
    };

    if (!Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: 'fields array is required' },
        { status: 400 }
      );
    }

    // Validate all field_ids exist and belong to the listing's category
    const { data: listingCat } = await supabase
      .from('listings')
      .select('category_id')
      .eq('id', id)
      .single();

    if (!listingCat) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const fieldIds = fields.map((f) => f.field_id);
    const { data: validFields, error: fieldsError } = await supabase
      .from('category_fields')
      .select('id')
      .eq('category_id', listingCat.category_id)
      .in('id', fieldIds);

    if (fieldsError) {
      console.error('Field validation error:', fieldsError);
      return NextResponse.json(
        { error: 'Failed to validate fields' },
        { status: 500 }
      );
    }

    const validFieldIds = new Set((validFields ?? []).map((f) => f.id));
    const invalidIds = fieldIds.filter((fid) => !validFieldIds.has(fid));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'One or more field_ids are invalid for this listing\'s category' },
        { status: 400 }
      );
    }

    // Upsert each field value
    const upserts = fields.map((f) => ({
      listing_id: id,
      field_id: f.field_id,
      value: f.value ?? '',
    }));

    const { error: upsertError } = await supabase
      .from('listing_field_values')
      .upsert(upserts, { onConflict: 'listing_id,field_id' });

    if (upsertError) {
      console.error('Field values upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save field values' },
        { status: 500 }
      );
    }

    // Return updated values
    const { data: updated } = await supabase
      .from('listing_field_values')
      .select('*, field:category_fields(*)')
      .eq('listing_id', id);

    return NextResponse.json(updated ?? []);
  } catch (error) {
    console.error('Listing field values update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
