import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useEmailRegistrationEnabled() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let active = true
    void api.authOptions()
      .then((options) => {
        if (active) setEnabled(options.email_registration_enabled)
      })
      .catch(() => {
        // Fail closed: OAuth remains available, while email credentials stay hidden.
      })
    return () => {
      active = false
    }
  }, [])

  return enabled
}
