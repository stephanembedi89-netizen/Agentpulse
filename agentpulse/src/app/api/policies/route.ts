import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

const PRODUCT_TYPES = [
  'Assurance Vie',
  'Auto',
  'Multirisque Habitation',
  'Santé',
  'Voyage',
] as const

const createSchema = z.object({
  prospectId:  z.string().min(1, 'Prospect requis'),
  productType: z.enum(PRODUCT_TYPES, { errorMap: () => ({ message: 'Type de produit invalide' }) }),
  premium:     z.number().positive('Prime requise'),
  startDate:   z.string().min(1, 'Date de début requise'),
  endDate:     z.string().min(1, 'Date de fin requise'),
})

function generatePolicyNumber(): string {
  const year   = new Date().getFullYear()
  const digits = String(Math.floor(1000 + Math.random() * 9000))
  return `POL-${year}-${digits}`
}

// ─── GET /api/policies ────────────────────────────────────────────────────────
export const GET = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (_req, session) => {
    const policies = await prisma.policy.findMany({
      where: {
        agentId:   session.user.id,
        companyId: session.user.companyId,
      },
      include: {
        prospect: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(policies)
  }
)

// ─── POST /api/policies ───────────────────────────────────────────────────────
export const POST = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (req, session) => {
    const body  = await req.json()
    const parse = createSchema.safeParse(body)
    if (!parse.success) {
      return Response.json({ error: 'Données invalides', details: parse.error.issues }, { status: 400 })
    }

    const { prospectId, productType, premium, startDate, endDate } = parse.data

    // Vérifie que le prospect appartient à la société
    const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } })
    if (!prospect) return Response.json({ error: 'Prospect introuvable' }, { status: 404 })
    if (prospect.companyId !== session.user.companyId) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Génère un numéro unique (retry si collision)
    let policyNumber = generatePolicyNumber()
    let attempt = 0
    while (await prisma.policy.findUnique({ where: { policyNumber } }) && attempt < 5) {
      policyNumber = generatePolicyNumber()
      attempt++
    }

    const policy = await prisma.policy.create({
      data: {
        policyNumber,
        productType,
        premium,
        startDate: new Date(startDate),
        endDate:   new Date(endDate),
        status:    'SOUMISE',
        prospectId,
        agentId:   session.user.id,
        companyId: session.user.companyId,
      },
      include: {
        prospect: { select: { firstName: true, lastName: true } },
      },
    })

    // Avancer le prospect à SOUMISE si pas encore à ce stade ou plus loin
    const stageOrder = ['CONTACT','ENTRETIEN','ENTREVUE','SOUMISE','EMISE','LIVRAISON']
    const currentIdx = stageOrder.indexOf(prospect.stage)
    if (currentIdx < stageOrder.indexOf('SOUMISE')) {
      await prisma.prospect.update({
        where: { id: prospectId },
        data:  { stage: 'SOUMISE' },
      })
    }

    await prisma.activity.create({
      data: {
        type:       'STAGE_CHANGE',
        note:       `Police ${policyNumber} soumise — ${productType} — prime ${premium.toLocaleString('fr-FR')} FCFA`,
        prospectId,
        userId:     session.user.id,
      },
    })

    return Response.json(policy, { status: 201 })
  }
)
