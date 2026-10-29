import { Skeleton } from '../../components/Skeleton'

/**
 * Mirrors the loaded layout block for block (same cards, same heights) so
 * nothing jumps when data arrives (D1).
 */
export function DashboardSkeleton() {
  return (
    <div className="dashboard" aria-busy="true" aria-label="Loading your dashboard">
      <div className="dashboard__main">
        <div className="greeting">
          <Skeleton width="14rem" height="2rem" />
        </div>
        <div className="hero card hero--skeleton">
          <div>
            <Skeleton width="8rem" height="1rem" />
            <Skeleton width="14rem" height="2.75rem" className="skeleton--gap" />
            <Skeleton width="11rem" height="1rem" />
          </div>
        </div>
        <section className="section">
          <Skeleton width="6rem" height="1.25rem" />
          <ul className="account-list">
            {[0, 1, 2].map((i) => (
              <li key={i} className="account-card card">
                <Skeleton width="60%" height="1rem" />
                <Skeleton width="40%" height="1rem" className="skeleton--gap" />
                <Skeleton width="70%" height="1.5rem" />
                <Skeleton width="30%" height="0.9rem" className="skeleton--gap" />
              </li>
            ))}
          </ul>
        </section>
        <section className="section card transactions">
          <Skeleton width="11rem" height="1.25rem" />
          <ul className="txn-list">
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="txn">
                <div className="txn__main">
                  <Skeleton width="10rem" height="1rem" />
                  <Skeleton width="7rem" height="0.85rem" className="skeleton--gap" />
                </div>
                <Skeleton width="5rem" height="1rem" />
              </li>
            ))}
          </ul>
        </section>
      </div>
      <aside className="dashboard__rail">
        <div className="card limit">
          <Skeleton width="6rem" height="1.25rem" />
          <Skeleton width="12rem" height="1.25rem" className="skeleton--gap" />
          <Skeleton height="8px" radius="999px" />
          <Skeleton width="80%" height="0.85rem" className="skeleton--gap" />
        </div>
      </aside>
    </div>
  )
}
