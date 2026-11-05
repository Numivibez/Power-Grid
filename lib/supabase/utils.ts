// =============================================================
// lib/supabase/utils.ts
//
// Utility functions for decoding PostGIS binary data returned by Supabase.
// =============================================================

/**
 * PostGIS returns `geography(Point)` as EWKB hex strings in REST responses
 * (e.g., '0101000020E61000001FF46C567DAE0C403D0AD7A370BD1940').
 *
 * This function decodes that hex string into a standard GeoJSON Point:
 * { type: 'Point', coordinates: [lng, lat] }
 */
export function parsePostGisLocation(raw: unknown): {
  type: 'Point';
  coordinates: [number, number];
} {
  // If it's already an object with coordinates
  if (
    raw &&
    typeof raw === 'object' &&
    'coordinates' in raw &&
    Array.isArray((raw as { coordinates: unknown }).coordinates)
  ) {
    return raw as { type: 'Point'; coordinates: [number, number] };
  }

  // If it's a hex string (standard Supabase PostGIS response)
  if (typeof raw === 'string' && raw.length >= 42) {
    try {
      const buf = Buffer.from(raw, 'hex');
      // PostGIS Point EWKB Little Endian:
      // byte 0: endianness (1 = Little Endian)
      // byte 1-4: type (0x01 = Point, 0x20000000 indicates SRID presence)
      // byte 5-8: SRID (e.g. 4326)
      // byte 9-16: X (longitude) as Float64LE
      // byte 17-24: Y (latitude) as Float64LE
      const typeFlags = buf.readUInt32LE(1);
      const hasSrid = (typeFlags & 0x20000000) !== 0;
      const offset = hasSrid ? 9 : 5;

      const lng = buf.readDoubleLE(offset);
      const lat = buf.readDoubleLE(offset + 8);

      return {
        type: 'Point',
        coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))],
      };
    } catch (err) {
      console.error('Failed to parse PostGIS EWKB hex string:', err);
    }
  }

  // Fallback to Lagos center if location is null or invalid
  return {
    type: 'Point',
    coordinates: [3.3792, 6.5244],
  };
}
