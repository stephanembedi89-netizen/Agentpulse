'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ─── Icônes SVG inline (pas de lib externe) ───────────────────────────────────
function Icon({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

const I = {
  home:    'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  funnel:  'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z',
  doc:     'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  coin:    'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 01-.75.75v-.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75',
  chart:   'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  users:   'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  check:   'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  bell:    'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  trophy:  'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0',
  user:    'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  target:  'M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z',
  book:    'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
  globe:   'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
  building:'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
}

// ─── Config navigation par rôle ───────────────────────────────────────────────
type NavItem = { label: string; href: string; icon: string }
type NavGroup = { title?: string; items: NavItem[] }

const NAV: Record<string, NavGroup[]> = {
  AGENT: [
    { items: [
      { label: 'Accueil',       href: '/agent',              icon: I.home   },
      { label: 'Pipeline',      href: '/agent/pipeline',     icon: I.funnel },
      { label: 'Mes Polices',   href: '/agent/polices',      icon: I.doc    },
      { label: 'Commissions',   href: '/agent/commissions',  icon: I.coin   },
      { label: 'Ratios',        href: '/agent/ratios',       icon: I.chart  },
    ]},
  ],
  SUPERVISOR: [
    { title: 'Mon activité', items: [
      { label: 'Accueil',       href: '/supervisor',                icon: I.home   },
      { label: 'Pipeline',      href: '/supervisor/pipeline',       icon: I.funnel },
      { label: 'Mes Polices',   href: '/supervisor/polices',        icon: I.doc    },
      { label: 'Commissions',   href: '/supervisor/commissions',    icon: I.coin   },
    ]},
    { title: 'Mon équipe', items: [
      { label: 'Mes Agents',         href: '/supervisor/agents',      icon: I.users  },
      { label: 'Polices à valider',  href: '/supervisor/validation', icon: I.check  },
      { label: 'Sinistres',          href: '/supervisor/sinistres',   icon: I.doc    },
      { label: 'Alertes',            href: '/supervisor/alertes',     icon: I.bell   },
    ]},
  ],
  MANAGER: [
    { title: 'Performance', items: [
      { label: 'Accueil',       href: '/manager',                icon: I.home   },
      { label: 'Classement',   href: '/manager/classement',     icon: I.trophy },
      { label: 'Superviseurs', href: '/manager/superviseurs',   icon: I.users  },
      { label: 'KPI équipe',   href: '/manager/kpis',           icon: I.chart  },
      { label: 'Commissions',  href: '/manager/commissions',    icon: I.coin   },
      { label: 'Alertes',      href: '/manager/alertes',        icon: I.bell   },
    ]},
    { title: 'Administration', items: [
      { label: 'Utilisateurs', href: '/manager/utilisateurs',   icon: I.user   },
      { label: 'Objectifs',    href: '/manager/objectifs',      icon: I.target },
      { label: 'Journal',      href: '/manager/journal',        icon: I.book   },
    ]},
  ],
  SUPERADMIN: [
    { items: [
      { label: 'Vue globale',       href: '/admin',                icon: I.globe    },
      { label: 'Sociétés clientes', href: '/admin/societes',       icon: I.building },
      { label: 'Utilisateurs',      href: '/admin/utilisateurs',   icon: I.users    },
      { label: 'Journal système',   href: '/admin/journal',        icon: I.book     },
    ]},
  ],
}

const ROLE_LABELS: Record<string, string> = {
  AGENT: 'Agent',
  SUPERVISOR: 'Superviseur',
  MANAGER: 'Manager',
  SUPERADMIN: 'Super Admin',
}

const ROLE_COLORS: Record<string, string> = {
  AGENT: 'text-blue-400',
  SUPERVISOR: 'text-emerald-400',
  MANAGER: 'text-violet-400',
  SUPERADMIN: 'text-orange-400',
}

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const groups = NAV[role] ?? []

  function isActive(href: string) {
    return pathname === href || (href !== '/' && href !== '/agent' && href !== '/supervisor' && href !== '/manager' && href !== '/admin' && pathname.startsWith(href))
  }

  return (
    <aside className="w-60 shrink-0 bg-[#0D1626] flex flex-col h-full border-r border-white/5">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">AP</span>
          </div>
          <span className="text-white font-bold text-sm tracking-wide">AgentPulse</span>
        </div>
      </div>

      {/* Rôle badge */}
      <div className="px-5 py-3 border-b border-white/5 shrink-0">
        <span className={`text-xs font-semibold uppercase tracking-widest ${ROLE_COLORS[role] ?? 'text-gray-400'}`}>
          {ROLE_LABELS[role] ?? role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
            {group.title && (
              <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${active
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <Icon d={item.icon} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer sidebar */}
      <div className="px-3 py-4 border-t border-white/5 shrink-0">
        <p className="text-center text-[10px] text-gray-600">AgentPulse © {new Date().getFullYear()}</p>
      </div>
    </aside>
  )
}
