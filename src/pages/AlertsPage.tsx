import { AppLayout } from '../components/layout/AppLayout'

export function AlertsPage() {
  return (
    <AppLayout>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '28px 20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111', margin: '0 0 24px' }}>Alerts</h1>
        <div style={{
          background: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0',
          padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: '#F0F0EE', border: '1px solid #E0E0E0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: '#333', marginBottom: '6px' }}>No alerts yet</p>
          <p style={{ fontSize: '13px', color: '#999', lineHeight: 1.6, maxWidth: '220px', margin: '0 auto' }}>
            Ride alerts and updates will appear here.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
