export type SiteConfig = typeof siteConfig;

export type NavItem = {
  label: string;
  href: string;
  auth: boolean;
}

export const siteConfig = {
  name: "Next.js 14 + NextUI",
  description: "ACME SaaS. - AppSync + Cognito + DynamoDB + Amplify + Next.js (NextUI + TailwindCSS)",
  navItems: [
    {
      label: "Home",
      href: "/",
      auth: false,
    },
    {
      label: "Features",
      href: "/features",
      auth: false,
    },
    {
      label: "Profile",
      href: "/profile",
      auth: true,
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      auth: true,
    },
    {
      label: "Settings",
      href: "/settings",
      auth: true
    },
  ],

  links: {
    github: "https://github.com/nextui-org/nextui",
    twitter: "https://twitter.com/getnextui",
    docs: "https://nextui.org",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
    email:"support@support.com"
  },
};
