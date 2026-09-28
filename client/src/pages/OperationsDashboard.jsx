import {
    Activity, AlertCircle, ArrowDownToLine, ArrowRight, BadgeCheck, Check,
    CircleHelp, Clock3, Filter, LayoutDashboard, LockKeyhole, MapPin, Menu,
    RefreshCw, Search, ShieldCheck, TrainFront, Wrench, X,
} from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useAssets } from '../hooks/useAssets'
import { setAccessToken } from '../services/api'
import './operations.css'

const roles = [
  { id: 'Citizen', label: 'Citizen', icon: CircleHelp, description: 'Report an issue' },
  { id: 'Tech', label: 'Technician', icon: Wrench, description: 'Repair assets' },
  { id: 'Admin', label: 'Admin', icon: ShieldCheck, description: 'Operations overview' },
]

const statusLabels = {
  Active: 'Operational',
  Reported: 'Reported',
  'Under Maintenance': 'In maintenance',
  Retired: 'Retired',
}

function formatDate(value, includeTime = false) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  const options = includeTime
    ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }
  return new Intl.DateTimeFormat('en-IN', options).format(date)
}

function StatusBadge({ status }) {
  const Icon = status === 'Active' ? Check : status === 'Reported' ? AlertCircle : Clock3
  return (
    <span className={`status-badge status-${status?.toLowerCase().replaceAll(' ', '-')}`}>
      <Icon size={13} strokeWidth={2.4} />
      {statusLabels[status] || status || 'Unknown'}
    </span>
  )
}

function OperationsDashboard({ initialRole = 'Admin' }) {
  const [viewRole, setViewRole] = useState(initialRole)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [notes, setNotes] = useState('')
  const [tokenDraft, setTokenDraft] = useState('')
  const [tokenConnected, setTokenConnected] = useState(false)
  const [showIdentity, setShowIdentity] = useState(false)
  const [notice, setNotice] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const workspace = useAssets()
  const {
    assets, logs, selectedAsset, selectedAssetId, setSelectedAssetId,
    loading, refreshing, timelineLoading, error, timelineError,
    busyAssetId, refresh, transitionAsset,
  } = workspace

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 4400)
    return () => window.clearTimeout(timer)
  }, [notice])

  const counts = useMemo(() => assets.reduce((result, asset) => {
    result.total += 1
    result[asset.status] = (result[asset.status] || 0) + 1
    return result
  }, { total: 0 }), [assets])

  const filteredAssets = useMemo(() => assets.filter((asset) => {
    const searchable = [asset.name, asset.category, asset.station]
    const matchesSearch = !deferredSearch || searchable.some((value) => (
      value?.toLowerCase().includes(deferredSearch)
    ))
    return matchesSearch && (statusFilter === 'All statuses' || asset.status === statusFilter)
  }), [assets, deferredSearch, statusFilter])

  const selectedRole = roles.find((role) => role.id === viewRole) || roles[2]
  const RoleIcon = selectedRole.icon

  const connectToken = (event) => {
    event.preventDefault()
    setAccessToken(tokenDraft)
    setTokenConnected(Boolean(tokenDraft.trim()))
    setShowIdentity(false)
    setNotice({
      type: 'success',
      message: tokenDraft.trim() ? 'Access token held in memory for this session.' : 'Access token cleared.',
    })
  }

  const handleTransition = async (action) => {
    if (!selectedAsset) return
    try {
      await transitionAsset(action, selectedAsset._id, notes)
      setNotes('')
      setNotice({
        type: 'success',
        message: action === 'report'
          ? 'Issue reported and added to the audit timeline.'
          : 'Repair recorded and added to the audit timeline.',
      })
    } catch (requestError) {
      const message = requestError.message || 'Could not update the asset state.'
      setNotice({ type: 'error', message })
    }
  }

  const canReport = selectedAsset?.status === 'Active'
  const canRepair = ['Reported', 'Under Maintenance'].includes(selectedAsset?.status)

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="brand-lockup" href="#overview" aria-label="Metro asset operations home">
          <span className="brand-mark"><TrainFront size={21} strokeWidth={2.2} /></span>
          <span className="brand-copy"><strong>METRO / OPS</strong><small>AHMEDABAD NETWORK</small></span>
        </a>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          <a className="nav-link nav-link-active" href="#overview" onClick={() => setMobileNavOpen(false)}>
            <LayoutDashboard size={18} /><span>Asset overview</span><span className="nav-count">{assets.length}</span>
          </a>
          <a className="nav-link" href="#timeline" onClick={() => setMobileNavOpen(false)}><Activity size={18} /><span>Audit timeline</span></a>
          <a className="nav-link" href="#actions" onClick={() => setMobileNavOpen(false)}><Wrench size={18} /><span>Service actions</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="network-status">
            <span className={`connection-dot ${error ? 'connection-offline' : ''}`} />
            <div><strong>{error ? 'API unavailable' : 'Service connected'}</strong><small>{error ? 'Check API configuration' : 'Live asset records'}</small></div>
          </div>
          <div className="sidebar-footnote">CENTRAL INFRASTRUCTURE<br />LIFECYCLE TRACKER <span>v1.0</span></div>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" aria-label="Open navigation" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <div className="breadcrumb"><span>Operations</span><ArrowRight size={13} /><strong>Asset overview</strong></div>
          <div className="topbar-actions">
            <button className={`connection-button ${tokenConnected ? 'connection-button-ready' : ''}`} type="button" onClick={() => setShowIdentity((shown) => !shown)}>
              {tokenConnected ? <BadgeCheck size={16} /> : <LockKeyhole size={16} />}
              <span>{tokenConnected ? 'Token supplied' : 'Connect identity'}</span>
            </button>
            <button className="icon-button help-button" type="button" aria-label="Identity and access information" title="View mode is a preview; the API enforces your token role."><CircleHelp size={18} /></button>
          </div>
          {showIdentity && (
            <form className="identity-popover" onSubmit={connectToken}>
              <div className="popover-heading"><div><strong>API identity</strong><span>Bearer token stays in memory</span></div><button className="icon-button" type="button" aria-label="Close identity form" onClick={() => setShowIdentity(false)}><X size={16} /></button></div>
              <label htmlFor="access-token">Access token</label>
              <input id="access-token" type="password" autoComplete="off" value={tokenDraft} onChange={(event) => setTokenDraft(event.target.value)} placeholder="Paste your identity-provider token" />
              <button className="button button-primary identity-submit" type="submit">Apply token <ArrowRight size={15} /></button>
              <p>Role selection only changes this preview. The API verifies permissions from the token.</p>
            </form>
          )}
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" />NETWORK CONTROL / WEST ZONE</div><h1>Asset operations</h1><p className="page-subtitle">A live view of infrastructure health across the Ahmedabad Metro.</p></div>
            <div className="heading-meta"><span className="live-indicator"><i />LIVE DATA</span><span className="heading-date">{formatDate(new Date(), true)}</span></div>
          </section>

          <section className="role-strip" aria-label="Preview role">
            <div className="role-strip-copy"><span className="role-strip-icon"><RoleIcon size={17} /></span><div><strong>Workspace view</strong><small>Choose a workflow to preview</small></div></div>
            <div className="role-switch" role="group" aria-label="Choose workflow view">
              {roles.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" className={viewRole === id ? 'role-option role-option-active' : 'role-option'} aria-pressed={viewRole === id} onClick={() => setViewRole(id)}><Icon size={15} /><span>{label}</span></button>
              ))}
            </div>
            <span className="role-preview-note"><LockKeyhole size={13} /> Preview only; API checks your role</span>
          </section>

          <section className="metrics-grid" aria-label="Asset summary">
            <article className="metric-panel metric-primary"><div className="metric-top"><span>REGISTERED ASSETS</span><span className="metric-icon metric-icon-dark"><TrainFront size={18} /></span></div><div className="metric-value">{loading ? <span className="metric-skeleton" /> : counts.total.toLocaleString('en-IN')}</div><div className="metric-bottom"><span className="metric-rule" />Across all stations</div></article>
            <article className="metric-panel"><div className="metric-top"><span>OPERATIONAL</span><span className="metric-icon metric-icon-green"><Check size={17} /></span></div><div className="metric-value">{loading ? <span className="metric-skeleton" /> : (counts.Active || 0).toLocaleString('en-IN')}</div><div className="metric-bottom"><span className="metric-dot metric-dot-green" />{counts.total ? `${Math.round(((counts.Active || 0) / counts.total) * 100)}% of network` : 'Awaiting asset records'}</div></article>
            <article className="metric-panel"><div className="metric-top"><span>NEEDS ATTENTION</span><span className="metric-icon metric-icon-orange"><AlertCircle size={17} /></span></div><div className="metric-value">{loading ? <span className="metric-skeleton" /> : ((counts.Reported || 0) + (counts['Under Maintenance'] || 0)).toLocaleString('en-IN')}</div><div className="metric-bottom"><span className="metric-dot metric-dot-orange" />Reported + maintenance</div></article>
            <article className="metric-panel"><div className="metric-top"><span>RETIRED</span><span className="metric-icon metric-icon-muted"><ArrowDownToLine size={17} /></span></div><div className="metric-value">{loading ? <span className="metric-skeleton" /> : (counts.Retired || 0).toLocaleString('en-IN')}</div><div className="metric-bottom"><span className="metric-dot metric-dot-muted" />Out of active service</div></article>
          </section>

          {error && <div className="inline-alert" role="alert"><AlertCircle size={18} /><div><strong>Asset service could not be reached</strong><span>{error.message} Check <code>VITE_API_BASE_URL</code> and confirm the server is running.</span></div><button className="button button-outline" type="button" onClick={refresh}><RefreshCw size={14} /> Retry</button></div>}

          <div className="workspace-grid">
            <section className="asset-panel" aria-labelledby="assets-title">
              <div className="panel-heading"><div><div className="panel-kicker">NETWORK DIRECTORY</div><h2 id="assets-title">Infrastructure assets <span>{loading ? '...' : assets.length}</span></h2></div><button className={`icon-button refresh-button ${refreshing ? 'is-spinning' : ''}`} type="button" aria-label="Refresh asset list" title="Refresh asset list" onClick={refresh} disabled={refreshing}><RefreshCw size={17} /></button></div>
              <div className="table-toolbar">
                <label className="search-field"><Search size={16} /><span className="sr-only">Search assets</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, station, category" /></label>
                <label className="filter-field"><Filter size={15} /><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>Active</option><option>Reported</option><option>Under Maintenance</option><option>Retired</option></select></label>
              </div>
              <div className="asset-table-wrap">
                <table className="asset-table">
                  <thead><tr><th>ASSET</th><th>LOCATION</th><th>STATUS</th><th>UPDATED</th><th><span className="sr-only">Select asset</span></th></tr></thead>
                  <tbody>
                    {loading && Array.from({ length: 5 }, (_, index) => <tr className="skeleton-row" key={`skeleton-${index}`} aria-hidden="true"><td><span className="skeleton-line skeleton-name" /><span className="skeleton-line skeleton-meta" /></td><td><span className="skeleton-line skeleton-meta" /></td><td><span className="skeleton-pill" /></td><td><span className="skeleton-line skeleton-meta" /></td><td /></tr>)}
                    {!loading && filteredAssets.map((asset) => (
                      <tr key={asset._id} className={selectedAssetId === asset._id ? 'asset-row asset-row-selected' : 'asset-row'} onClick={() => setSelectedAssetId(asset._id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedAssetId(asset._id) }} tabIndex={0} aria-selected={selectedAssetId === asset._id}>
                        <td><div className="asset-name-cell"><span className="asset-type-icon"><TrainFront size={16} /></span><div><strong>{asset.name}</strong><small>{asset.category}</small></div></div></td>
                        <td><span className="location-cell"><MapPin size={14} />{asset.station}</span></td><td><StatusBadge status={asset.status} /></td><td className="date-cell">{formatDate(asset.updatedAt || asset.createdAt)}</td><td><ArrowRight className="row-arrow" size={15} /></td>
                      </tr>
                    ))}
                    {!loading && filteredAssets.length === 0 && <tr><td colSpan="5"><div className="empty-state"><span className="empty-state-icon"><TrainFront size={22} /></span><strong>{assets.length ? 'No matching assets' : 'No assets registered yet'}</strong><p>{assets.length ? 'Try adjusting your search or status filter.' : 'Assets will appear here once they are added to the operations database.'}</p>{assets.length > 0 && <button className="button button-outline" type="button" onClick={() => { setSearch(''); setStatusFilter('All statuses') }}>Clear filters</button>}</div></td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="table-footer"><span>Showing {loading ? '—' : filteredAssets.length} of {loading ? '—' : assets.length} assets</span><span className="table-footer-live"><i />Synced from operations API</span></div>
            </section>

            <aside className="detail-column">
              <section className="action-panel" id="actions" aria-labelledby="workflow-title">
                <div className="panel-kicker">{selectedRole.description.toUpperCase()}</div>
                <div className="action-title-row"><h2 id="workflow-title">{viewRole === 'Citizen' ? 'Report an issue' : viewRole === 'Tech' ? 'Complete a repair' : 'Asset details'}</h2><span className="action-title-icon"><RoleIcon size={17} /></span></div>
                <p className="action-description">{viewRole === 'Citizen' ? 'Flag an infrastructure issue for the maintenance team.' : viewRole === 'Tech' ? 'Record a completed repair in the asset history.' : 'Review the selected asset and its immutable history.'}</p>
                <div className="selected-asset-box"><span className="selected-asset-icon"><TrainFront size={18} /></span><div className="selected-asset-copy"><small>SELECTED ASSET</small><strong>{selectedAsset?.name || (loading ? 'Loading assets…' : 'Select an asset')}</strong><span>{selectedAsset ? `${selectedAsset.station} · ${selectedAsset.category}` : 'Choose a row from the directory'}</span></div>{selectedAsset && <StatusBadge status={selectedAsset.status} />}</div>

                {viewRole !== 'Admin' && <form className="action-form" onSubmit={(event) => { event.preventDefault(); handleTransition(viewRole === 'Citizen' ? 'report' : 'fix') }}>
                  <label htmlFor="action-notes">{viewRole === 'Citizen' ? 'Issue details' : 'Repair notes'} <span>OPTIONAL</span></label>
                  <textarea id="action-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} placeholder={viewRole === 'Citizen' ? 'Describe what needs attention…' : 'Add work completed or parts replaced…'} />
                  <div className="form-footnote"><span>{notes.length}/2000</span><span>{viewRole === 'Citizen' ? 'Creates a reported status' : 'Returns asset to operational'}</span></div>
                  {viewRole === 'Citizen' && selectedAsset && !canReport && <div className="action-hint"><AlertCircle size={14} />Only operational assets can be reported.</div>}
                  {viewRole === 'Tech' && selectedAsset && !canRepair && <div className="action-hint"><AlertCircle size={14} />Only reported or maintained assets can be repaired.</div>}
                  <button className={`button ${viewRole === 'Citizen' ? 'button-coral' : 'button-primary'} action-submit`} type="submit" disabled={!selectedAsset || busyAssetId === selectedAsset?._id || (viewRole === 'Citizen' && !canReport) || (viewRole === 'Tech' && !canRepair)}>
                    {busyAssetId === selectedAsset?._id ? <><span className="button-spinner" />Saving to audit trail</> : <>{viewRole === 'Citizen' ? <AlertCircle size={16} /> : <Check size={16} />}{viewRole === 'Citizen' ? 'Submit issue report' : 'Record repair'}<ArrowRight size={15} /></>}
                  </button>
                  <p className="audit-promise"><LockKeyhole size={13} />Every status change is recorded in the audit trail.</p>
                </form>}

                {viewRole === 'Admin' && <div className="admin-summary"><div className="summary-row"><span>Current status</span>{selectedAsset ? <StatusBadge status={selectedAsset.status} /> : <span>—</span>}</div><div className="summary-row"><span>Last updated</span><strong>{selectedAsset ? formatDate(selectedAsset.updatedAt || selectedAsset.createdAt, true) : '—'}</strong></div><div className="summary-row"><span>History entries</span><strong>{timelineLoading ? '…' : logs.length}</strong></div><a className="text-link" href="#timeline">View audit timeline <ArrowRight size={14} /></a></div>}
              </section>

              <section className="timeline-panel" id="timeline" aria-labelledby="timeline-title">
                <div className="timeline-heading"><div><div className="panel-kicker">IMMUTABLE RECORD</div><h2 id="timeline-title">Audit timeline</h2></div><span className="timeline-count">{logs.length.toString().padStart(2, '0')}</span></div>
                {timelineLoading ? <div className="timeline-skeletons" aria-label="Loading audit timeline"><span /><span /><span /></div> : timelineError ? <div className="timeline-empty"><AlertCircle size={17} /><p>{timelineError.message}</p></div> : logs.length ? <ol className="timeline-list">{[...logs].reverse().slice(0, 5).map((log) => <li className="timeline-item" key={log._id || `${log.timestamp}-${log.new_status}`}><span className={`timeline-marker marker-${log.new_status?.toLowerCase().replaceAll(' ', '-')}`}><Activity size={13} /></span><div className="timeline-content"><div className="timeline-event"><strong>{statusLabels[log.new_status] || log.new_status}</strong><time>{formatDate(log.timestamp, true)}</time></div><p>{log.previous_status} <ArrowRight size={12} /> {log.new_status}</p><span className="timeline-actor">{log.changed_by_role || 'Unknown actor'}{log.notes ? ` · ${log.notes}` : ''}</span></div></li>)}</ol> : <div className="timeline-empty"><Clock3 size={18} /><p>{selectedAsset ? 'No history has been recorded for this asset.' : 'Select an asset to inspect its history.'}</p></div>}
                {timelineError && <button className="text-link timeline-retry" type="button" onClick={refresh}>Retry timeline <RefreshCw size={13} /></button>}
                {logs.length > 5 && <button className="timeline-more" type="button" onClick={() => setNotice({ type: 'info', message: 'The full timeline is available in the asset detail endpoint.' })}>Showing latest 5 entries <ArrowRight size={13} /></button>}
              </section>
            </aside>
          </div>
          <footer className="page-footer"><span>AHMEDABAD METRO RAIL CORPORATION</span><span>Infrastructure lifecycle / operations console</span><span>LAST SYNC <strong>{refreshing ? 'SYNCING…' : formatDate(new Date(), true)}</strong></span></footer>
        </div>
      </main>
      {notice && <div className={`toast toast-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'} aria-live="polite"><span className="toast-icon">{notice.type === 'error' ? <AlertCircle size={17} /> : <Check size={17} />}</span><span>{notice.message}</span><button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={15} /></button></div>}
    </div>
  )
}

export default OperationsDashboard