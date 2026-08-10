import { redirect } from 'next/navigation'

// La raíz redirige al login
export default function Home() {
  redirect('/login')
}
