'use client'

import { useEffect, useRef } from 'react'

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const existing = document.getElementById('google-identity-services')
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = 'google-identity-services'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'))
    document.head.appendChild(script)
  })
}

export default function GoogleSignInButton({ onCredential, onError, disabled = false }) {
  const buttonRef = useRef(null)
  const initializedRef = useRef(false)
  const onCredentialRef = useRef(onCredential)
  const onErrorRef = useRef(onError)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    onCredentialRef.current = onCredential
    onErrorRef.current = onError
  }, [onCredential, onError])

  useEffect(() => {
    let mounted = true

    const initGoogleIdentity = async () => {
      if (!clientId || !buttonRef.current || disabled || initializedRef.current) return
      try {
        await loadGoogleScript()
        if (!mounted || !window.google?.accounts?.id) return

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onCredentialRef.current?.(response.credential)
            } else {
              onErrorRef.current?.('Google sign-in failed. Please try again.')
            }
          },
        })
        initializedRef.current = true

        buttonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 320,
        })
      } catch (error) {
        onErrorRef.current?.('Unable to load Google sign-in.')
      }
    }

    initGoogleIdentity()
    return () => {
      mounted = false
    }
  }, [clientId, disabled])

  if (!clientId) {
    return (
      <div className="rounded-xl border border-border/70 bg-secondary/20 p-3 text-center text-xs text-muted-foreground">
        Google login is not configured. Set <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>.
      </div>
    )
  }

  return <div ref={buttonRef} className={`${disabled ? 'pointer-events-none opacity-70' : ''} flex justify-center`} />
}
