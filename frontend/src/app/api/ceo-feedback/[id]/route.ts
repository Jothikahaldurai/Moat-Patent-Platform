import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const supabase = createAdminClient();
    const body = await req.json();

    // Check if status or title is updated
    if (body.status || body.title) {
      const { error: updateError } = await supabase
        .from('ceo_feedback')
        .update({
          status: body.status,
          title: body.title,
          updated_at: new Date().toISOString()
        })
        .eq('id', resolvedParams.id);
      
      if (updateError) throw updateError;
    }

    // If content is provided, create a new version
    if (body.content !== undefined) {
      // Get current max version
      const { data: maxVersionData, error: maxVersionError } = await supabase
        .from('ceo_feedback_versions')
        .select('version_number')
        .eq('feedback_id', resolvedParams.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();
      
      const newVersionNum = maxVersionData ? maxVersionData.version_number + 1 : 1;

      const { error: versionError } = await supabase
        .from('ceo_feedback_versions')
        .insert({
          feedback_id: resolvedParams.id,
          content: body.content,
          mentions: body.mentions || [],
          attachments: body.attachments || [],
          links: body.links || [],
          version_number: newVersionNum,
          created_by: body.created_by || 'CEO'
        });

      if (versionError) throw versionError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const supabase = createAdminClient();
    
    // Cascades to versions
    const { error } = await supabase.from('ceo_feedback').delete().eq('id', resolvedParams.id);
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
