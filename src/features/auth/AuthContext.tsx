import { createContext,useContext,useEffect,useState,ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { getCurrentContext } from '../../lib/api'

interface AuthState {
  session: Session|null
  user: User|null
  loading: boolean
  // null means we are still checking
  hasProfile: boolean | null
}

const C=createContext<AuthState>({
  session:null,
  user:null,
  loading:true,
  hasProfile:null
})

export function AuthProvider({children}:{children:ReactNode}){
  const [s,setS]=useState<AuthState>({
    session:null,
    user:null,
    loading:true,
    hasProfile:null
  })

  useEffect(()=>{
    let mounted=true

    supabase.auth.getSession().then(({data})=>{
      if(!mounted)return

      setS(prev=>({
        session:data.session,
        user:data.session?.user??null,
        loading:false,
        hasProfile:data.session?prev.hasProfile:false
      }))
    })

    const {data:{subscription}}=supabase.auth.onAuthStateChange(
      (_event,session)=>{
        if(!mounted)return

        setS(prev=>({
          ...prev,
          session,
          user:session?.user??null,
          loading:false,
          // a different person signed in, so check their profile again
          hasProfile:session
            ?(prev.session?.user.id===session.user.id?prev.hasProfile:null)
            :false
        }))

        if(session){
          setTimeout(()=>{
            if(!mounted)return

            getCurrentContext()
              .then(c=>{
                if(!mounted)return
                setS(prev=>({
                  ...prev,
                  hasProfile:!!c?.profile
                }))
              })
              .catch(()=>{
                if(!mounted)return
                setS(prev=>({
                  ...prev,
                  hasProfile:false
                }))
              })
          },0)
        }else{
          setS(prev=>({
            ...prev,
            hasProfile:false
          }))
        }
      }
    )

    return()=>{
      mounted=false
      subscription.unsubscribe()
    }
  },[])

  return <C.Provider value={s}>{children}</C.Provider>
}

export const useAuth=()=>useContext(C)
