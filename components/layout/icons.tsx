import { SVGProps } from "react";

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconHome = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9h12v-9" />
  </Icon>
);

export const IconArrowDownCircle = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v7m0 0-3-3m3 3 3-3" />
  </Icon>
);

export const IconArrowUpCircle = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 17v-7m0 0-3 3m3-3 3 3" />
  </Icon>
);

export const IconCreditCard = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10.5h18" />
    <path d="M6.5 15h3" />
  </Icon>
);

export const IconWallet = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v2" />
    <rect x="3" y="7.5" width="18" height="11.5" rx="2" />
    <path d="M16 13h2.5" />
  </Icon>
);

export const IconLayers = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="m12 3 9 4.5-9 4.5-9-4.5Z" />
    <path d="m3 12 9 4.5 9-4.5" />
    <path d="m3 16.5 9 4.5 9-4.5" />
  </Icon>
);

export const IconTarget = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" />
  </Icon>
);

export const IconBarChart = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 20V10" />
    <path d="M12 20V4" />
    <path d="M20 20v-7" />
    <path d="M2 20h20" />
  </Icon>
);

export const IconUsers = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="9" cy="8" r="3" />
    <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
    <path d="M16 8.2a3 3 0 1 1 3.2 5.4" />
    <path d="M15.5 15c3 .4 5 1.9 5.4 4" />
  </Icon>
);

export const IconSettings = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7.7 7.7 0 0 0-1.7-1L15 3h-4l-.3 2.6a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.7 7.7 0 0 0 1.7 1L9 21h4l.3-2.6a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.4Z" />
  </Icon>
);

export const IconLandmark = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 21h16" />
    <path d="M4 10h16" />
    <path d="m12 3 9 4.5H3Z" />
    <path d="M6 10v8" />
    <path d="M12 10v8" />
    <path d="M18 10v8" />
  </Icon>
);

export const IconMenu = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </Icon>
);

export const IconClose = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="m5 5 14 14" />
    <path d="m19 5-14 14" />
  </Icon>
);

export const IconLogout = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
);
