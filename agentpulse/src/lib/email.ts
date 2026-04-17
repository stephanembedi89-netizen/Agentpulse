import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM   = process.env.RESEND_FROM ?? 'AgentPulse <noreply@agentpulse.cm>'

export async function sendWelcomeEmail(params: {
  to: string
  name: string
  password: string
  trialExpiresAt: Date
  companyName: string
}) {
  if (!resend) return
  const expires = params.trialExpiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  await resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: `Bienvenue sur AgentPulse — votre essai de 14 jours commence maintenant`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
        <h1 style="color:#3B82F6">Bienvenue, ${params.name} 👋</h1>
        <p>Votre espace AgentPulse pour <strong>${params.companyName}</strong> est prêt.</p>
        <p>Votre essai gratuit est actif jusqu'au <strong>${expires}</strong>.</p>
        <table style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;width:100%">
          <tr><td style="color:#666">Email</td><td><strong>${params.to}</strong></td></tr>
          <tr><td style="color:#666">Mot de passe</td><td><strong>${params.password}</strong></td></tr>
        </table>
        <a href="${process.env.NEXTAUTH_URL ?? 'https://agentpulse.cm'}/login"
           style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Accéder à mon espace →
        </a>
        <p style="color:#888;font-size:12px;margin-top:32px">
          Besoin d'aide ? Contactez-nous à <a href="mailto:contact@agentpulse.cm">contact@agentpulse.cm</a>
        </p>
      </div>
    `,
  })
}

export async function sendTrialReminderEmail(params: {
  to: string
  name: string
  daysLeft: number
}) {
  if (!resend) return
  await resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: `⏰ Votre essai AgentPulse expire dans ${params.daysLeft} jour${params.daysLeft > 1 ? 's' : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
        <h1 style="color:#F59E0B">Votre essai expire bientôt</h1>
        <p>Bonjour ${params.name},</p>
        <p>Il vous reste <strong>${params.daysLeft} jour${params.daysLeft > 1 ? 's' : ''}</strong> sur votre essai AgentPulse.</p>
        <p>Pour continuer à piloter votre équipe sans interruption, choisissez votre forfait :</p>
        <a href="${process.env.NEXTAUTH_URL ?? 'https://agentpulse.cm'}/pricing"
           style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Voir les tarifs →
        </a>
        <p style="color:#888;font-size:12px;margin-top:32px">
          Questions ? <a href="mailto:contact@agentpulse.cm">contact@agentpulse.cm</a>
        </p>
      </div>
    `,
  })
}
