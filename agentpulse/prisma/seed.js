const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Debut du seed...')

  await prisma.activity.deleteMany()
  await prisma.claim.deleteMany()
  await prisma.commission.deleteMany()
  await prisma.policy.deleteMany()
  await prisma.prospect.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.company.deleteMany()

  const company = await prisma.company.create({
    data: {
      name: 'NSIA Cameroun',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
  })
  console.log('OK Societe : ' + company.name)

  const superadmin = await prisma.user.create({
    data: {
      email: 'admin@jengu.ai',
      name: 'Admin Jengu',
      passwordHash: await hash('Jengu123', 10),
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      companyId: company.id,
    },
  })

  const manager = await prisma.user.create({
    data: {
      email: 'manager@nsia.cm',
      name: 'Jean-Pierre Mbarga',
      phone: '+237 677 123 456',
      passwordHash: await hash('Manager123', 10),
      role: 'MANAGER',
      status: 'TRIAL',
      trialExpiresAt: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      companyId: company.id,
    },
  })

  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@nsia.cm',
      name: 'Marie-Claire Essomba',
      phone: '+237 699 234 567',
      passwordHash: await hash('Super123', 10),
      role: 'SUPERVISOR',
      status: 'TRIAL',
      trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      companyId: company.id,
    },
  })

  const agent1 = await prisma.user.create({
    data: {
      email: 'agent@nsia.cm',
      name: 'Paul Nkemdirim',
      phone: '+237 655 345 678',
      passwordHash: await hash('Agent123', 10),
      role: 'AGENT',
      status: 'TRIAL',
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
      role: 'AGENT',
      status: 'TRIAL',
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
      role: 'AGENT',
      status: 'TRIAL',
      trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      commissionRate: 5.0,
      companyId: company.id,
      supervisorId: supervisor.id,
    },
  })

  console.log('OK Users : 6 crees')

  const prospects = await Promise.all([
    prisma.prospect.create({
      data: {
        firstName: 'Rodrigue', lastName: 'Nkengfack',
        phone: '+237 677 111 222', email: 'r.nkengfack@gmail.com',
        job: 'Professeur au Lycee Technique de Douala',
        estimatedPrime: 120000, stage: 'CONTACT',
        notes: 'Interesse par assurance vie. A rappeler en fin de semaine.',
        agentId: agent1.id, companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Aminatou', lastName: 'Hamidou',
        phone: '+237 699 222 333', email: 'aminatou.h@yahoo.fr',
        job: 'Commercante au Marche Mokolo, Yaounde',
        estimatedPrime: 85000, stage: 'CONTACT',
        notes: 'Rencontree lors foire commerciale.',
        agentId: agent1.id, companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Samuel', lastName: 'Owona Beyala',
        phone: '+237 655 333 444', email: 's.owona@hcy.cm',
        job: "Medecin a l'Hopital Central de Yaounde",
        estimatedPrime: 350000, stage: 'ENTRETIEN',
        notes: 'Premier RDV positif. Cherche couverture famille complete.',
        agentId: agent1.id, companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Clotilde', lastName: 'Atanga',
        phone: '+237 677 444 555',
        job: 'Fonctionnaire au Ministere des Finances, Yaounde',
        estimatedPrime: 180000, stage: 'ENTREVUE',
        notes: 'Dossier complet. Attend validation hierarchique.',
        agentId: agent2.id, companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Aristide', lastName: 'Tchamba',
        phone: '+237 699 555 666', email: 'a.tchamba@mtn.cm',
        job: 'Ingenieur reseau chez MTN Cameroun, Douala',
        estimatedPrime: 290000, stage: 'SOUMISE',
        notes: 'Proposition soumise le 10/04. Delai reflexion 15 jours.',
        agentId: agent2.id, companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Bernadette', lastName: 'Fouda Mvondo',
        phone: '+237 655 666 777', email: 'b.fouda@gmail.com',
        job: 'Entrepreneur BTP, Kribi',
        estimatedPrime: 450000, stage: 'EMISE',
        notes: 'Police emise. En attente signature contrat definitif.',
        agentId: agent3.id, companyId: company.id,
      },
    }),
    prisma.prospect.create({
      data: {
        firstName: 'Theophile', lastName: 'Kouam',
        phone: '+237 677 777 888',
        job: 'Chauffeur de taxi, Bafoussam',
        estimatedPrime: 75000, stage: 'LIVRAISON',
        notes: 'Contrat signe et livre le 05/04. Client satisfait.',
        agentId: agent3.id, companyId: company.id,
      },
    }),
  ])

  console.log('OK Prospects : 7 crees')

  const year = new Date().getFullYear()

  const policy1 = await prisma.policy.create({
    data: {
      policyNumber: 'POL-' + year + '-0001',
      productType: 'Assurance Vie Individuelle',
      premium: 290000, startDate: new Date('2025-04-01'), endDate: new Date('2026-04-01'),
      status: 'SOUMISE', prospectId: prospects[4].id, agentId: agent2.id, companyId: company.id,
    },
  })
  const policy2 = await prisma.policy.create({
    data: {
      policyNumber: 'POL-' + year + '-0002',
      productType: 'Assurance Multirisque Professionnelle',
      premium: 450000, startDate: new Date('2025-03-15'), endDate: new Date('2026-03-15'),
      status: 'EMISE', prospectId: prospects[5].id, agentId: agent3.id, companyId: company.id,
    },
  })
  const policy3 = await prisma.policy.create({
    data: {
      policyNumber: 'POL-' + year + '-0003',
      productType: 'Assurance Auto Tous Risques',
      premium: 75000, startDate: new Date('2025-04-05'), endDate: new Date('2026-04-05'),
      status: 'LIVREE', prospectId: prospects[6].id, agentId: agent3.id, companyId: company.id,
    },
  })

  console.log('OK Polices : 3 creees')

  await prisma.commission.create({
    data: {
      amount: 22500, rate: 5.0, month: new Date('2025-04-01'),
      status: 'VALIDE', agentId: agent3.id, policyId: policy2.id,
      approvedBy: manager.id, companyId: company.id,
    },
  })
  await prisma.commission.create({
    data: {
      amount: 3750, rate: 5.0, month: new Date('2025-04-01'),
      status: 'ATTENTE', agentId: agent3.id, policyId: policy3.id, companyId: company.id,
    },
  })

  console.log('OK Commissions : 2 creees')

  await prisma.claim.create({
    data: {
      claimNumber: 'SIN-' + year + '-0001',
      description: 'Accident de circulation axe Douala-Yaounde. Dommages materiels importants.',
      amount: 850000, status: 'INSTRUCTION', policyId: policy3.id,
      declaredAt: new Date('2025-04-10'),
    },
  })

  console.log('OK Sinistres : 1 cree')

  await prisma.activity.createMany({
    data: [
      { type: 'CONTACT', note: 'Premier contact telephone. Interet confirme.', prospectId: prospects[0].id, userId: agent1.id },
      { type: 'CONTACT', note: 'Contact initial foire de Yaounde.', prospectId: prospects[1].id, userId: agent1.id },
      { type: 'ENTRETIEN', note: 'RDV cabinet. Besoins analyses.', prospectId: prospects[2].id, userId: agent1.id },
      { type: 'ENTREVUE', note: 'Dossier finalise. Attente validation.', prospectId: prospects[3].id, userId: agent2.id },
      { type: 'STAGE_CHANGE', note: 'Proposition envoyee par email et WhatsApp.', prospectId: prospects[4].id, userId: agent2.id },
      { type: 'STAGE_CHANGE', note: 'Police emise. RDV pour signature.', prospectId: prospects[5].id, userId: agent3.id },
      { type: 'STAGE_CHANGE', note: 'Contrat signe et remis en main propre.', prospectId: prospects[6].id, userId: agent3.id },
    ],
  })

  console.log('OK Activites : 7 creees')
  console.log('')
  console.log('SEED TERMINE !')
  console.log('admin@jengu.ai     / Jengu123')
  console.log('manager@nsia.cm    / Manager123')
  console.log('supervisor@nsia.cm / Super123')
  console.log('agent@nsia.cm      / Agent123')
}

main()
  .catch((e) => { console.error('ERREUR:', e.message) ; process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
