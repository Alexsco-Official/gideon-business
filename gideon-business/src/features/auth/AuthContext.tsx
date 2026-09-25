import { createContext,useContext,useEffect,useState,ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { getCurrentContext } from '../../lib/api'
interface AuthState {session:Session|null;user:User|null;loading:boolean;hasProfile:boolean}
const C=createContext<AuthState>({session:null,user:null,loading:true,hasProfile:false})
export function AuthProvider({children}:{children:ReactNode}){const [s,setS]=useState<AuthState>({session:null,user:null,loading:true,hasProfile:false});useEffect(()=>{let mounted=true;supabase.auth.getSession().then(async({data})=>{if(!mounted)return;let hp=false;if(data.session){const c=await getCurrentContext();hp=!!c?.profile}setS({session:data.session,user:data.session?.user??null,loading:false,hasProfile:hp})});const {data:{subscription}}=supabase.auth.onAuthStateChange(async(_e,session)=>{if(!mounted)return;let hp=false;if(session){const c=await getCurrentContext();hp=!!c?.profile}setS({session,user:session?.user??null,loading:false,hasProfile:hp})});return()=>{mounted=false;subscription.unsubscribe()}},[]);return <C.Provider value={s}>{children}</C.Provider>}
export const useAuth=()=>useContext(C)
