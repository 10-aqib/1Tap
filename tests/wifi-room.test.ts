import { describe, it, expect } from 'vitest'
import { generateWifiCode, formatBytes } from '../src/lib/utils'

describe('Wi-Fi Room utilities', () => {
  it('generates a 6-digit code for any network IP', () => {
    const testIps = [
      '192.168.1.1',
      '10.0.0.1',
      '172.16.0.100',
      '203.0.113.195',
      '2001:db8::1',
      'shared-wifi-local'
    ]

    for (const ip of testIps) {
      const code = generateWifiCode(ip)
      expect(code).toHaveLength(6)
      expect(code).toMatch(/^[0-9]{6}$/)
      expect(Number(code)).toBeGreaterThanOrEqual(100000)
      expect(Number(code)).toBeLessThanOrEqual(999999)
    }
  })

  it('generates the EXACT SAME room code for devices sharing the same Wi-Fi public IP', () => {
    const device1Ip = '203.0.113.50'
    const device2Ip = '203.0.113.50' // Same public NAT IP on Wi-Fi

    const code1 = generateWifiCode(device1Ip)
    const code2 = generateWifiCode(device2Ip)

    expect(code1).toBe(code2)
  })

  it('formats file sizes accurately', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1024 * 1024 * 5)).toBe('5 MB')
  })
})
