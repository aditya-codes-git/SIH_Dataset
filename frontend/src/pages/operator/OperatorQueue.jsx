import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  FileUp, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  XCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getReviewStatus, getReferralRouting, sortScreeningsByDate } from '../../utils/clinicalStatus';

const PAGE_SIZE = 10;

export const OperatorQueue = ({ 
  screenings = [], 
  onNavigateScreening, 
  onViewScreening,
  onRecapture 
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Deterministic newest-first sort using actual timestamp
  const sorted = sortScreeningsByDate(screenings);

  const filtered = sorted.filter((s) => {
    const textMatch = (s.patientId || '').toLowerCase().includes(search.toLowerCase()) ||
                      (s.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
                      (s.screeningId || '').toLowerCase().includes(search.toLowerCase());
    if (!textMatch) return false;

    const reviewState = getReviewStatus(s);

    if (statusFilter === 'RECAPTURE') return reviewState.code === 'RECAPTURE';
    if (statusFilter === 'PENDING_REVIEW') return reviewState.code === 'PENDING_REVIEW';
    if (statusFilter === 'REVIEWED') return reviewState.code === 'REVIEWED';
    if (statusFilter === 'ROUTINE') return reviewState.code === 'NOT_REQUIRED';
    if (statusFilter === 'REFERABLE') return s.status === 'GRADABLE' && s.drGrade !== null && Number(s.drGrade) >= 2;
    return true;
  });

  // Pagination calculations
  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalRecords);
  const paginatedList = filtered.slice(startIndex, endIndex);

  const handleFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const isFiltering = search.trim() !== '' || statusFilter !== 'ALL';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
      {/* Search and Filters Bar */}
      <Card style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Patient ID, Name, or Screening ID..."
              value={search}
              onChange={handleSearchChange}
              className="clinical-input"
              style={{ paddingLeft: '2rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', marginRight: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Filter size={12} /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Cases' },
              { id: 'PENDING_REVIEW', label: 'Pending Review' },
              { id: 'REVIEWED', label: 'Reviewed' },
              { id: 'ROUTINE', label: 'Routine (Grade 0–1)' },
              { id: 'RECAPTURE', label: 'Recapture' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => handleFilterChange(f.id)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: 'var(--radius-xs)',
                  border: statusFilter === f.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: statusFilter === f.id ? 'var(--primary-light)' : 'transparent',
                  color: statusFilter === f.id ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '0.71875rem',
                  fontWeight: statusFilter === f.id ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                {f.label}
              </button>
            ))}

            {isFiltering && (
              <button
                onClick={handleClearFilters}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '0.71875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
                title="Clear filters"
              >
                <XCircle size={12} /> Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Queue Table */}
      <Card
        title="Screening Center Workflow Queue"
        subtitle={
          totalRecords > 0
            ? `Showing ${startIndex + 1}–${endIndex} of ${totalRecords} records${isFiltering ? ` (filtered from ${screenings.length} total in database)` : ''}`
            : `0 screening records found${isFiltering ? ` matching filters (${screenings.length} total in database)` : ''}`
        }
        headerBorder={true}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button variant="primary" size="sm" icon={FileUp} onClick={onNavigateScreening}>
              New Screening
            </Button>
          </div>
        }
      >
        <div style={{ overflowX: 'auto', margin: '0 -1.125rem -1rem -1.125rem' }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Screening ID</th>
                <th>Patient</th>
                <th>Date / Time</th>
                <th>Image Quality</th>
                <th>AI DR Grade</th>
                <th>Referral Routing</th>
                <th>Review Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No screening records matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedList.map((s) => {
                  const isUngradable = s.status === 'UNGRADABLE';
                  const isReferable = s.status === 'GRADABLE' && s.drGrade !== null && Number(s.drGrade) >= 2;
                  const referralInfo = getReferralRouting(s);
                  const reviewInfo = getReviewStatus(s);

                  return (
                    <tr key={s.screeningId || s._id}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="font-mono">
                        {s.screeningId ? s.screeningId.slice(0, 10) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="font-mono">
                            {s.patientId || 'PATIENT-ANONYMOUS'}
                          </span>
                          <span style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)' }}>
                            {s.patientName || 'Anonymous Patient'}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td>
                        {isUngradable ? (
                          <Badge variant="warning" size="sm">Recapture Required</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Quality Passed</Badge>
                        )}
                      </td>
                      <td>
                        {isUngradable ? (
                          <span style={{ color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 500 }}>IQA Failed</span>
                        ) : (
                          <Badge variant={isReferable ? 'danger' : 'success'} size="sm">
                            Grade {s.drGrade}
                          </Badge>
                        )}
                      </td>
                      <td>
                        {isUngradable ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                        ) : (
                          <Badge variant={referralInfo.variant} size="sm">
                            {referralInfo.label}
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Badge variant={reviewInfo.variant} size="sm">
                          {reviewInfo.label}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isUngradable ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            icon={RefreshCw} 
                            onClick={() => onRecapture ? onRecapture(s) : onNavigateScreening()}
                          >
                            Recapture
                          </Button>
                        ) : (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            icon={Eye} 
                            onClick={() => onViewScreening ? onViewScreening(s) : null}
                          >
                            View
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 0.5rem 0.25rem 0.5rem',
            borderTop: '1px solid var(--border-color)',
            marginTop: '1rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}>
            <span>
              Page {activePage} of {totalPages}
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="xs"
                icon={ChevronLeft}
                disabled={activePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={ChevronRight}
                disabled={activePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
