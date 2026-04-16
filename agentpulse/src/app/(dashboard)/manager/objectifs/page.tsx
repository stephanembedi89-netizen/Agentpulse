import type { Metadata } from 'next'
import ObjectifsClient from './ObjectifsClient'

export const metadata: Metadata = { title: 'Objectifs — AgentPulse' }

export default function ObjectifsPage() {
  return <ObjectifsClient />
}
