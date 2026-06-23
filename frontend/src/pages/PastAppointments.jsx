import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  Calendar, Search, X, LogOut, LayoutDashboard, Building2, Users, 
  Settings, Activity, Eye, TrendingUp, Scissors, User, Sparkles, Wallet
} from 'lucide-react';
import './AdminDashboard.css'; // Inherit main dashboard styling
import './PastAppointments.css'; // Table & list styling

const PastAppointments = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [viewingShiftModal, setViewingShiftModal] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Filter for past appointments
        const now = new Date();
        const past = data.filter(app => app.end_datetime && new Date(app.end_datetime) < now);
        setAppointments(past.sort((a, b) => new Date(b.end_datetime) - new Date(a.end_datetime)));
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (role !== 'admin' && role !== 'super_admin') {
      navigate('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAppointments();
  }, [role, navigate, fetchAppointments]);

  const filteredAppointments = appointments.filter(app => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = (app.customer_name || '').toLowerCase().includes(term) ||
                    (app.stylist_name || '').toLowerCase().includes(term) ||
                    (app.service_name || '').toLowerCase().includes(term);
      if (!match) return false;
    }

    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }

    if (dateFilter) {
      const match = app.start_datetime && app.start_datetime.split('T')[0] === dateFilter;
      if (!match) return false;
    }

    return true;
  });

  const getStatusLabel = (status) => {
    const labels = {
      confirmed: 'Onaylandı',
      pending: 'Bekliyor',
      cancelled: 'İptal',
      completed: 'Tamamlandı'
    };
    return labels[status] || status;
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('company_id');
    navigate('/login');
  };

  const renderViewingShiftModal = () => {
    if (!viewingShiftModal) return null;
    const s = viewingShiftModal;
    
    return (
      <div className="modal-backdrop">
        <div className="modal-content text-left" style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <h2>Randevu Detayları</h2>
            <button onClick={() => setViewingShiftModal(null)} className="close-modal-btn">
              <X size={14} />
            </button>
          </div>
          <div className="modal-body" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Müşteri</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{s.customer_name || 'Belirtilmedi'}</p>
                  {s.customer_phone && <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{s.customer_phone}</p>}
                </div>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Stilist</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{s.stylist_name || 'Belirtilmedi'}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Hizmet</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{s.service_name || 'Belirtilmedi'}</p>
                </div>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Ücret</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600', color: '#10b981' }}>{s.price ? `${s.price} ₺` : 'Belirtilmedi'}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Tarih</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{new Date(s.start_datetime).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Saat</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>
                    {new Date(s.start_datetime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - {new Date(s.end_datetime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Ödeme Durumu</strong>
                  <p style={{ margin: '0.2rem 0 0 0' }}>
                    <span className={`status-badge ${
                      s.payment_status === 'Ödendi' ? 'status-completed' :
                      s.payment_status === 'Kısmi Ödeme' ? 'status-pending' : 'status-cancelled'
                    }`} style={{ fontSize: '0.7rem' }}>
                      {s.payment_status || 'Ödeme Bekleniyor'}
                    </span>
                  </p>
                </div>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Ödeme Türü</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{s.payment_type || 'Belirtilmedi'}</p>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <strong style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Randevu Durumu</strong>
                <p style={{ margin: '0.2rem 0 0 0' }}>
                  <span className={`status-badge status-${s.status}`} style={{ fontSize: '0.7rem' }}>
                    {getStatusLabel(s.status)}
                  </span>
                </p>
              </div>

              {s.notes && (
                <div>
                  <strong style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Notlar</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#475569', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', borderLeft: '3px solid #6366f1' }}>{s.notes}</p>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '0' }}>
            <button onClick={() => setViewingShiftModal(null)} className="modal-btn cancel" style={{ width: '100%' }}>Kapat</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="super-admin-dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" className="brand-logo-img" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} alt="GlowCut" />
          <div className="brand-meta">
            <span className="logo-text">Glow<span className="accent">Cut</span></span>
            <span className="sidebar-role">Salon Yetkilisi</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button onClick={() => navigate('/admin?tab=overview')} className="sidebar-item">
            <LayoutDashboard size={18} className="sidebar-icon" /> Genel Bakış
          </button>
          <button onClick={() => navigate('/admin?tab=departments')} className="sidebar-item">
            <Building2 size={18} className="sidebar-icon" /> Hizmet Kategorileri
          </button>
          <button onClick={() => navigate('/admin?tab=employees')} className="sidebar-item">
            <Scissors size={18} className="sidebar-icon" /> Stilist Yönetimi
          </button>
          <button onClick={() => navigate('/admin?tab=customers')} className="sidebar-item">
            <Users size={18} className="sidebar-icon" /> Müşteri CRM
          </button>
          <button onClick={() => navigate('/admin?tab=shifts')} className="sidebar-item">
            <Calendar size={18} className="sidebar-icon" /> Randevu Planlama
          </button>
          <button onClick={() => navigate('/admin?tab=templates')} className="sidebar-item">
            <Settings size={18} className="sidebar-icon" /> Hazır Şablonlar
          </button>
          <button onClick={() => navigate('/admin?tab=logs')} className="sidebar-item">
            <Activity size={18} className="sidebar-icon" /> İşlem Logları
          </button>
          <hr className="sidebar-divider" style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          <button onClick={() => navigate('/past-appointments')} className="sidebar-item active">
            <Calendar size={18} className="sidebar-icon" /> Geçmiş Randevular
          </button>
          <button onClick={() => navigate('/earnings')} className="sidebar-item">
            <TrendingUp size={18} className="sidebar-icon" /> Kazanç Paneli
          </button>
          <button onClick={() => navigate('/expenses')} className="sidebar-item">
            <Wallet size={18} className="sidebar-icon" /> Giderler Paneli
          </button>
          <button onClick={() => navigate('/admin?tab=settings')} className="sidebar-item">
            <Settings size={18} className="sidebar-icon" /> Ayarlar
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-sidebar-btn">
            <LogOut size={18} className="sidebar-icon" /> Güvenli Çıkış
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <div className="header-title">
            <h1>Geçmiş Randevular</h1>
            <p>Tamamlanan veya iptal edilen geçmiş randevuları filtreleyin ve inceleyin.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="user-profile-badge">
              <div className="user-avatar"><User size={20} /></div>
              <div className="user-details">
                <span className="user-email">{localStorage.getItem('email') || 'yonetici@glowcut.com'}</span>
                <span className="user-role-label">Salon Yöneticisi</span>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="content-container">
          <section className="past-appointments-filters-card">
            <div className="search-bar">
              <span className="search-icon"><Search size={20} /></span>
              <input
                type="text"
                placeholder="Müşteri, Stilist veya Hizmet Adı ile ara..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="clear-btn">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label>Randevu Durumu</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="filter-select"
                >
                  <option value="all">Tümü</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="cancelled">İptal</option>
                  <option value="pending">Bekleniyor</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Tarih Seçimi</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                  className="filter-input"
                />
              </div>
            </div>
          </section>

          {/* Content */}
          {loading ? (
            <div className="loading-state">Yükleniyor...</div>
          ) : filteredAppointments.length > 0 ? (() => {
            const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;
            const indexOfLastItem = currentPage * itemsPerPage;
            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
            const currentAppointments = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
            return (
              <div className="past-appointments-list-container">
                <div className="appointments-count">
                  Toplam <strong>{filteredAppointments.length}</strong> randevu bulundu
                </div>

                <div className="appointments-table-container">
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th>Tarih & Saat</th>
                        <th>Müşteri</th>
                        <th>Stilist</th>
                        <th>Hizmet</th>
                        <th>Fiyat</th>
                        <th>Ödeme Durumu</th>
                        <th>Ödeme Türü</th>
                        <th>Randevu Durumu</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAppointments.map((app) => (
                        <tr key={app.id}>
                          <td style={{ fontWeight: '500' }}>{formatDateTime(app.start_datetime)}</td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{app.customer_name || 'Belirtilmedi'}</div>
                            {app.customer_phone && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.customer_phone}</div>}
                          </td>
                          <td className="stylist-cell-badge">
                            {app.stylist_name || 'Belirtilmedi'}
                          </td>
                          <td style={{ fontWeight: '500' }}>{app.service_name || 'Belirtilmedi'}</td>
                          <td className="price-text">{app.price ? `${app.price} ₺` : '-'}</td>
                          <td>
                            <span className={`status-badge ${
                              app.payment_status === 'Ödendi' ? 'status-completed' :
                              app.payment_status === 'Kısmi Ödeme' ? 'status-pending' : 'status-cancelled'
                            }`} style={{ fontSize: '0.7rem' }}>
                              {app.payment_status || 'Ödeme Bekleniyor'}
                            </span>
                          </td>
                          <td style={{ fontWeight: '500' }}>{app.payment_type || '-'}</td>
                          <td>
                            <span className={`status-badge status-${app.status}`}>
                              {getStatusLabel(app.status)}
                            </span>
                          </td>
                          <td className="action-cell">
                            <button 
                              onClick={() => setViewingShiftModal(app)} 
                              className="action-btn-view"
                              title="Görüntüle"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination-wrapper">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn prev"
                    >
                      Önceki
                    </button>
                    <div className="pagination-pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`pagination-btn page-num ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="pagination-btn next"
                    >
                      Sonraki
                    </button>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="empty-state">
              <Calendar size={48} />
              <h2>Randevu Bulunamadı</h2>
              <p>
                {searchTerm || statusFilter !== 'all' || dateFilter
                  ? 'Arama kriterlerine uygun geçmiş randevu bulunmamaktadır.'
                  : 'Henüz tamamlanan veya iptal edilen randevu bulunmamaktadır.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Viewing Modal */}
      {viewingShiftModal && renderViewingShiftModal()}
    </div>
  );
};

export default PastAppointments;
