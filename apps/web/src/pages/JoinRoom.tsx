import { Navigate } from 'react-router-dom'

/**
 * DEPRECATED: JoinRoom functionality merged into Multiplayer.tsx.
 * Multiplayer page already has join-by-code input matching Stitch design.
 * This component redirects to /multiplayer for backward compatibility.
 */
export default function JoinRoom() {
  return <Navigate to="/multiplayer" replace />
}
