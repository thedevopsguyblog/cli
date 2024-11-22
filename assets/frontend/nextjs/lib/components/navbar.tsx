"use client"

import React from "react"
import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
  Link,
} from "@nextui-org/react"
import { link as linkStyles } from "@nextui-org/theme"
import NextLink from "next/link"
import clsx from "clsx"
import { siteConfig } from "@/lib/config/site"
import { ThemeSwitch } from "@/lib/components/theme-switch"
import { MdImportantDevices } from "react-icons/md"
import { logger } from "@/lib/utils"
import type { NavItem } from "@/lib/config/site"
import { useIsUserAuthed } from "@/lib/context/userCtx"
import { SignInModal } from "@/lib/components/signinModal"

export const Navbar = () => {
  const [navLinks, setNavLinks] = React.useState<NavItem[]>([])
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const authed = useIsUserAuthed()

  React.useEffect(() => {
    const createNavLinks = (navbarItems: Array<NavItem>) => {
      switch (authed) {
        case true:
          setNavLinks(navbarItems.filter((route: NavItem) => route.auth === true))
          break
        default:
          setNavLinks(navbarItems.filter((route: NavItem) => route.auth === false))
          break
      }
    }
    createNavLinks(siteConfig.navItems)
  }, [authed])

  return (
    <NextUINavbar maxWidth="xl" position="sticky" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
      {/* Desktop layout */}
      <NavbarContent className="hidden sm:flex" justify="start">
        <NavbarBrand className="mr-4">
          <NextLink className="flex items-center gap-1" href="/">
            <MdImportantDevices className="text-2xl" />
            <p className="font-bold text-inherit">ACME</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex" justify="center">
        {navLinks.map((item) => (
          <NavbarItem key={item.href}>
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active=true]:font-medium"
              )}
              href={item.href}
            >
              {item.label}
            </NextLink>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent className="hidden sm:flex" justify="end">
        <NavbarItem>
          <SignInModal />
        </NavbarItem>
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>

      {/* Mobile layout */}
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
        <NavbarBrand>
          <NextLink className="flex items-center gap-1" href="/">
            <MdImportantDevices className="text-2xl" />
            <p className="font-bold text-inherit">ACME</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="lg:hidden" justify="end">
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem>
          <SignInModal />
        </NavbarItem>
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu>
        {navLinks.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "w-full",
                "data-[active=true]:text-primary data-[active=true]:font-medium"
              )}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </NextLink>
          </NavbarMenuItem>
        ))}
        <NavbarMenuItem>
          <SignInModal />
        </NavbarMenuItem>
      </NavbarMenu>
    </NextUINavbar>
  )
}