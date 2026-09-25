import { supabase } from './supabase'
import type { Business, Profile } from '../types/database'
export async function getCurrentContext(){
 const {data:{user},error} = await supabase.auth.getUser(); if(error) throw error; if(!user) return null
 const {data:profile,error:pe} = await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle(); if(pe) throw pe
 if(!profile) return {user,profile:null,business:null}
 const {data:business,error:be} = await supabase.from('businesses').select('*').eq('id',profile.business_id).single(); if(be) throw be
 return {user,profile:profile as Profile,business:business as Business}
}
export function errorMessage(error: unknown){ return error instanceof Error ? error.message : 'Something went wrong. Please try again.' }
