import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// ─── GET /api/agent/stats ─────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (session.user.role !== 'AGENT') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const agentId   = session.user.id
  const companyId = session.user.companyId

  const now          = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Tous les prospects de l'agent (sélection minimale)
  const prospects = await prisma.prospect.findMany({
    where: { agentId, companyId },
    select: { stage: true, estimatedPrime: true, updatedAt: true },
  })

  const total = prospects.length

  // ── Comptage par étape ──────────────────────────────────────────────────
  const STAGE_KEYS = ['CONTACT', 'ENTRETIEN', 'ENTREVUE', 'SOUMISE', 'EMISE', 'LIVRAISON'] as const
  const pipeline = Object.fromEntries(
    STAGE_KEYS.map(s => [s, prospects.filter(p => p.stage === s).length])
  ) as Record<typeof STAGE_KEYS[number], number>

  // ── Polices émises ce mois (prospects passés à EMISE/LIVRAISON ce mois) ──
  const policesEmisesMois = prospects.filter(
    p => (p.stage === 'EMISE' || p.stage === 'LIVRAISON') && p.updatedAt >= startOfMonth
  ).length

  // ── Prime moyenne (sur les prospects avec prime saisie) ─────────────────
  const withPrime    = prospects.filter(p => (p.estimatedPrime ?? 0) > 0)
  const primeMoyenne = withPrime.length > 0
    ? Math.round(withPrime.reduce((s, p) => s + (p.estimatedPrime ?? 0), 0) / withPrime.length)
    : 0

  // ── Taux global (LIVRAISON / total) ────────────────────────────────────
  const livraisons = pipeline['LIVRAISON']
  const tauxGlobal = total > 0 ? Math.round((livraisons / total) * 100) : 0

  // ── Ratios entonnoir (cumulatifs) ───────────────────────────────────────
  const atEntretienPlus   = prospects.filter(p => ['ENTRETIEN','ENTREVUE','SOUMISE','EMISE','LIVRAISON'].includes(p.stage)).length
  const atEntrevuePlus    = prospects.filter(p => ['ENTREVUE','SOUMISE','EMISE','LIVRAISON'].includes(p.stage)).length
  const atSoumisePlus     = prospects.filter(p => ['SOUMISE','EMISE','LIVRAISON'].includes(p.stage)).length
  const atEmisePlus       = prospects.filter(p => ['EMISE','LIVRAISON'].includes(p.stage)).length

  const tauxTerrain       = total             > 0 ? Math.round((atEntretienPlus / total)             * 100) : 0
  const tauxQualification = atEntretienPlus   > 0 ? Math.round((atEntrevuePlus  / atEntretienPlus)   * 100) : 0
  const soumisesEmises    = atSoumisePlus     > 0 ? Math.round((atEmisePlus     / atSoumisePlus)     * 100) : 0

  // ── Prime journalière (prospects livrés aujourd'hui) ───────────────────
  const primeJournaliere = prospects
    .filter(p => p.stage === 'LIVRAISON' && p.updatedAt >= startOfDay)
    .reduce((s, p) => s + (p.estimatedPrime ?? 0), 0)

  return Response.json({
    banner: {
      policesEmisesMois,
      primeMoyenne,
      tauxGlobal,
      objectifMensuel: 15,
      dateAujourdhui: now.toISOString().split('T')[0],
    },
    pipeline,
    ratios: {
      tauxGlobal,
      primeJournaliere,
      soumisesEmises,
      tauxTerrain,
      tauxQualification,
      livraisons,
    },
  })
}
