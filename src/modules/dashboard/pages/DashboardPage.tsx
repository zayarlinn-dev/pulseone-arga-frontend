import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries, useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BedDouble,
  Boxes,
  CalendarClock,
  PackageX,
  Receipt,
  TrendingUp,
  UserPlus,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { dashboardService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { cn, formatCurrency } from '@/lib/utils';
import { TakingsChart } from '../components/TakingsChart';
import { RegistrationsChart } from '../components/RegistrationsChart';

const RANGES = [
  { days: 7, labelKey: 'dashboard.range.days7' },
  { days: 30, labelKey: 'dashboard.range.days30' },
  { days: 90, labelKey: 'dashboard.range.days90' }
] as const;

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

interface StatTile {
  label: string;
  value: string;
  icon: typeof Users;
  /** Set when the number is worth acting on rather than just reading. */
  tone?: 'warning' | 'destructive';
  to?: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const navigate = useNavigate();
  const [rangeDays, setRangeDays] = useState<number>(30);

  const range = useMemo(
    () => ({ fromDate: isoDaysAgo(rangeDays), toDate: new Date().toISOString().slice(0, 10) }),
    [rangeDays]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', 'main'],
    queryFn: () => dashboardService.getMainCounts()
  });

  const { data: inventory } = useQuery({
    queryKey: ['dashboard', 'inventory'],
    enabled: can('get-inventory-dashboard-data-count'),
    queryFn: () => dashboardService.getInventoryCounts()
  });

  // The three charts move together with the range, so they are fetched
  // together. keepPreviousData holds the old chart on screen while the new
  // range loads — a skeleton flash on every filter change reads as breakage.
  const [revenueQuery, pharmacyQuery, genderQuery] = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'chart', 'revenue', range],
        placeholderData: keepPreviousData,
        queryFn: () => dashboardService.getRevenueChart(range)
      },
      {
        queryKey: ['dashboard', 'chart', 'pharmacy', range],
        placeholderData: keepPreviousData,
        queryFn: () => dashboardService.getPharmacySaleChart(range)
      },
      {
        queryKey: ['dashboard', 'chart', 'gender', range],
        placeholderData: keepPreviousData,
        queryFn: () => dashboardService.getPatientGenderChart(range)
      }
    ]
  });

  const tiles: StatTile[] = data
    ? [
        {
          label: t('dashboard.tile.totalPatients'),
          value: data.totalPatients.toLocaleString(),
          icon: Users
        },
        {
          label: t('dashboard.tile.registeredToday'),
          value: data.todayPatients.toLocaleString(),
          icon: UserPlus
        },
        {
          label: t('dashboard.tile.activeVisits'),
          value: data.activeVisits.toLocaleString(),
          icon: Activity
        },
        {
          label: t('dashboard.tile.admitted'),
          value: data.admittedPatients.toLocaleString(),
          icon: BedDouble
        },
        {
          label: t('dashboard.tile.invoicesToday'),
          value: data.todayInvoices.toLocaleString(),
          icon: Receipt
        },
        {
          label: t('dashboard.tile.revenueToday'),
          value: formatCurrency(data.todayRevenue),
          icon: TrendingUp
        }
      ]
    : [];

  const inventoryTiles: StatTile[] = inventory
    ? [
        {
          label: t('dashboard.tile.stockValue'),
          value: formatCurrency(inventory.stockValue),
          icon: Boxes,
          to: '/inventories/stock-balance'
        },
        {
          label: t('dashboard.tile.belowReorder'),
          value: inventory.belowReorder.toLocaleString(),
          icon: PackageX,
          tone: inventory.belowReorder > 0 ? 'warning' : undefined,
          to: '/inventories/stock-balance'
        },
        {
          label: t('dashboard.tile.expiringBatches'),
          value: inventory.expiringBatches.toLocaleString(),
          icon: CalendarClock,
          tone: inventory.expiringBatches > 0 ? 'destructive' : undefined,
          to: '/inventories/stock-balance'
        }
      ]
    : [];

  const renderTile = (tile: StatTile) => {
    const body = (
      <>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{tile.label}</CardTitle>
          <tile.icon
            className={cn(
              'h-4 w-4',
              tile.tone === 'warning' && 'text-warning',
              tile.tone === 'destructive' && 'text-destructive',
              !tile.tone && 'text-muted-foreground'
            )}
          />
        </CardHeader>
        <CardContent>
          {/* No tabular-nums on the hero figure: equal-width digits make a
              standalone number look mechanically spaced. */}
          <p
            className={cn(
              'text-2xl font-semibold',
              tile.tone === 'warning' && 'text-warning',
              tile.tone === 'destructive' && 'text-destructive'
            )}
          >
            {tile.value}
          </p>
        </CardContent>
      </>
    );

    return tile.to ? (
      <Card
        key={tile.label}
        role="button"
        tabIndex={0}
        onClick={() => navigate(tile.to!)}
        onKeyDown={event => event.key === 'Enter' && navigate(tile.to!)}
        className="cursor-pointer transition-colors hover:bg-accent/40"
      >
        {body}
      </Card>
    ) : (
      <Card key={tile.label}>{body}</Card>
    );
  };

  return (
    <>
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

      {isError && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : t('dashboard.loadFailed')}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? // Skeletons keep the grid from collapsing and re-flowing on load.
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-7 w-16 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))
          : tiles.map(renderTile)}
      </div>

      {/* One filter row for every chart below it — a range picker per card
          would let two charts disagree about the period they are showing. */}
      <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t('dashboard.trends')}</h2>
        <div
          className="flex items-center gap-1 rounded-lg border p-0.5"
          role="group"
          aria-label={t('dashboard.dateRange')}
        >
          {RANGES.map(option => (
            <Button
              key={option.days}
              variant={rangeDays === option.days ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={rangeDays === option.days}
              onClick={() => setRangeDays(option.days)}
            >
              {t(option.labelKey)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <TakingsChart
          revenue={revenueQuery.data ?? []}
          pharmacy={pharmacyQuery.data ?? []}
          loading={revenueQuery.isLoading || pharmacyQuery.isLoading}
        />
        <RegistrationsChart data={genderQuery.data ?? []} loading={genderQuery.isLoading} />
      </div>

      {inventoryTiles.length > 0 && (
        <>
          <h2 className="mb-4 mt-6 text-sm font-semibold">{t('dashboard.inventory')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inventoryTiles.map(renderTile)}
          </div>
        </>
      )}
    </>
  );
}
