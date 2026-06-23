import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  TrendingUp, Users, LogOut, LayoutDashboard, Building2, 
  Calendar, Settings, Activity, Shield, DollarSign, Wallet, CheckCircle, Clock, User, Scissors, Search, X, AlertCircle
} from 'lucide-react';
import './AdminDashboard.css'; // Inherit main dashboard styling
import './EarningsDashboard.css'; // Custom earnings & charts styling

const EarningsDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all' | 'month' | 'week' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [detailStartDate, setDetailStartDate] = useState('');
  const [detailEndDate, setDetailEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Password verification states (disabled by default based on user request)
  const [isVerified, setIsVerified] = useState(true);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/appointments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/admin/stylists`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (appRes.status === 401 || appRes.status === 403 || empRes.status === 401 || empRes.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
        return;
      }

      if (appRes.ok && empRes.ok) {
        const apps = await appRes.json();
        const data = await empRes.json();
        
        // Map backend properties to match frontend usage
        const mappedEmps = data.map(e => ({
          ...e,
          phone_number: e.phone,
          department_name: e.service ? e.service.name : 'Hizmet Yok',
          department_id: e.service ? e.service.id : ''
        }));

        setAppointments(apps);
        setEmployees(mappedEmps);
        setMessage('');
      } else {
        setMessage('Veriler yüklenemedi.');
        setMessageType('error');
      }
    } catch {
      setMessage('Bağlantı hatası oluştu.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (role !== 'admin' && role !== 'super_admin') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [role, navigate, fetchDashboardData]);

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setIsVerified(true);
        fetchDashboardData();
      } else {
        const errData = await response.json();
        setVerifyError(errData.error || 'Şifre doğrulanamadı.');
      }
    } catch {
      setVerifyError('Sunucu bağlantı hatası.');
    } finally {
      setVerifying(false);
    }
  };

  // Filter appointments by selected period
  const getFilteredAppointments = () => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (selectedPeriod === 'week') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = now;
    } else if (selectedPeriod === 'month') {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = now;
    } else if (selectedPeriod === 'custom') {
      if (customStartDate) {
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
      }
      if (customEndDate) {
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    return appointments.filter(app => {
      if (!app.start_datetime) return false;
      const appDate = new Date(app.start_datetime);
      if (startDate && appDate < startDate) return false;
      if (endDate && appDate > endDate) return false;
      return true;
    });
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

  const getSearchedDetails = () => {
    let apps = getFilteredAppointments();
    
    if (detailStartDate) {
      const start = new Date(detailStartDate);
      start.setHours(0, 0, 0, 0);
      apps = apps.filter(app => new Date(app.start_datetime) >= start);
    }
    if (detailEndDate) {
      const end = new Date(detailEndDate);
      end.setHours(23, 59, 59, 999);
      apps = apps.filter(app => new Date(app.start_datetime) <= end);
    }

    const sorted = [...apps].sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime));
    if (!detailSearch) return sorted;
    const q = detailSearch.toLowerCase();
    return sorted.filter(app => 
      (app.customer_name || '').toLowerCase().includes(q) ||
      (app.stylist_name || '').toLowerCase().includes(q) ||
      (app.service_name || '').toLowerCase().includes(q) ||
      (app.payment_type || '').toLowerCase().includes(q)
    );
  };

  // Compute ciro, paid, pending, partial, and breakdowns
  const getCalculatedMetrics = () => {
    const filteredApps = getFilteredAppointments();
    
    let totalCiro = 0;
    let odendi = 0;
    let bekleyen = 0;
    let kismi = 0;

    // Stylist calculations map: stylist_id -> metrics
    const stylistMetrics = {};
    employees.forEach(emp => {
      stylistMetrics[emp.id] = {
        stylist_id: emp.id,
        stylist_name: `${emp.first_name} ${emp.last_name}`,
        service: emp.department_name || 'Hizmet Yok',
        appointment_count: 0,
        total_ciro: 0,
        odendi: 0,
        bekleyen: 0,
        kismi: 0
      };
    });

    // Payment Type Map
    const paymentTypeTotals = {
      'Nakit': 0,
      'Havale/EFT': 0,
      'IBAN': 0,
      'Kredi Kartı': 0,
      'Diğer': 0,
      'Belirtilmedi': 0
    };

    filteredApps.forEach(app => {
      // Only count confirmed and completed appointments for earnings
      if (app.status !== 'confirmed' && app.status !== 'completed') return;

      const price = parseFloat(app.price) || 0;
      const paid = parseFloat(app.paid_amount) || 0;
      totalCiro += price;

      if (app.payment_status === 'Ödendi') {
        odendi += price;
      } else if (app.payment_status === 'Kısmi Ödeme') {
        odendi += paid;
        bekleyen += (price - paid);
        kismi += paid;
      } else {
        bekleyen += price;
      }

      // Stylist breakdown
      const sId = app.stylist_id;
      if (stylistMetrics[sId]) {
        stylistMetrics[sId].appointment_count += 1;
        stylistMetrics[sId].total_ciro += price;
        if (app.payment_status === 'Ödendi') {
          stylistMetrics[sId].odendi += price;
        } else if (app.payment_status === 'Kısmi Ödeme') {
          stylistMetrics[sId].odendi += paid;
          stylistMetrics[sId].bekleyen += (price - paid);
          stylistMetrics[sId].kismi += paid;
        } else {
          stylistMetrics[sId].bekleyen += price;
        }
      }

      // Payment Type breakdown (count actual paid amount for completed/partial payments)
      const type = app.payment_type || 'Belirtilmedi';
      const paymentContribution = app.payment_status === 'Ödendi' ? price : (app.payment_status === 'Kısmi Ödeme' ? paid : price);
      if (paymentTypeTotals[type] !== undefined) {
        paymentTypeTotals[type] += paymentContribution;
      } else {
        paymentTypeTotals[type] = paymentContribution;
      }
    });

    return {
      totalCiro,
      odendi,
      bekleyen,
      kismi,
      stylists: Object.values(stylistMetrics),
      paymentTypes: paymentTypeTotals
    };
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('company_id');
    navigate('/login');
  };

  const metrics = isVerified ? getCalculatedMetrics() : null;

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
          <button onClick={() => navigate('/past-appointments')} className="sidebar-item">
            <Calendar size={18} className="sidebar-icon" /> Geçmiş Randevular
          </button>
          <button onClick={() => navigate('/earnings')} className="sidebar-item active">
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
            <h1>Kazanç Paneli</h1>
            <p>Salonunuzun ciro, tahsilat ve stilist bazlı gelir analizlerini takip edin.</p>
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

        {/* Content Container */}
        <div className="content-container">
          {message && (
            <div className={`dashboard-alert ${messageType}`}>
              {message}
            </div>
          )}

          {!isVerified ? (
            /* Secure password screen */
            <div className="password-overlay-container">
              <div className="password-card">
                <div className="password-card-header">
                  <Shield size={36} className="shield-icon" />
                  <h2>Hassas Veri Erişimi</h2>
                  <p>Finansal raporları görüntülemek için lütfen yönetici hesabınızın şifresini doğrulayın.</p>
                </div>
                <form onSubmit={handleVerifyPassword} className="password-form">
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>Yönetici Şifresi</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      required
                      autoFocus
                      className="password-input"
                    />
                  </div>
                  {verifyError && <div className="password-error">{verifyError}</div>}
                  <button type="submit" className="password-submit-btn" disabled={verifying}>
                    {verifying ? 'Doğrulanıyor...' : 'Erişimi Doğrula'}
                  </button>
                </form>
              </div>
            </div>
          ) : loading ? (
            <div className="loading-state">Yükleniyor...</div>
          ) : metrics ? (
            <>
              {/* Period & Custom Date Selector */}
              <div className="earnings-filter-row" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="earnings-period-selector" style={{ marginBottom: 0 }}>
                  <button
                    className={`period-btn ${selectedPeriod === 'all' ? 'active' : ''}`}
                    onClick={() => { setSelectedPeriod('all'); setCurrentPage(1); }}
                  >
                    Tüm Zamanlar
                  </button>
                  <button
                    className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                    onClick={() => { setSelectedPeriod('month'); setCurrentPage(1); }}
                  >
                    Son 30 Gün
                  </button>
                  <button
                    className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
                    onClick={() => { setSelectedPeriod('week'); setCurrentPage(1); }}
                  >
                    Son 7 Gün
                  </button>
                  <button
                    className={`period-btn ${selectedPeriod === 'custom' ? 'active' : ''}`}
                    onClick={() => { setSelectedPeriod('custom'); setCurrentPage(1); }}
                  >
                    Özel Tarih
                  </button>
                </div>

                {selectedPeriod === 'custom' && (
                  <div className="custom-date-inputs">
                    <div className="date-input-group">
                      <label>Başlangıç:</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className={`date-picker-field ${customStartDate && customEndDate && customStartDate > customEndDate ? 'error' : ''}`}
                      />
                    </div>
                    <div className="date-input-group">
                      <label>Bitiş:</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className={`date-picker-field ${customStartDate && customEndDate && customStartDate > customEndDate ? 'error' : ''}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedPeriod === 'custom' && customStartDate && customEndDate && customStartDate > customEndDate && (
                <div style={{ color: 'var(--error)', fontSize: '0.825rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem', background: '#fef2f2', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                  <AlertCircle size={16} /> Başlangıç tarihi bitiş tarihinden sonra olamaz! Lütfen tarih filtrelerini düzenleyin.
                </div>
              )}

              {/* Summary Cards */}
              <div className="earnings-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {/* Toplam Ciro */}
                <div className="earnings-metric-card">
                  <div className="metric-card-header">
                    <span className="metric-icon-wrapper blue"><DollarSign size={20} /></span>
                    <span className="metric-title">Toplam Ciro</span>
                  </div>
                  <div className="metric-value">{metrics.totalCiro.toFixed(2)} ₺</div>
                  <div className="metric-desc">Filtrelenen dönemdeki brüt gelir</div>
                </div>

                {/* Tahsil Edilen */}
                <div className="earnings-metric-card">
                  <div className="metric-card-header">
                    <span className="metric-icon-wrapper green"><CheckCircle size={20} /></span>
                    <span className="metric-title">Tahsil Edilen (Ödendi)</span>
                  </div>
                  <div className="metric-value text-green">{metrics.odendi.toFixed(2)} ₺</div>
                  <div className="metric-desc">Tahsilatı tamamlanmış tutar</div>
                </div>

                {/* Bekleyen */}
                <div className="earnings-metric-card">
                  <div className="metric-card-header">
                    <span className="metric-icon-wrapper red"><Clock size={20} /></span>
                    <span className="metric-title">Bekleyen Ödeme</span>
                  </div>
                  <div className="metric-value text-red">{metrics.bekleyen.toFixed(2)} ₺</div>
                  <div className="metric-desc">Ödemesi henüz yapılmamış tutar</div>
                </div>

                {/* Kısmi Ödeme */}
                <div className="earnings-metric-card">
                  <div className="metric-card-header">
                    <span className="metric-icon-wrapper orange"><Wallet size={20} /></span>
                    <span className="metric-title">Kısmi Ödeme</span>
                  </div>
                  <div className="metric-value text-orange">{metrics.kismi.toFixed(2)} ₺</div>
                  <div className="metric-desc">Bir kısmı tahsil edilmiş tutar</div>
                </div>
              </div>

              {/* Stilist Analiz Tablosu */}
              <section className="section-content" style={{ marginBottom: '2rem', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem', color: '#0f172a' }}>Stilist Bazlı Kazançlar</h2>
                <div className="appointments-table-container" style={{ marginTop: '0' }}>
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th>Stilist Adı</th>
                        <th>Uzmanlık Alanı</th>
                        <th>Hizmet Sayısı</th>
                        <th>Tahsil Edilen (Ödendi)</th>
                        <th>Bekleyen Ödeme</th>
                        <th>Kısmi Ödeme</th>
                        <th>Toplam Ciro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.stylists.map((stylist) => (
                        <tr key={stylist.stylist_id}>
                          <td style={{ fontWeight: '600' }}>{stylist.stylist_name}</td>
                          <td>{stylist.service}</td>
                          <td style={{ fontWeight: '500' }}>{stylist.appointment_count}</td>
                          <td className="text-green" style={{ fontWeight: '600' }}>{stylist.odendi.toFixed(2)} ₺</td>
                          <td className="text-red" style={{ fontWeight: '600' }}>{stylist.bekleyen.toFixed(2)} ₺</td>
                          <td className="text-orange" style={{ fontWeight: '600' }}>{stylist.kismi.toFixed(2)} ₺</td>
                          <td className="price-text">{stylist.total_ciro.toFixed(2)} ₺</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Görsel Grafikler */}
              {(() => {
                // Calculate donut chart segments dynamically inside an IIFE
                let accumulatedPercent = 0;
                const donutSegments = Object.entries(metrics.paymentTypes)
                  .filter(([_, amount]) => amount > 0)
                  .map(([type, amount], idx) => {
                    const percent = amount / (metrics.totalCiro || 1);
                    const strokeLength = percent * 251.32;
                    const strokeOffset = 251.32 - (accumulatedPercent * 251.32);
                    accumulatedPercent += percent;
                    const colors = ['#7c3aed', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899'];
                    return {
                      type,
                      amount,
                      percent: percent * 100,
                      strokeLength,
                      strokeOffset,
                      color: colors[idx % colors.length]
                    };
                  });

                const searchedDetails = getSearchedDetails();
                const totalPages = Math.ceil(searchedDetails.length / itemsPerPage) || 1;
                const indexOfLastItem = currentPage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentDetails = searchedDetails.slice(indexOfFirstItem, indexOfLastItem);

                return (
                  <>
                    <div className="chart-container-grid">
                      {/* 1. Stilist Ciro Dağılımı */}
                      <div className="chart-card">
                        <h3>Stilist Gelir Dağılımı</h3>
                        <div className="chart-bar-list" style={{ gap: '0.75rem' }}>
                          {metrics.stylists.length > 0 ? (
                            metrics.stylists
                              .sort((a, b) => b.total_ciro - a.total_ciro)
                              .map((sty, idx) => {
                                const maxCiro = Math.max(...metrics.stylists.map(s => s.total_ciro), 1);
                                const percentage = (sty.total_ciro / maxCiro) * 100;
                                const overallPercentage = (sty.total_ciro / (metrics.totalCiro || 1)) * 100;
                                
                                const initials = sty.stylist_name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .substring(0, 2)
                                  .toUpperCase();
                                  
                                const barColors = [
                                  'linear-gradient(90deg, #818cf8 0%, #6366f1 100%)',
                                  'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
                                  'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                                  'linear-gradient(90deg, #f87171 0%, #ef4444 100%)',
                                  'linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)',
                                ];
                                const selectedBarColor = barColors[idx % barColors.length];

                                return (
                                  <div key={sty.stylist_id} className="premium-chart-row">
                                    <div 
                                      className="stylist-chart-avatar" 
                                      style={{ background: `linear-gradient(135deg, ${idx % 2 === 0 ? '#8b5cf6, #6366f1' : '#10b981, #3b82f6'})` }}
                                    >
                                      {initials}
                                    </div>
                                    <div className="chart-row-details">
                                      <div className="chart-bar-info">
                                        <div className="chart-stylist-meta">
                                          <span className="chart-stylist-name">{sty.stylist_name}</span>
                                          <span className="chart-stylist-sub">{sty.service} • {sty.appointment_count} randevu</span>
                                        </div>
                                        <div className="chart-stylist-value">
                                          <strong>{sty.total_ciro.toFixed(2)} ₺</strong>
                                          <span className="percent-badge">%{overallPercentage.toFixed(1)}</span>
                                        </div>
                                      </div>
                                      <div className="chart-bar-track-premium">
                                        <div 
                                          className="chart-bar-fill-premium" 
                                          style={{ 
                                            width: `${percentage}%`, 
                                            background: selectedBarColor 
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                          ) : (
                            <div className="no-data-state">Veri bulunmuyor.</div>
                          )}
                        </div>
                      </div>

                      {/* 2. Ödeme Türü Dağılımı */}
                      <div className="chart-card">
                        <h3>Ödeme Yöntemi Dağılımı</h3>
                        <div className="donut-chart-layout">
                          {metrics.totalCiro > 0 ? (
                            <>
                              <div className="donut-chart-container">
                                <svg width="170" height="170" viewBox="0 0 100 100" className="donut-chart-svg">
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="#f8fafc"
                                    strokeWidth="10"
                                  />
                                  {donutSegments.map((seg) => (
                                    <circle
                                      key={seg.type}
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      fill="transparent"
                                      stroke={seg.color}
                                      strokeWidth="10"
                                      strokeDasharray={`${seg.strokeLength} ${251.32 - seg.strokeLength}`}
                                      strokeDashoffset={seg.strokeOffset}
                                      transform="rotate(-90 50 50)"
                                      className="donut-segment"
                                    />
                                  ))}
                                  <g className="donut-center-text">
                                    <text x="50" y="47" textAnchor="middle" className="donut-center-val" style={{ fontSize: '12px', fontWeight: '800', fill: '#0f172a' }}>
                                      {metrics.totalCiro.toFixed(0)} ₺
                                    </text>
                                    <text x="50" y="62" textAnchor="middle" className="donut-center-lbl" style={{ fontSize: '6px', fontWeight: '600', fill: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                      Toplam Ciro
                                    </text>
                                  </g>
                                </svg>
                              </div>
                              <div className="donut-legend-list">
                                {donutSegments.map((seg) => (
                                  <div key={seg.type} className="donut-legend-item">
                                    <span className="legend-indicator" style={{ backgroundColor: seg.color }} />
                                    <div className="legend-details">
                                      <span className="legend-label">{seg.type}</span>
                                      <span className="legend-amount">{seg.amount.toFixed(2)} ₺</span>
                                    </div>
                                    <span className="legend-percentage">%{seg.percent.toFixed(1)}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="no-data-state" style={{ width: '100%' }}>Ödeme verisi bulunmuyor.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detaylı İşlem Geçmişi Tablosu */}
                    <section className="section-content" style={{ marginTop: '2.5rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>İşlem Bazlı Ödeme Detayları</h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                          {/* Detaylı Tarih Filtresi */}
                          <div className="custom-date-inputs detail-filters" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                            <div className="date-input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Başlangıç:</label>
                              <input
                                type="date"
                                value={detailStartDate}
                                onChange={(e) => { setDetailStartDate(e.target.value); setCurrentPage(1); }}
                                className={`date-picker-field ${detailStartDate && detailEndDate && detailStartDate > detailEndDate ? 'error' : ''}`}
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                              />
                            </div>
                            <div className="date-input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Bitiş:</label>
                              <input
                                type="date"
                                value={detailEndDate}
                                onChange={(e) => { setDetailEndDate(e.target.value); setCurrentPage(1); }}
                                className={`date-picker-field ${detailStartDate && detailEndDate && detailStartDate > detailEndDate ? 'error' : ''}`}
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                              />
                            </div>
                            {(detailStartDate || detailEndDate) && (
                              <button 
                                onClick={() => { setDetailStartDate(''); setDetailEndDate(''); setCurrentPage(1); }} 
                                className="clear-btn" 
                                title="Tarihleri Temizle"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>

                          <div className="search-bar" style={{ maxWidth: '280px', width: '100%', margin: 0, padding: '0.45rem 0.75rem' }}>
                            <span className="search-icon"><Search size={16} /></span>
                            <input
                              type="text"
                              placeholder="İşlem veya müşteri ara..."
                              value={detailSearch}
                              onChange={(e) => { setDetailSearch(e.target.value); setCurrentPage(1); }}
                              className="search-input"
                              style={{ fontSize: '0.85rem' }}
                            />
                            {detailSearch && (
                              <button onClick={() => { setDetailSearch(''); setCurrentPage(1); }} className="clear-btn">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {detailStartDate && detailEndDate && detailStartDate > detailEndDate && (
                        <div style={{ color: 'var(--error)', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem', background: '#fef2f2', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                          <AlertCircle size={14} /> Başlangıç tarihi bitiş tarihinden sonra olamaz! Lütfen tarihleri kontrol edin.
                        </div>
                      )}
                      
                      <div className="appointments-table-container" style={{ marginTop: '0' }}>
                        <table className="appointments-table">
                          <thead>
                            <tr>
                              <th>Tarih & Saat</th>
                              <th>Müşteri</th>
                              <th>Stilist</th>
                              <th>Hizmet</th>
                              <th>Hizmet Ücreti</th>
                              <th>Ödeme Durumu</th>
                              <th>Ödeme Türü</th>
                              <th>İşlem Durumu</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentDetails.length > 0 ? (
                              currentDetails.map((app) => (
                                <tr key={app.id}>
                                  <td style={{ fontWeight: '500' }}>{formatDateTime(app.start_datetime)}</td>
                                  <td>
                                    <div style={{ fontWeight: '600' }}>{app.customer_name || 'Belirtilmedi'}</div>
                                    {app.customer_phone && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.customer_phone}</div>}
                                  </td>
                                  <td style={{ fontWeight: '500' }}>{app.stylist_name || 'Belirtilmedi'}</td>
                                  <td style={{ fontWeight: '500' }}>{app.service_name || 'Belirtilmedi'}</td>
                                  <td className="price-text">
                                    <div style={{ fontWeight: '700' }}>{app.price ? `${app.price} ₺` : '0.00 ₺'}</div>
                                    {app.payment_status === 'Kısmi Ödeme' && (
                                      <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '2px' }}>
                                        (Ödenen: {app.paid_amount || 0} ₺)
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <span className={`status-badge ${
                                      app.payment_status === 'Ödendi' ? 'status-completed' :
                                      app.payment_status === 'Kısmi Ödeme' ? 'status-pending' : 'status-cancelled'
                                    }`} style={{ fontSize: '0.7rem' }}>
                                      {app.payment_status || 'Ödeme Bekleniyor'}
                                    </span>
                                  </td>
                                  <td style={{ fontWeight: '500' }}>{app.payment_type || 'Belirtilmedi'}</td>
                                  <td>
                                    <span className={`status-badge status-${app.status}`}>
                                      {app.status === 'confirmed' ? 'Onaylandı' :
                                       app.status === 'completed' ? 'Tamamlandı' :
                                       app.status === 'cancelled' ? 'İptal' : app.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                  Filtrelere uygun işlem geçmişi bulunamadı.
                                </td>
                              </tr>
                            )}
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
                    </section>
                  </>
                );
              })()}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;
