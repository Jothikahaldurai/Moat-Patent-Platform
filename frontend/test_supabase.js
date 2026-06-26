const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://gaanedxlwtjftqxhncfw.supabase.co',
  'sb_secret_hXPw8iXOo1s75eb-aDsOtg_uJQYzQJT'
);

async function run() {
  console.log("Checking patent_projects...");
  const { data: pData, error: pErr } = await supabase.from('patent_projects').select('id').limit(1);
  if (pErr) console.error("Error fetching patent_projects:", pErr);
  else console.log("patent_projects exists, data:", pData);

  console.log("Checking patent_documents...");
  const { data: dData, error: dErr } = await supabase.from('patent_documents').select('id').limit(1);
  if (dErr) console.error("Error fetching patent_documents:", dErr);
  else console.log("patent_documents exists, data:", dData);

  // Try to insert a dummy project
  const dummyProject = {
    title: "Test DB Insert",
    description: "test",
    status: "filed"
  };
  console.log("Trying to insert project...");
  const { data: insData, error: insErr } = await supabase.from('patent_projects').insert(dummyProject).select().single();
  if (insErr) {
    console.error("Insert project error:", insErr);
  } else {
    console.log("Insert project success:", insData.id);
    
    // Try to insert document
    const dummyDoc = {
      project_id: insData.id,
      name: "test.pdf",
      url: "http://example.com/test.pdf",
      file_type: "application/pdf",
      size: 1024
    };
    const { data: docData, error: docErr } = await supabase.from('patent_documents').insert(dummyDoc).select().single();
    if (docErr) {
      console.error("Insert document error:", docErr);
    } else {
      console.log("Insert document success:", docData.id);
    }
  }
}
run();
