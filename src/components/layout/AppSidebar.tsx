import {
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode
} from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, HeartPulse, Search, X } from 'lucide-react';
import { CONFIG } from '@/config/constants';
import {
  NAV_SECTIONS,
  findActiveNav,
  getInitials,
  type NavItem,
  type NavSectionKey
} from '@/components/layout/navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuthStore } from '@/stores/userStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/** Short enough to feel instant, long enough that sweeping past the rail stays quiet. */
const TOOLTIP_DELAY_MS = 80;

/** Which section headings the user has folded away, remembered per device. */
const CLOSED_SECTIONS_KEY = 'pulseone-sidebar-closed-sections';

/**
 * Centring for a rail row, used by the nav items, the brand mark and the
 * account chip alike so all three land on the same axis.
 *
 * `justify-center` on the flex line, not `place-items-center` on a grid: a grid
 * with one auto column sizes that column to the icon, so centring the item
 * *within its column* moves nothing and the column itself stays where
 * `justify-content` puts it — hard against the start edge. That mistake left
 * every icon 8px left of centre.
 *
 * `px-0` widens the row to the full rail so the centred child sits on the rail's
 * axis rather than inside the padding the expanded labels need, and `gap-0`
 * means the accent bar could not shift the icon even if it ever stopped being
 * absolutely positioned.
 */
const RAIL_ITEM = 'justify-center gap-0 px-0';

/** Every interactive row shares one ring so keyboard focus never disappears. */
const FOCUS_RING =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card';

// "PulseOne Hospital Management" does not fit one line at 256px, so the first
// word carries the lockup and the rest becomes a caption. Only the caption is
// translated: the first word is the product's name, which reads the same in
// both languages, while the rest of the string is a description of it.
const [BRAND_NAME] = CONFIG.appName.split(' ');

/**
 * A half-written or hand-edited value should cost the user a remembered
 * preference, not the navigation — an exception thrown here would take the
 * whole shell down on boot.
 */
function readClosedSections(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CLOSED_SECTIONS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === 'string') : [];
  } catch {
    return [];
  }
}

interface AppSidebarProps {
  /** Desktop rail state; the mobile drawer is always full width. */
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  /**
   * Opens the rail back up. The filter box has nowhere to live at 64px, so the
   * rail offers a search button that widens the panel first rather than a
   * control that silently does nothing.
   */
  onExpand: () => void;
}

export function AppSidebar({ collapsed, mobileOpen, onCloseMobile, onExpand }: AppSidebarProps) {
  const { t } = useTranslation();
  const { user, can } = useAuthStore();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [query, setQuery] = useState('');
  const [closedSections, setClosedSections] = useState<string[]>(readClosedSections);
  /**
   * Set when a focus gesture arrives while the box is still unmounted behind
   * the rail. Focusing in the same tick would target an input React has not
   * committed yet, so the request is parked and honoured by the effect below
   * once the panel is actually open.
   */
  const [focusPending, setFocusPending] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Rail mode is a desktop-only state: on a phone the same `collapsed` flag is
  // irrelevant because the drawer always opens at full width.
  const railMode = collapsed && isDesktop;

  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0;

  useEffect(() => {
    localStorage.setItem(CLOSED_SECTIONS_KEY, JSON.stringify(closedSections));
  }, [closedSections]);

  const activeSectionKey = findActiveNav(location.pathname).section?.labelKey;

  /**
   * NavLink's own `className`/`children` render props cannot be used here.
   * In rail mode the row is handed to Radix's tooltip trigger as `asChild`,
   * and its Slot merges `className` by joining the two values as strings — so
   * a *function* lands in the DOM as its own source text, and the row loses
   * every class it had. That is what emptied the collapsed rail: the icons were
   * in the DOM, inside a box with no size, no centring and no colour of its
   * own. Resolving the active route here keeps both props plain values, which
   * clone safely through the Slot.
   *
   * The rule mirrors NavLink's: exact for "/", otherwise the path itself or one
   * of its descendants — never a bare `startsWith`, which would light up
   * /invoices while sitting on /invoices-archive.
   */
  const isItemActive = (to: string) =>
    to === '/'
      ? location.pathname === '/'
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

  /**
   * Landing inside a folded section — from a deep link, a redirect, or a link
   * on another page — unfolds it, so the menu always shows where the user is.
   * Keyed on the section rather than the pathname so that folding the section
   * you are currently in still sticks; it only reopens when you navigate into
   * a different one.
   */
  useEffect(() => {
    if (!activeSectionKey) return;
    setClosedSections(keys => (keys.includes(activeSectionKey) ? keys.filter(key => key !== activeSectionKey) : keys));
  }, [activeSectionKey]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      // On a phone the panel is off-screen until the user opens the drawer, and
      // focusing a control they cannot see would strand the caret.
      if (!isDesktop) return;

      event.preventDefault();
      onExpand();
      setFocusPending(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, onExpand]);

  useEffect(() => {
    if (!focusPending || railMode) return;
    searchRef.current?.focus();
    searchRef.current?.select();
    setFocusPending(false);
  }, [focusPending, railMode]);

  // Nothing to filter with once the labels are gone, and a stale query would
  // silently hide icons from the rail.
  useEffect(() => {
    if (railMode) setQuery('');
  }, [railMode]);

  /**
   * In rail mode each icon gets its own popup; expanded, the label is already
   * on screen. The key lives on whichever element ends up in the list, since
   * the tooltip wrapper replaces the link as the array item.
   */
  const withTooltip = (key: string, trigger: ReactElement, content: ReactNode) =>
    railMode ? (
      <Tooltip key={key}>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="right">{content}</TooltipContent>
      </Tooltip>
    ) : (
      // Expanded, the trigger itself is the list item, so the key has to be
      // cloned onto it — returning it bare left every nav item keyless and
      // React rebuilt the whole list on each render instead of matching items.
      cloneElement(trigger, { key })
    );

  /**
   * Sections whose every item is hidden — by permissions, or by the filter —
   * would render as a heading over nothing, so they are dropped entirely.
   *
   * The route is matched as well as the label because the people who live in
   * this app navigate by URL fragment: "grn" and "stock-open" find their
   * screens without anyone having to recall the display name.
   */
  const visibleSections = useMemo(
    () =>
      NAV_SECTIONS.map(section => {
        const permitted = section.items.filter(item => !item.permission || can(item.permission));
        const sectionLabel = t(section.labelKey).toLowerCase();

        return {
          ...section,
          items: isFiltering
            ? permitted.filter(
                item =>
                  t(item.labelKey).toLowerCase().includes(normalizedQuery) ||
                  item.to.toLowerCase().includes(normalizedQuery) ||
                  sectionLabel.includes(normalizedQuery)
              )
            : permitted
        };
      }).filter(section => section.items.length > 0),
    [can, isFiltering, normalizedQuery, t]
  );

  const matchCount = visibleSections.reduce((total, section) => total + section.items.length, 0);

  const handleNavigate = () => {
    // A filtered menu has served its purpose the moment a result is opened;
    // leaving the query in place meant coming back to a menu missing most of
    // its items with no obvious reason why.
    setQuery('');
    onCloseMobile();
  };

  const renderItem = (section: { labelKey: NavSectionKey }, item: NavItem) => {
    const tooltip = (
      <span className="flex flex-col">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {t(section.labelKey)}
        </span>
        <span className="font-medium">{t(item.labelKey)}</span>
        {item.soon && <span className="text-xs text-muted-foreground">{t('nav.soonHint')}</span>}
      </span>
    );

    // Modules without a screen yet are inert rather than links: clicking one
    // used to land the user on a 404 with no explanation.
    if (item.soon) {
      return withTooltip(
        item.to,
        <div
          aria-disabled
          className={cn(
            // `opacity-60` rather than `text-muted-foreground/60`: element
            // opacity is applied by the browser, so it dims whatever the theme
            // resolved. The colour modifier would freeze the light value.
            'flex cursor-not-allowed items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground opacity-60',
            railMode && `h-10 w-full ${RAIL_ITEM}`
          )}
        >
          <item.icon className="h-4.5 w-4.5 shrink-0" />
          {!railMode && (
            <>
              <span className="truncate">{t(item.labelKey)}</span>
              <span className="ml-auto shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide">
                {t('nav.soon')}
              </span>
            </>
          )}
        </div>,
        tooltip
      );
    }

    const isActive = isItemActive(item.to);

    return withTooltip(
      item.to,
      <NavLink
        to={item.to}
        end={item.to === '/'}
        onClick={handleNavigate}
        className={cn(
          'group relative flex items-center gap-3 rounded-lg text-sm transition-colors',
          FOCUS_RING,
          // Collapsed, the row spans the rail and centres its icon with
          // flexbox — never `mx-auto` on a fixed width. An auto margin only
          // centres while the box fits: the moment the scrolling nav's
          // content box is the narrower of the two, both margins collapse to
          // zero and every icon slams against the left edge.
          //
          // The icon also sits directly in this row, with no wrapper of its
          // own. Nesting it inside a fixed-size chip is what made the whole
          // column render blank, and no amount of class-level checking
          // explained why — so the structure stays flat, which is the shape
          // that is known to paint.
          railMode ? `h-10 w-full ${RAIL_ITEM}` : 'px-2.5 py-2',
          // Both surfaces are whole theme tokens, never `bg-primary/10`,
          // which bakes the light-mode teal and leaves the dark rail tinted
          // with a colour that does not belong to it. The hierarchy still
          // reads: card < muted on hover < accent when active, with the
          // primary text and the accent bar carrying the rest.
          isActive
            ? 'bg-accent font-medium text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        {/* Accent bar marks the active route in both modes. Absolute and
            pointer-events-none so it can neither take part in the layout
            that centres the icon nor swallow a click meant for it.

            `left-0`, inside the row, rather than pulled out to the sidebar
            edge: the scrolling nav clips anything left of its content box,
            and in LTR that overflow is not even scrollable — a bar hung on
            a negative offset simply would not be drawn. In the rail the row
            starts at the sidebar's own edge, so `left-0` already puts it
            exactly where it belongs. */}
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
        />
        {/* No colour of its own — it inherits the row's, which is the only
            way to stay theme-aware. An opacity modifier such as
            `text-muted-foreground/80` is resolved by Tailwind at build
            time, and because this palette redefines its tokens inside
            `.dark` as ordinary CSS, that bakes in the *light* value. On the
            dark card the icons then painted at about 1.9:1 against their
            own background — present in the DOM, invisible on screen. */}
        <item.icon className="h-4.5 w-4.5 shrink-0" />
        {!railMode && <span className="truncate">{t(item.labelKey)}</span>}
      </NavLink>,
      tooltip
    );
  };

  return (
    <TooltipProvider delayDuration={TOOLTIP_DELAY_MS} skipDelayDuration={300}>
      <aside
        data-print-hide
        className={cn(
          // The right-hand rule is an inset shadow, not `border-r`. A border is
          // part of the box, so it takes a pixel off the content width and
          // leaves everything centred inside it half a pixel to the left of the
          // rail's true middle — visible on a 64px rail. An inset shadow paints
          // the same line without touching the layout.
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden bg-card',
          'shadow-[inset_-1px_0_0_0_var(--color-border)]',
          'transition-[width,transform,visibility] duration-200 ease-out lg:translate-x-0',
          // `invisible` rather than transform alone: a drawer parked off-screen
          // still had all thirty of its links in the tab order, so a phone user
          // tabbing through a page walked the entire hidden menu first. Because
          // visibility flips at the end of the transition, the slide-out
          // animation still plays in full.
          mobileOpen ? 'visible translate-x-0 shadow-2xl' : 'invisible -translate-x-full lg:visible',
          collapsed ? 'lg:w-16' : 'lg:w-64'
        )}
        aria-label={t('shell.mainNavigation')}
      >
        {/* Brand only — the single collapse control lives in the header, so the
            rail and the panel never show two of them. */}
        <div
          className={cn(
            'flex h-14 shrink-0 items-center gap-2.5 border-b px-3',
            railMode && RAIL_ITEM
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <HeartPulse className="h-5 w-5" />
          </div>
          {!railMode && (
            <>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight tracking-tight">{BRAND_NAME}</p>
                <p className="truncate text-[11px] leading-tight text-muted-foreground">
                  {t('common.appTagline')}
                </p>
              </div>

              {/* The drawer used to be dismissable only by hitting the backdrop,
                  which is a target you have to know is there. */}
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label={t('shell.closeNavigation')}
                className={cn(
                  'ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden',
                  FOCUS_RING
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Thirty items across five sections is more than anyone scans; the
            filter is how you get to a screen you already know the name of. */}
        <div className={cn('shrink-0 pt-3', railMode ? 'px-0' : 'px-3')}>
          {railMode ? (
            // Centred exactly like a nav row — a full-width flex line, not an
            // auto margin — so the two sit on the same axis by construction.
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    onExpand();
                    setFocusPending(true);
                  }}
                  aria-label={t('nav.filter.open')}
                  className={cn(
                    'flex h-10 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                    FOCUS_RING
                  )}
                >
                  <Search className="h-4.5 w-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{t('nav.filter.open')}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={event => setQuery(event.target.value)}
                onKeyDown={event => {
                  if (event.key !== 'Escape') return;
                  // Escape clears first and only gives up focus on a second
                  // press, so a mistyped query does not also cost the caret.
                  if (query) {
                    event.stopPropagation();
                    setQuery('');
                  } else {
                    event.currentTarget.blur();
                  }
                }}
                placeholder={t('nav.filter.placeholder')}
                aria-label={t('nav.filter.label')}
                className={cn(
                  'h-9 w-full rounded-lg border border-input bg-background pl-8 pr-8 text-sm transition-colors',
                  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    searchRef.current?.focus();
                  }}
                  aria-label={t('nav.filter.clear')}
                  className={cn(
                    'absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                    FOCUS_RING
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <nav
          className={cn(
            // `overscroll-contain` keeps a flick at the end of the menu from
            // scrolling the page underneath it.
            'flex-1 overflow-y-auto overscroll-contain',
            railMode ? 'space-y-1 px-0 py-3' : 'space-y-3 p-3'
          )}
          /*
           * The rail centres on the sidebar's own axis, so this nav must not
           * end up with a narrower content box than the unscrolled rows above
           * and below it. A classic 8px scrollbar eats into the content box of
           * *this element only*, which is what put every icon off the axis the
           * brand mark, the search button and the account avatar sit on.
           *
           * Hidden, not thinned: any width at all reintroduces half of itself
           * as an offset. The rule lives in index.css keyed off this attribute
           * rather than as a Tailwind arbitrary variant, because the base layer
           * styles `*::-webkit-scrollbar` globally and an attribute selector
           * beats it outright instead of depending on layer order. The rail
           * still scrolls by wheel, trackpad and keyboard.
           */
          data-rail-scroll={railMode ? '' : undefined}
        >
          {/* The count is for screen readers only: sighted users watch the list
              itself shrink, but a filter that silently rewrites a list off-view
              tells a screen-reader user nothing. */}
          <p className="sr-only" role="status">
            {isFiltering ? t('nav.filter.resultCount', { count: matchCount }) : ''}
          </p>

          {visibleSections.map((section, index) => {
            // Filtering overrides the fold: results the user asked for should
            // never sit behind a closed heading.
            const isOpen = isFiltering || !closedSections.includes(section.labelKey);
            const holdsActive = section.labelKey === activeSectionKey;

            return (
              <div key={section.labelKey}>
                {railMode ? (
                  // Collapsed, the heading gives way to a rule so the icon
                  // groups stay visually separated. The first group needs no
                  // divider above it.
                  index > 0 && <div className="mx-auto mb-1 h-px w-8 bg-border" />
                ) : isFiltering ? (
                  // A control that cannot fold anything would be a lie while
                  // filtering, so the heading goes back to being a label.
                  <p className="sticky top-0 z-10 bg-card px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(section.labelKey)}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setClosedSections(keys =>
                        keys.includes(section.labelKey)
                          ? keys.filter(key => key !== section.labelKey)
                          : [...keys, section.labelKey]
                      )
                    }
                    // Named by its own text and stated by `aria-expanded`, the
                    // standard disclosure pattern — a hand-written
                    // "Collapse Billing" label would override the content and
                    // then have to be kept in step with the real state.
                    aria-expanded={isOpen}
                    className={cn(
                      // Sticky so the group you are scrolling through stays
                      // named; opaque so the rows do not run under the text.
                      'sticky top-0 z-10 flex w-full items-center gap-1.5 rounded-md bg-card px-2 py-1.5',
                      'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                      'transition-colors hover:text-foreground',
                      FOCUS_RING
                    )}
                  >
                    <span className="truncate">{t(section.labelKey)}</span>

                    {/* Folded away, the section still has to admit it holds the
                        page you are looking at — otherwise the menu shows no
                        active item anywhere. */}
                    {!isOpen && holdsActive && (
                      <>
                        <span
                          aria-hidden
                          title={t('nav.sectionHasActive')}
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        />
                        {/* A bare span carries no accessible name of its own,
                            so the dot's meaning is spelled out for the reader
                            that cannot see it. */}
                        <span className="sr-only">{t('nav.sectionHasActive')}</span>
                      </>
                    )}

                    <ChevronDown
                      aria-hidden
                      className={cn(
                        'ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                        !isOpen && '-rotate-90'
                      )}
                    />
                  </button>
                )}

                {(railMode || isOpen) && (
                  <div className={cn('space-y-0.5', !railMode && 'pt-0.5')}>
                    {section.items.map(item => renderItem(section, item))}
                  </div>
                )}
              </div>
            );
          })}

          {isFiltering && matchCount === 0 && (
            <div className="px-2 py-8 text-center">
              <p className="text-sm font-medium">{t('nav.filter.empty', { query: query.trim() })}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('nav.filter.emptyHint')}</p>
            </div>
          )}
        </nav>

        <div className="shrink-0 border-t p-3">
          {withTooltip(
            'account',
            <div className={cn('flex items-center gap-3', railMode && RAIL_ITEM)}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {getInitials(user?.username)}
              </div>
              {!railMode && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user?.username}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.role}
                    {user?.isSuperUser && ` · ${t('shell.superUser')}`}
                  </p>
                </div>
              )}
            </div>,
            <span className="flex flex-col">
              <span className="font-medium">{user?.username}</span>
              <span className="text-xs text-muted-foreground">
                {user?.role}
                {user?.isSuperUser && ` · ${t('shell.superUser')}`}
              </span>
            </span>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
