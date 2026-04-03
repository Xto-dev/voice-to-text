import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const supabase = createClient()

  const { data: todos } = await (await supabase).from('todos').select()

  return (
    <ul>
      {todos?.map((todo: { id: string; name: string }) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  )
}
