import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateJoinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateWifiCode(identifier: string): string {
  let hash = 5381
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash * 33) ^ identifier.charCodeAt(i)
  }
  const positiveHash = Math.abs(hash)
  // Ensure exactly 6 digits (100000 - 999999) to satisfy database constraint
  const code = 100000 + (positiveHash % 900000)
  return code.toString()
}

export async function getNetworkIdentifier(): Promise<{ ip: string; isWifiOrShared: boolean }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3500)

  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal })
    if (res.ok) {
      const data = await res.json()
      if (data?.ip) {
        clearTimeout(timeoutId)
        return { ip: data.ip, isWifiOrShared: true }
      }
    }
  } catch {
    try {
      const res2 = await fetch('https://api64.ipify.org?format=json', { signal: controller.signal })
      if (res2.ok) {
        const data2 = await res2.json()
        if (data2?.ip) {
          clearTimeout(timeoutId)
          return { ip: data2.ip, isWifiOrShared: true }
        }
      }
    } catch {
      // Fallback
    }
  } finally {
    clearTimeout(timeoutId)
  }

  return { ip: 'shared-wifi-local', isWifiOrShared: true }
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}