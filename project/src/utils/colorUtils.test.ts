import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex } from './colorUtils'

describe('colorUtils', () => {
  it('hexToRgb converts 3-digit hex', () => {
    expect(hexToRgb('#fff')).toBe('255 255 255')
    expect(hexToRgb('#000')).toBe('0 0 0')
  })

  it('hexToRgb converts 6-digit hex', () => {
    expect(hexToRgb('#123456')).toBe(`${0x12} ${0x34} ${0x56}`)
    expect(hexToRgb('#00ff80')).toBe('0 255 128')
  })

  it('rgbToHex converts rgb string to hex', () => {
    expect(rgbToHex('255 255 255')).toBe('#ffffff')
    expect(rgbToHex('0 0 0')).toBe('#000000')
    expect(rgbToHex('18 52 86')).toBe('#123456')
  })

  it('roundtrip hex -> rgb -> hex', () => {
    const hex = '#1a2b3c'
    const rgb = hexToRgb(hex)
    expect(rgbToHex(rgb)).toBe(hex)
  })
})

