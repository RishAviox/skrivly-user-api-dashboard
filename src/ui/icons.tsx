import type { ComponentType, SVGProps } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Coins,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileDown,
  FileText,
  Key,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Lock,
  LogOut,
  Mail,
  Menu,
  MoreVertical,
  Phone,
  Plug,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

type BaseIconProps = SVGProps<SVGSVGElement> & {
  size?: number
}

export type IconName =
  | 'dashboard'
  | 'apiKeys'
  | 'apiUsage'
  | 'billing'
  | 'docs'
  | 'settings'
  | 'bell'
  | 'plus'
  | 'calendar'
  | 'copy'
  | 'downloadTray'
  | 'filePdf'
  | 'lightbulb'
  | 'stack'
  | 'coins'
  | 'key'
  | 'alert'
  | 'plug'
  | 'code'
  | 'doc'
  | 'check'
  | 'download'
  | 'shield'
  | 'menu'
  | 'chevronLeft'
  | 'chevronRight'
  | 'creditCard'
  | 'x'
  | 'moreVertical'
  | 'eye'
  | 'eyeOff'
  | 'sparkles'
  | 'logOut'
  | 'mail'
  | 'phone'
  | 'lock'

const ICONS: Record<IconName, ComponentType<BaseIconProps>> = {
  dashboard: LayoutDashboard,
  apiKeys: KeyRound,
  apiUsage: BarChart3,
  billing: CreditCard,
  docs: BookOpen,
  settings: Settings,
  bell: Bell,
  plus: Plus,
  calendar: Calendar,
  copy: Copy,
  downloadTray: FileDown,
  filePdf: FileText,
  lightbulb: Lightbulb,
  stack: Layers,
  coins: Coins,
  key: Key,
  alert: AlertTriangle,
  plug: Plug,
  code: Code2,
  doc: Send,
  check: CheckCircle2,
  download: Download,
  shield: ShieldCheck,
  menu: Menu,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  creditCard: CreditCard,
  x: X,
  moreVertical: MoreVertical,
  eye: Eye,
  eyeOff: EyeOff,
  sparkles: Sparkles,
  logOut: LogOut,
  mail: Mail,
  phone: Phone,
  lock: Lock,
}

export function Icon({ name, size = 18, ...props }: BaseIconProps & { name: IconName }) {
  const Cmp = ICONS[name] ?? Menu
  return <Cmp size={size} aria-hidden="true" focusable="false" {...props} />
}