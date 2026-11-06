import {
  Activity, ArrowLeft, ArrowRight, Award, BadgeCheck, Ban, Banknote, Bell, BookOpen, Briefcase, Calendar,
  CalendarCheck, CalendarClock, CalendarDays, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert,
  CircleCheck, CirclePlay, CircleX, ClipboardList, Clock, CreditCard, Download, Eye, EyeOff, FileText, FileUp,
  GraduationCap, HandCoins, HeartHandshake, Hourglass, House, Image as ImageIcon, Inbox, Info, Landmark, Languages,
  LayoutDashboard, LoaderCircle, Lock, LogIn, LogOut, Mail, MailCheck, MapPin, Menu, MessageCircle, Mic, Moon,
  NotebookPen, Paperclip, Pencil, Phone, Pill, Plus, QrCode, Receipt, RefreshCw, Search, Send, Settings, Share2,
  ShieldCheck, Signal, Smartphone, Square, Stamp, Star, Stethoscope, Sun, Tag, Timer, Trash2, TrendingUp, Upload,
  User, UserPlus, UserX, Users, Video, Wallet, Wifi, WifiOff, X, type LucideIcon,
} from 'lucide-react'

const ICONS = {
  activity: Activity, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, award: Award, 'badge-check': BadgeCheck,
  ban: Ban, banknote: Banknote, bell: Bell, 'book-open': BookOpen, briefcase: Briefcase, calendar: Calendar,
  'calendar-check': CalendarCheck, 'calendar-clock': CalendarClock, 'calendar-days': CalendarDays, camera: Camera,
  check: Check, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
  'circle-alert': CircleAlert, 'circle-check': CircleCheck, 'circle-play': CirclePlay, 'circle-x': CircleX,
  'clipboard-list': ClipboardList, clock: Clock, 'credit-card': CreditCard, download: Download, eye: Eye,
  'eye-off': EyeOff, 'file-text': FileText, 'file-up': FileUp, 'graduation-cap': GraduationCap, 'hand-coins': HandCoins,
  'heart-handshake': HeartHandshake, hourglass: Hourglass, house: House, image: ImageIcon, inbox: Inbox, info: Info,
  landmark: Landmark, languages: Languages, 'layout-dashboard': LayoutDashboard, loader: LoaderCircle, lock: Lock,
  'log-in': LogIn, 'log-out': LogOut, mail: Mail, 'mail-check': MailCheck, 'map-pin': MapPin, menu: Menu,
  'message-circle': MessageCircle, mic: Mic, moon: Moon, 'notebook-pen': NotebookPen, paperclip: Paperclip,
  pencil: Pencil, phone: Phone, pill: Pill, plus: Plus, 'qr-code': QrCode, receipt: Receipt, 'refresh-cw': RefreshCw,
  search: Search, send: Send, settings: Settings, 'share-2': Share2, 'shield-check': ShieldCheck, signal: Signal,
  smartphone: Smartphone, square: Square, stamp: Stamp, star: Star, stethoscope: Stethoscope, sun: Sun, tag: Tag,
  timer: Timer, trash: Trash2, 'trending-up': TrendingUp, upload: Upload, user: User, 'user-plus': UserPlus,
  'user-x': UserX, users: Users, video: Video, wallet: Wallet, wifi: Wifi, 'wifi-off': WifiOff, x: X,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

/** Icône Lucide. L'attribut data-lucide garde la compatibilité avec les styles de la maquette. */
export function Icon({ name, className, size, label }: { name: IconName; className?: string; size?: number; label?: string }) {
  const Component = ICONS[name]
  return (
    <Component
      data-lucide={name}
      className={className}
      width={size}
      height={size}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  )
}
