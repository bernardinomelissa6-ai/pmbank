import {
  IconArrowDownCircle,
  IconArrowUpCircle,
  IconBarChart,
  IconCreditCard,
  IconHome,
  IconLandmark,
  IconLayers,
  IconSettings,
  IconTarget,
  IconUsers,
} from "@/components/layout/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof IconHome;
  adminOnly?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: IconHome },
  { href: "/gastos", label: "Gastos", icon: IconArrowUpCircle },
  { href: "/entradas", label: "Entradas", icon: IconArrowDownCircle },
  { href: "/relatorios", label: "Relatórios", icon: IconBarChart },
];

export const MORE_NAV: NavItem[] = [
  { href: "/cartoes", label: "Cartões", icon: IconCreditCard },
  { href: "/contas", label: "Contas", icon: IconLandmark },
  { href: "/parcelamentos", label: "Parcelamentos", icon: IconLayers },
  { href: "/metas", label: "Metas", icon: IconTarget },
  { href: "/usuarios", label: "Usuários", icon: IconUsers, adminOnly: true },
  { href: "/configuracoes", label: "Configurações", icon: IconSettings },
];
