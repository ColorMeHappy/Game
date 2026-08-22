import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const model = new Supabase.ai.Session('gte-small')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const PUBLISHABLE = 'sb_publishable_91vY-4O1RkByvFz7IB_QPg_vwLt5AKN'
const AREAS = new Set(['Corporate','Tax','Immigration','Real Estate'])
const cors = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store'
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok',{headers:cors})
  if (req.method !== 'POST') return new Response(JSON.stringify({error:'METHOD_NOT_ALLOWED'}),{status:405,headers:cors})
  const auth = req.headers.get('authorization') || ''
  if (!auth.toLowerCase().startsWith('bearer ')) return new Response(JSON.stringify({error:'AUTH_REQUIRED'}),{status:401,headers:cors})
  let body:any = {}
  try { body = await req.json() } catch { return new Response(JSON.stringify({error:'INVALID_JSON'}),{status:400,headers:cors}) }
  const query = String(body.query || '').trim()
  if (query.length < 2 || query.length > 500) return new Response(JSON.stringify({error:'QUERY_LENGTH'}),{status:400,headers:cors})
  const area = AREAS.has(body.area) ? body.area : null
  const limit = Math.max(1,Math.min(10,Number(body.limit)||6))
  try {
    const vector = await model.run(query,{mean_pool:true,normalize:true}) as number[]
    if (!Array.isArray(vector) || vector.length !== 384) throw new Error('EMBEDDING_DIMENSION')
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/hybrid_legal_search`,{
      method:'POST',
      headers:{apikey:PUBLISHABLE,Authorization:auth,'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({p_query_text:query,p_query_embedding:JSON.stringify(vector),p_legal_area:area,p_as_of:new Date().toISOString().slice(0,10),p_official_only:true,p_limit:limit})
    })
    if (!r.ok) throw new Error(`RAG ${r.status}`)
    const rows = await r.json()
    return new Response(JSON.stringify({mode:'hybrid-gte-small',semanticUsed:true,verifiedOnly:true,asOf:new Date().toISOString().slice(0,10),rows:Array.isArray(rows)?rows:[]}),{status:200,headers:cors})
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({error:'VERIFIED_RETRIEVAL_UNAVAILABLE'}),{status:502,headers:cors})
  }
})
