"use client";

import { ChevronDownIcon, MoreIcon, UserIcon } from "@/components/icons";
import { useSignIn } from "@/components/sign-in/SignInProvider";
import type { Viewer } from "@/lib/auth/get-session";
import { getInitials } from "@/lib/auth/initials";
import { useI18n } from "@/lib/i18n/provider";
import { getCurrentPlan } from "@/lib/pricing/current-plan";
import { getPlan, localize } from "@/lib/pricing/plans";
import type { ThemeChoice } from "@/lib/theme";
import {
  LanguageGroup,
  MenuDivider,
  MenuLink,
  PopoverMenu,
} from "./PopoverMenu";
import { ThemeToggle } from "./ThemeToggle";
import { useTooltip } from "./use-tooltip";
import styles from "./SidebarContent.module.css";

interface SidebarAccountProps {
  viewer: Viewer | null;
  collapsed: boolean;
  initialTheme: ThemeChoice;
  onNavigate?: (() => void) | undefined;
}

/**
 * The bottom of the sidebar. Expanded, one row: sign in (or the account) then
 * the theme toggle, and More for guests. On the rail the same controls stack.
 */
export function SidebarAccount({
  viewer,
  collapsed,
  initialTheme,
  onNavigate,
}: SidebarAccountProps) {
  const toggle = (
    <ThemeToggle initialTheme={initialTheme} collapsed={collapsed} />
  );
  return (
    <div className={styles.bottomRow} data-collapsed={collapsed}>
      {viewer ? (
        <>
          <AccountMenu
            viewer={viewer}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
          {toggle}
        </>
      ) : (
        <>
          <SignInButton collapsed={collapsed} />
          {toggle}
          <MoreMenu collapsed={collapsed} onNavigate={onNavigate} />
        </>
      )}
    </div>
  );
}

function SignInButton({ collapsed }: { collapsed: boolean }) {
  const { open } = useSignIn();
  const { t } = useI18n();
  const { targetRef, handlers, tip } = useTooltip(t("nav.signIn"), true);
  return (
    <>
      <button
        ref={targetRef as React.RefObject<HTMLButtonElement>}
        type="button"
        className={collapsed ? styles.iconButton : styles.signIn}
        aria-haspopup="dialog"
        aria-label={collapsed ? t("nav.signIn") : undefined}
        onClick={(event) => open(event.currentTarget)}
        {...(collapsed ? handlers : {})}
      >
        {collapsed ? <UserIcon /> : t("nav.signIn")}
      </button>
      {collapsed ? tip : null}
    </>
  );
}

function MoreMenu({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  const { t } = useI18n();
  const { targetRef, handlers, tip } = useTooltip(t("nav.more"), collapsed);
  return (
    <PopoverMenu
      label={t("nav.more")}
      collapsed={collapsed}
      onNavigate={onNavigate}
      trigger={({ ref, open, menuId, onClick }) => (
        <>
          <button
            ref={(node) => {
              ref.current = node;
              targetRef.current = node;
            }}
            type="button"
            className={styles.iconButton}
            aria-label={t("nav.more")}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            onClick={onClick}
            {...handlers}
          >
            <MoreIcon />
          </button>
          {open ? null : tip}
        </>
      )}
    >
      {(close) => (
        <>
          <MenuLink href="/settings" onClick={close}>
            {t("nav.settings")}
          </MenuLink>
          <MenuLink href="/help" onClick={close}>
            {t("nav.help")}
          </MenuLink>
          <MenuLink href="/pricing" onClick={close}>
            {t("nav.plansPricing")}
          </MenuLink>
          <MenuDivider />
          <LanguageGroup />
        </>
      )}
    </PopoverMenu>
  );
}

function AccountMenu({
  viewer,
  collapsed,
  onNavigate,
}: {
  viewer: Viewer;
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  const { t, locale } = useI18n();
  const plan = getPlan(getCurrentPlan());
  return (
    <PopoverMenu
      label={t("account.menu")}
      collapsed={collapsed}
      grow
      onNavigate={onNavigate}
      trigger={({ ref, open, menuId, onClick }) => (
        <button
          ref={ref}
          type="button"
          className={styles.accountButton}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={onClick}
        >
          <span className={styles.avatar} aria-hidden="true">
            {getInitials(viewer.name)}
          </span>
          <span className={collapsed ? styles.srOnly : styles.accountText}>
            <span className={styles.accountName}>{viewer.name}</span>
            <span className={styles.accountPlan}>
              {t("plan.label", { plan: localize(plan.name, locale) })}
            </span>
          </span>
          {collapsed ? null : (
            <ChevronDownIcon className={styles.chevron} aria-hidden="true" />
          )}
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuLink href="/settings" onClick={close}>
            {t("nav.settings")}
          </MenuLink>
          <MenuLink href="/pricing" onClick={close}>
            {t("plan.upgrade")}
          </MenuLink>
          <MenuLink href="/help" onClick={close}>
            {t("nav.help")}
          </MenuLink>
          <MenuDivider />
          <LanguageGroup />
          <MenuDivider />
          <form method="post" action="/api/auth/sign-out">
            <input type="hidden" name="csrf" value={viewer.signOutToken} />
            <button type="submit" role="menuitem" className={styles.menuItem}>
              {t("nav.signOut")}
            </button>
          </form>
        </>
      )}
    </PopoverMenu>
  );
}
