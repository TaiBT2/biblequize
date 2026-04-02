import { Navigate } from 'react-router-dom'

/**
 * DEPRECATED: Rooms functionality merged into Multiplayer.tsx.
 * Multiplayer page has full room discovery, join, and create — matching Stitch design.
 * This component redirects to /multiplayer for backward compatibility.
 */
export default function Rooms() {
  return <Navigate to="/multiplayer" replace />
}
