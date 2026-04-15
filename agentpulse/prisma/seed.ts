import {
  PrismaClient,
  Role,
  UserStatus,
  ProspectStage,
  PolicyStatus,
  CommissionStatus,
  ClaimStatus,
  ActivityType,
} from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed...')

  // Nettoyage dans l'ordre des dépendances
  await prisma.activity.deleteMany()
  await prisma.claim.deleteMany()
  await prisma.commission.deleteMany()
  await prisma.policy.deleteMany()
  await prisma.prospect.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.company.deleteMany()

  // ── Société ──────────────────────────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      name: 'NSIA Cameroun',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
  })
  console.log(`   ✓ Société : ${company.name}`)

  // ── Superadmin ────────────────────────────────────────────────────────────
  const superadmin = await prisma.user.create({
    data: {
      email: 'admin@jengu.ai',
      name: 'Admin Jengu',
      passwordHash: await hash('Jengu123', 10),
      role: Role.SUPERADMIN,
      status: UserStatus.ACTIVE,
      companyId: company.id,
    },
  })

  // ── Manager ───────────────────────────────────────────────────────────────
  const manager = await prisma.user.create({
    data: {
      email: 'manager@nsia.cm',
      name: 'Jean-Pierre Mbarga',
      phone: '+237 677 123 456',
      passwordHash: await hash('Manager123', 10),
      role: Role.MANAGER,
      status: UserStatus.TRIAL,
      trialExpiresAt: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      companyId: company.id,
    },
  })

  // ── Superviseur ───────────────────────────────────────────────────────────
  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@nsia.cm',
      name: 'Marie-Claire Essomba',
      phone: '+237 699 234 567',
      passwordHash: await hash('Super123', 10),
      role: Role.SUPERVISOR,
      status: UserStatus.TRIAL,
      trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      companyId: company.id,
    },
  })

  // ── Agents ────────────────────────────────────────────────────────────────
  const agent1 = await prisma.user.create({
    data: {
      email: 'agent@nsia.cm',
      name: 'Paul Nkemdirim',
      phone: '+237 655 345 678',
      passwordHash: await hash('Agent123', 10),
      role: Role.AGENT,
      status: UserStatus.TRIAL,
      trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      commissionRate: 5.0,
      companyId: company.id,
      supervisorId: supervisor.id,
    },
  })

  const agent2 = await prisma.user.create({
    data: {
      email: 'agent2@nsia.cm',
      name: 'Fatima Oumarou',
      phone: '+237 677 456 789',
      passwordHash: await hash('Agent123', 10),
      role: Role.AGENT,
      status: UserStatus.TRIAL,
      trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      commissionRate: 5.0,
      companyId: company.id,
      supervisorId: supervisor.id,
    },
  })

  const agent3 = await prisma.user.create({
    data: {
      email: 'agent3@nsia.cm',
      name: 'Emmanuel Fotso',
      phone: '+237 699 567 890',
      passwordHash: await hash('Agent123', 10),
      role: Role.AGENT,
      status: UserStatus.TRIAL,
      trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      commissionRate: 5.0,
      companyId: company.id,
      supervisorId: supervisor.id,
    },
  })

  console.log(`   ✓ Users : 1 superadmin, 1 manager, 1 superviseur, 3 agents`)

  // ── Prospects (7 répartis sur les 6 étapes) ───────────────────────────────
  const [p1, p2, p3, p4, p5, p6, p7] = await Promise.all([
    prisma.prospect.create({
      data: {
        firstName: 'Rodrigue',
        lastName: 'Nkengfack',
        phone: '+237 677 111 222',
        email: 'r.nkengfack@gmail.com',
        job: 'Professeur au Lycée Technique de Douala',
        estimatedPrime: 120000,
        stage: ProspectStage.CONTACT,
        notes: 'Intéressé par une assurance vie. À rappeler en fin de semaine.',
        agentId: agent1.id,
        companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Aminatou',
        lastName: 'Hamidou',
        phone: '+237 699 222 333',
        email: 'aminatou.h@yahoo.fr',
        job: 'Commerçante au Marché Mokolo, Yaoundé',
        estimatedPrime: 85000,
        stage: ProspectStage.CONTACT,
        notes: "Rencontrée lors d'une foire commerciale. Intérêt pour couverture santé.",
        agentId: agent1.id,
        companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Samuel',
        lastName: 'Owona Beyala',
        phone: '+237 655 333 444',
        email: 's.owona@hcy.cm',
        job: "Médecin à l'Hôpital Central de Yaoundé",
        estimatedPrime: 350000,
        stage: ProspectStage.ENTRETIEN,
        notes: 'Premier RDV positif. Cherche couverture complète pour toute la famille.',
        agentId: agent1.id,
        companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Clotilde',
        lastName: 'Atanga',
        phone: '+237 677 444 555',
        job: 'Fonctionnaire au Ministère des Finances, Yaoundé',
        estimatedPrime: 180000,
        stage: ProspectStage.ENTREVUE,
        notes: 'Dossier complet. Attend validation de sa hiérarchie avant signature.',
        agentId: agent2.id,
        companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Aristide',
        lastName: 'Tchamba',
        phone: '+237 699 555 666',
        email: 'a.tchamba@mtn.cm',
        job: 'Ingénieur réseau chez MTN Cameroun, Douala',
        estimatedPrime: 290000,
        stage: ProspectStage.SOUMISE,
        notes: 'Proposition soumise le 10/04. Délai de réflexion de 15 jours.',
        agentId: agent2.id,
        companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Bernadette',
        lastName: 'Fouda Mvondo',
        phone: '+237 655 666 777',
        email: 'b.fouda@gmail.com',
        job: 'Entrepreneur BTP, Kribi',
        estimatedPrime: 450000,
        stage: ProspectStage.EMISE,
        notes: 'Police émise. En attente de signature du contrat définitif.',
        agentId: agent3.id,
        companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Théophile',
        lastName: 'Kouam',
        phone: '+237 677 777 888',
        job: 'Chauffeur de taxi, Bafoussam',
        estimatedPrime: 75000,
        stage: ProspectStage.LIVRAISON,
        notes: 'Contrat signé et livré le 05/04. Client très satisfait.',
        agentId: agent3.id,
        companyId: company.id,
      },
    }),
  ])

  console.log(`   ✓ Prospects : 7 (CONTACT×2, ENTRETIEN, ENTREVUE, SOUMISE, EMISE, LIVRAISON)`)

  // ── Polices ───────────────────────────────────────────────────────────────
  const year = new Date().getFullYear()

  const policy1 = await prisma.policy.create({
    data: {
      policyNumber: `POL-${year}-0001`,
      productType: 'Assurance Vie Individuelle',
      premium: 290000,
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-04-01'),
      status: PolicyStatus.SOUMISE,
      prospectId: p5.id,
      agentId: agent2.id,
      companyId: company.id,
    },
  })

  const policy2 = await prisma.policy.create({
    data: {
      policyNumber: `POL-${year}-0002`,
      productType: 'Assurance Multirisque Professionnelle',
      premium: 450000,
      startDate: new Date('2025-03-15'),
      endDate: new Date('2026-03-15'),
      status: PolicyStatus.EMISE,
      prospectId: p6.id,
      agentId: agent3.id,
      companyId: company.id,
    },
  })

  const policy3 = await prisma.policy.create({
    data: {
      policyNumber: `POL-${year}-0003`,
      productType: 'Assurance Auto Tous Risques',
      premium: 75000,
      startDate: new Date('2025-04-05'),
      endDate: new Date('2026-04-05'),
      status: PolicyStatus.LIVREE,
      prospectId: p7.id,
      agentId: agent3.id,
      companyId: company.id,
    },
  })

  console.log(`   ✓ Polices : 3 (SOUMISE, EMISE, LIVREE)`)

  // ── Commissions ───────────────────────────────────────────────────────────
  await prisma.commission.create({
    data: {
      amount: 22500,
      rate: 5.0,
      month: new Date('2025-04-01'),
      status: CommissionStatus.VALIDE,
      agentId: agent3.id,
      policyId: policy2.id,
      approvedBy: manager.id,
      companyId: company.id,
    },
  })

  await prisma.commission.create({
    data: {
      amount: 3750,
      rate: 5.0,
      month: new Date('2025-04-01'),
      status: CommissionStatus.ATTENTE,
      agentId: agent3.id,
      policyId: policy3.id,
      companyId: company.id,
    },
  })

  console.log(`   ✓ Commissions : 2 (1 VALIDE, 1 ATTENTE)`)

  // ── Sinistre ──────────────────────────────────────────────────────────────
  await prisma.claim.create({
    data: {
      claimNumber: `SIN-${year}-0001`,
      description:
        "Accident de circulation sur l'axe Douala-Yaoundé. Dommages matériels importants au véhicule assuré. Aucun blessé.",
      amount: 850000,
      status: ClaimStatus.INSTRUCTION,
      policyId: policy3.id,
      declaredAt: new Date('2025-04-10'),
    },
  })

  console.log(`   ✓ Sinistres : 1 (EN INSTRUCTION)`)

  // ── Activités ─────────────────────────────────────────────────────────────
  await prisma.activity.createMany({
    data: [
      {
        type: ActivityType.CONTACT,
        note: 'Premier contact téléphonique. Intérêt confirmé pour assurance vie.',
        prospectId: p1.id,
        userId: agent1.id,
      },
      {
        type: ActivityType.CONTACT,
        note: "Contact initial lors de la foire de Yaoundé.",
        prospectId: p2.id,
        userId: agent1.id,
      },
      {
        type: ActivityType.ENTRETIEN,
        note: 'RDV au cabinet du Dr Owona. Besoins analysés en détail.',
        prospectId: p3.id,
        userId: agent1.id,
      },
      {
        type: ActivityType.ENTREVUE,
        note: 'Dossier finalisé. En attente de validation hiérarchique.',
        prospectId: p4.id,
        userId: agent2.id,
      },
      {
        type: ActivityType.STAGE_CHANGE,
        note: 'Proposition commerciale envoyée par email et WhatsApp.',
        prospectId: p5.id,
        userId: agent2.id,
      },
      {
        type: ActivityType.STAGE_CHANGE,
        note: 'Police émise. Rendez-vous pris pour signature définitive.',
        prospectId: p6.id,
        userId: agent3.id,
      },
      {
        type: ActivityType.STAGE_CHANGE,
        note: 'Contrat signé et remis en main propre. Client très satisfait.',
        prospectId: p7.id,
        userId: agent3.id,
      },
    ],
  })

  console.log(`   ✓ Activités : 7`)
  console.log('')
  console.log('✅ Seed terminé avec succès !')
  console.log('')
  console.log('   Comptes de test :')
  console.log('   admin@jengu.ai      / Jengu123   (SUPERADMIN)')
  console.log('   manager@nsia.cm     / Manager123 (MANAGER — TRIAL 11j)')
  console.log('   supervisor@nsia.cm  / Super123   (SUPERVISOR — TRIAL)')
  console.log('   agent@nsia.cm       / Agent123   (AGENT — TRIAL)')
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
