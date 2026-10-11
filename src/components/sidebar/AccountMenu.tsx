"use client";

import { useRef, type ReactNode } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { useEntitlements } from "@/components/entitlements/EntitlementsProvider";
import { ChevronDownIcon, MoreIcon, UserIcon } from "@/components/icons";
import { useSignIn } from "@/components/sign-in/SignInProvider";
import type { Viewer } from "@/lib/auth/get-session";
import { getInitials } from "@/lib/auth/initials";
import { useI18n } from "@/lib/i18n/provider";
import { GUEST_TIER } from "@/lib/plans/entitlements";
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
 * the theme toggle, and More for people who are not signed in. On the rail the
 * same controls stack.
 */
export function SidebarAccount({
  viewer,
  collapsed,
  initialTheme,
  onNavigate,
}: SidebarAccountProps) {
  const { t } = useI18n();
  const { identity, logout } = useAccount();
  const toggle = (
    <ThemeToggle initialTheme={initialTheme} collapsed={collapsed} />
  );

  let account: ReactNode = null;
  if (viewer) {
    account = (
      <AccountMenu
        name={viewer.name}
        initials={getInitials(viewer.name)}
        collapsed={collapsed}
        onNavigate={onNavigate}
        exit={() => (
          <form method="post" action="/api/auth/sign-out">
            <input type="hidden" name="csrf" value={viewer.signOutToken} />
            <button type="submit" role="menuitem" className={styles.menuItem}>
              {t("nav.signOut")}
            </button>
          </form>
        )}
      />
    );
  } else if (identity.kind === "preview") {
    account = (
      <AccountMenu
        name={identity.name}
        initials={identity.initials}
        collapsed={collapsed}
        onNavigate={onNavigate}
        exit={(close) => (
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              close();
              void logout();
            }}
          >
            {t("nav.signOut")}
          </button>
        )}
      />
    );
  } else if (identity.kind === "guest") {
    account = (
      <GuestMenu
        collapsed={collapsed}
        onNavigate={onNavigate}
        label={t("account.guest")}
      />
    );
  }

  return (
    <div className={styles.bottomRow} data-collapsed={collapsed}>
      {account ? (
        <>
          {account}
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

interface AccountMenuProps {
  name: string;
  initials: string;
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
  /** The last item: Sign out, or Sign in for a guest. */
  exit: (close: () => void, trigger: HTMLElement | null) => ReactNode;
}

function AccountMenu({
  name,
  initials,
  collapsed,
  onNavigate,
  exit,
}: AccountMenuProps) {
  const { t, locale, formatNumber } = useI18n();
  const { tier, entitlements, remaining } = useEntitlements();
  // A guest is never shown a plan name: they see what a day allows.
  const subtitle =
    tier === GUEST_TIER
      ? t("limits.perDay", {
          count: formatNumber(entitlements.dailyPlans ?? 0),
        })
      : t("plan.label", { plan: localize(getPlan(tier).name, locale) });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <PopoverMenu
      label={t("account.menu")}
      collapsed={collapsed}
      grow
      onNavigate={onNavigate}
      trigger={({ ref, open, menuId, onClick }) => (
        <button
          ref={(node) => {
            ref.current = node;
            triggerRef.current = node;
          }}
          type="button"
          className={styles.accountButton}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={onClick}
        >
          <span className={styles.avatar} aria-hidden="true">
            {initials}
          </span>
          <span className={collapsed ? styles.srOnly : styles.accountText}>
            <span className={styles.accountName}>{name}</span>
            <span className={styles.accountPlan}>{subtitle}</span>
          </span>
          {collapsed ? null : (
            <ChevronDownIcon className={styles.chevron} aria-hidden="true" />
          )}
        </button>
      )}
    >
      {(close) => (
        <>
          {entitlements.dailyPlans !== null && remaining !== null ? (
            <span
              role="group"
              aria-label={t("limits.usageLabel")}
              className={styles.usageLine}
            >
              {t("limits.usageLine", {
                left: formatNumber(remaining),
                limit: formatNumber(entitlements.dailyPlans),
              })}
            </span>
          ) : null}
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
          {exit(close, triggerRef.current)}
        </>
      )}
    </PopoverMenu>
  );
}

/** A guest sees "Guest" and what a day allows, and can sign in from the menu. */
function GuestMenu({
  collapsed,
  onNavigate,
  label,
}: {
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
  label: string;
}) {
  const { t } = useI18n();
  const { open } = useSignIn();
  return (
    <AccountMenu
      name={label}
      initials={getInitials(label)}
      collapsed={collapsed}
      onNavigate={onNavigate}
      exit={(close, trigger) => (
        <button
          type="button"
          role="menuitem"
          className={styles.menuItem}
          aria-haspopup="dialog"
          onClick={() => {
            close();
            if (trigger) open(trigger);
          }}
        >
          {t("nav.signIn")}
        </button>
      )}
    />
  );
}
