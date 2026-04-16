import type { Metadata } from 'next'
import PricingContent from './PricingContent'

export const metadata: Metadata = { title: 'Tarifs — AgentPulse' }

export default function PricingPage() {
  return <PricingContent />
}
