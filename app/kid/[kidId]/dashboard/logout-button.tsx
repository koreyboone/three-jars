// app/kid/[kidId]/dashboard/logout-button.tsx
'use client'

import { logoutKid } from '@/lib/actions/auth'

export default function KidLogoutButton() {
  return (
    <form action={logoutKid}>
      <button
        type="submit"
        className="text-sm text-savings-accent hover:text-white transition-colors font-medium px-3 py-1 rounded-lg hover:bg-white/10"
      >
        Switch Kid
      </button>
    </form>
  )
}
