import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  Filter,
  Grid2x2,
  Home,
  LogOut,
  Moon,
  Phone,
  Plus,
  Repeat2,
  Search,
  Settings,
  Sparkles,
  StickyNote,
  Sun,
  Trash2,
  User,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  calendar: Calendar,
  grid: Grid2x2,
  plus: Plus,
  repeat: Repeat2,
  users: Users,
  chart: BarChart3,
  clock: Clock,
  phone: Phone,
  check: Check,
  x: X,
  edit: StickyNote,
  trash: Trash2,
  chevronL: ChevronLeft,
  chevronR: ChevronRight,
  chevronD: ChevronDown,
  search: Search,
  bell: Bell,
  sun: Sun,
  moon: Moon,
  wallet: Wallet,
  arrowUR: ArrowUpRight,
  arrowDR: ArrowDownRight,
  logout: LogOut,
  user: User,
  note: StickyNote,
  filter: Filter,
  spark: Sparkles,
  card: CreditCard,
  eye: Eye,
  alert: AlertTriangle,
  settings: Settings,
};

export type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
}

export function Icon({ name, size = 20, stroke = 1.7, className }: IconProps) {
  const Lucide = ICON_MAP[name];
  if (!Lucide) return null;
  return (
    <Lucide
      size={size}
      strokeWidth={stroke}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}
