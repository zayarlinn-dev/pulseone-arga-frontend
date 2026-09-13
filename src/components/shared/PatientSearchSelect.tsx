import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PatientSummaryCard } from '@/components/shared/PatientSummaryCard';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { patientService } from '@/services';
import type { Patient } from '@/types/models';

/** Below this the result set is the whole register, so the query stays idle. */
const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 8;

interface PatientSearchSelectProps {
  value: Patient | null;
  onChange: (patient: Patient | null) => void;
  disabled?: boolean;
  /** Set false where the surrounding screen already shows the history itself. */
  showSummary?: boolean;
}

/**
 * Type-to-find patient picker used by the visit and admission forms.
 *
 * The registration desk knows a patient by number, name or phone rather than by
 * id, so this searches the same four columns the backend's /search does and
 * hands back the whole record — callers need the patient number for their
 * confirmation copy, not just the id.
 *
 * Once a patient is selected their history panel appears beneath the picker:
 * whoever is at the desk needs to know whether this is a first visit or a
 * twentieth before they can decide anything else.
 */
export function PatientSearchSelect({
  value,
  onChange,
  disabled,
  showSummary = true
}: PatientSearchSelectProps) {
  const { t } = useTranslation();
  const [term, setTerm] = useState('');
  const debouncedTerm = useDebouncedValue(term);
  const isSearchable = debouncedTerm.trim().length >= MIN_SEARCH_LENGTH;

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['patient-search', debouncedTerm],
    enabled: isSearchable && !value && !disabled,
    queryFn: () => patientService.search(debouncedTerm.trim())
  });

  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-md border border-input px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.patientName}</p>
            <p className="truncate text-xs text-muted-foreground">
              <span className="font-mono">{value.patientNo}</span>
              {value.phoneNo ? ` · ${value.phoneNo}` : ''}
              {value.age != null ? ` · ${value.age}y` : ''} · {value.gender}
            </p>
          </div>
          {value.vip && <Badge variant="warning">VIP</Badge>}
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                onChange(null);
                setTerm('');
              }}
              aria-label={t('patients.search.clear')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showSummary && <PatientSummaryCard patientId={value.id} />}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          disabled={disabled}
          onChange={event => setTerm(event.target.value)}
          placeholder={t('patients.search.placeholder')}
          className="pl-8"
        />
        {isFetching && (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isSearchable && (
        <div className="max-h-52 overflow-y-auto rounded-md border">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              {isFetching ? t('patients.search.searching') : t('patients.search.noResults')}
            </p>
          ) : (
            results.slice(0, MAX_RESULTS).map(patient => (
              <button
                key={patient.id}
                type="button"
                onClick={() => onChange(patient)}
                className="flex w-full items-center gap-2 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{patient.patientName}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    <span className="font-mono">{patient.patientNo}</span>
                    {patient.phoneNo ? ` · ${patient.phoneNo}` : ''} · {patient.gender}
                  </span>
                </span>
                {patient.vip && <Badge variant="warning">VIP</Badge>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
