import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  TrendingUp, Users, LogOut, LayoutDashboard, Building2, 
  Calendar, Settings, Activity, DollarSign, Wallet, CheckCircle, Clock, User, Scissors, Search, X, Plus, Edit2, Trash2, AlertCircle
} from 'lucide-react';
import './AdminDashboard.css'; // Inherit main dashboard styling
import './PastAppointments.css'; // Inherit table layout
import './EarningsDashboard.css'; // Inherit charts layouts
import './ExpensesDashboard.css'; // Custom expenses overrides

const ExpensesDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all' | 'month' | 'week' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Kira');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPaymentStatus, setFormPaymentStatus] = useState('Ödendi');
  const [formPaymentType, setFormPaymentType] = useState('Nakit');
  const [formNotes, setFormNotes] = useState('');

  // Quick Invoice Form State
  const [quickInvoiceTitle, setQuickInvoiceTitle] = useState('');
  const [quickInvoiceType, setQuickInvoiceType] = useState('Elektrik');
  const [quickInvoiceAmount, setQuickInvoiceAmount] = useState('');
  const [quickInvoiceDate, setQuickInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickInvoiceStatus, setQuickInvoiceStatus] = useState('Ödeme Bekleniyor');
  const [quickInvoicePaymentType, setQuickInvoicePaymentType] = useState('Nakit');
  const [quickInvoiceNotes, setQuickInvoiceNotes] = useState('');

  // Custom Category State for Add/Edit Modals
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/expenses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
        setMessage('');
      } else {
        setMessage('Gider verileri yüklenemedi.');
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
    fetchExpenses();
  }, [role, navigate, fetchExpenses]);

  // Handle Quick Invoice Submission
  const handleAddQuickInvoice = async (e) => {
    e.preventDefault();
    if (!quickInvoiceTitle || !quickInvoiceAmount) {
      setMessage('Lütfen fatura adı ve tutar alanlarını doldurun.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `${quickInvoiceType} Faturası - ${quickInvoiceTitle}`,
          category: 'Fatura',
          amount: parseFloat(quickInvoiceAmount),
          date: quickInvoiceDate || new Date().toISOString().split('T')[0],
          payment_status: quickInvoiceStatus,
          payment_type: quickInvoiceStatus === 'Ödendi' ? quickInvoicePaymentType : null,
          notes: quickInvoiceNotes
        })
      });

      if (response.ok) {
        setMessage('Fatura başarıyla kaydedildi ve gider listesine eklendi.');
        setMessageType('success');
        setQuickInvoiceTitle('');
        setQuickInvoiceType('Elektrik');
        setQuickInvoiceAmount('');
        setQuickInvoiceDate(new Date().toISOString().split('T')[0]);
        setQuickInvoiceStatus('Ödeme Bekleniyor');
        setQuickInvoicePaymentType('Nakit');
        setQuickInvoiceNotes('');
        fetchExpenses();
      } else {
        const err = await response.json();
        setMessage(err.error || 'Fatura eklenirken hata oluştu.');
        setMessageType('error');
      }
    } catch {
      setMessage('Bağlantı hatası.');
      setMessageType('error');
    }
  };

  // Handle Form Submission (Add)
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formTitle || !formCategory || !formAmount) {
      setMessage('Lütfen zorunlu alanları doldurun.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          amount: parseFloat(formAmount),
          date: formDate || new Date().toISOString().split('T')[0],
          payment_status: formPaymentStatus,
          payment_type: formPaymentStatus === 'Ödendi' ? formPaymentType : null,
          notes: formNotes
        })
      });

      if (response.ok) {
        setMessage('Gider başarıyla eklendi.');
        setMessageType('success');
        setShowAddModal(false);
        resetForm();
        fetchExpenses();
      } else {
        const err = await response.json();
        setMessage(err.error || 'Gider eklenirken hata oluştu.');
        setMessageType('error');
      }
    } catch {
      setMessage('Bağlantı hatası.');
      setMessageType('error');
    }
  };

  // Handle Form Submission (Edit)
  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!formTitle || !formCategory || !formAmount) {
      setMessage('Lütfen zorunlu alanları doldurun.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          amount: parseFloat(formAmount),
          date: formDate,
          payment_status: formPaymentStatus,
          payment_type: formPaymentStatus === 'Ödendi' ? formPaymentType : null,
          notes: formNotes
        })
      });

      if (response.ok) {
        setMessage('Gider başarıyla güncellendi.');
        setMessageType('success');
        setEditingExpense(null);
        resetForm();
        fetchExpenses();
      } else {
        const err = await response.json();
        setMessage(err.error || 'Güncelleme hatası.');
        setMessageType('error');
      }
    } catch {
      setMessage('Bağlantı hatası.');
      setMessageType('error');
    }
  };

  // Handle Delete
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Bu gideri silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage('Gider başarıyla silindi.');
        setMessageType('success');
        fetchExpenses();
      } else {
        setMessage('Gider silinemedi.');
        setMessageType('error');
      }
    } catch {
      setMessage('Bağlantı hatası.');
      setMessageType('error');
    }
  };

  const openEditModal = (exp) => {
    const isDefault = ['Kira', 'Fatura', 'Personel', 'Ürün Alımı', 'Diğer'].includes(exp.category);
    setEditingExpense(exp);
    setFormTitle(exp.title);
    setFormCategory(exp.category);
    setIsCustomCategory(!isDefault);
    setCustomCategoryInput(!isDefault ? exp.category : '');
    setFormAmount(exp.amount.toString());
    setFormDate(exp.date);
    setFormPaymentStatus(exp.payment_status);
    setFormPaymentType(exp.payment_type || 'Nakit');
    setFormNotes(exp.notes || '');
  };

  const resetForm = () => {
    setFormTitle('');
    setFormCategory('Kira');
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentStatus('Ödendi');
    setFormPaymentType('Nakit');
    setFormNotes('');
  };

  // Filter expenses by period
  const getFilteredExpenses = () => {
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

    return expenses.filter(exp => {
      if (!exp.date) return false;
      const expDate = new Date(exp.date);
      if (startDate && expDate < startDate) return false;
      if (endDate && expDate > endDate) return false;
      return true;
    });
  };

  const getSearchedExpenses = () => {
    const exps = getFilteredExpenses();
    const sorted = [...exps].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!detailSearch) return sorted;
    const q = detailSearch.toLowerCase();
    return sorted.filter(exp => 
      (exp.title || '').toLowerCase().includes(q) ||
      (exp.category || '').toLowerCase().includes(q) ||
      (exp.payment_type || '').toLowerCase().includes(q) ||
      (exp.notes || '').toLowerCase().includes(q)
    );
  };

  // Compute stats
  const getCalculatedMetrics = () => {
    const filtered = getFilteredExpenses();
    let totalGider = 0;
    let odenen = 0;
    let bekleyen = 0;

    const categoryTotals = {};
    const defaultCategories = ['Kira', 'Fatura', 'Personel', 'Ürün Alımı', 'Diğer'];
    defaultCategories.forEach(cat => {
      categoryTotals[cat] = 0;
    });

    const paymentTypeTotals = {
      'Nakit': 0,
      'Havale/EFT': 0,
      'IBAN': 0,
      'Kredi Kartı': 0,
      'Diğer': 0,
      'Belirtilmedi': 0
    };

    filtered.forEach(exp => {
      const amount = parseFloat(exp.amount) || 0;
      totalGider += amount;

      if (exp.payment_status === 'Ödendi') {
        odenen += amount;
      } else {
        bekleyen += amount;
      }

      const cat = exp.category || 'Diğer';
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += amount;
      } else {
        categoryTotals[cat] = amount;
      }

      const type = exp.payment_type || 'Belirtilmedi';
      if (paymentTypeTotals[type] !== undefined) {
        paymentTypeTotals[type] += amount;
      } else {
        paymentTypeTotals['Diğer'] += amount;
      }
    });

    return {
      totalGider,
      odenen,
      bekleyen,
      categories: Object.entries(categoryTotals).map(([name, amount]) => ({ name, amount })),
      paymentTypes: paymentTypeTotals
    };
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('company_id');
    navigate('/login');
  };

  const metrics = getCalculatedMetrics();

  const uniqueCategories = Array.from(new Set([
    'Kira', 'Fatura', 'Personel', 'Ürün Alımı', 'Diğer',
    ...expenses.map(e => e.category).filter(Boolean)
  ]));

  const searchedExpenses = getSearchedExpenses();
  const totalPages = Math.ceil(searchedExpenses.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = searchedExpenses.slice(indexOfFirstItem, indexOfLastItem);

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
          <button onClick={() => navigate('/earnings')} className="sidebar-item">
            <TrendingUp size={18} className="sidebar-icon" /> Kazanç Paneli
          </button>
          <button onClick={() => navigate('/expenses')} className="sidebar-item active">
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
            <h1>Gider Yönetimi</h1>
            <p>Salonunuzun harcamalarını, kira, fatura ve personel ödemelerini takip edin.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="add-expense-quick-btn">
              <Plus size={16} /> <span>Gider Ekle</span>
            </button>
            <div className="user-profile-badge">
              <div className="user-avatar"><User size={20} /></div>
              <div className="user-details">
                <span className="user-email">{localStorage.getItem('email') || 'yonetici@glowcut.com'}</span>
                <span className="user-role-label">Salon Yöneticisi</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-container">
          {message && (
            <div className={`status-message-banner ${messageType}`} style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
              {message}
            </div>
          )}

          {loading ? (
            <div className="loading-state">Yükleniyor...</div>
          ) : (
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
                {/* Toplam Gider */}
                <div className="earnings-metric-card">
                  <div className="metric-card-header">
                    <span className="metric-icon-wrapper red"><DollarSign size={20} /></span>
                    <span className="metric-title">Toplam Gider</span>
                  </div>
                  <div className="metric-value">{metrics.totalGider.toFixed(2)} ₺</div>
                  <div className="metric-desc">Filtrelenen dönemdeki toplam harcama</div>
                </div>

                {/* Ödenen */}
                <div className="earnings-metric-card">
                  <div className="metric-card-header">
                    <span className="metric-icon-wrapper green"><CheckCircle size={20} /></span>
                    <span className="metric-title">Ödenen Giderler</span>
                  </div>
                  <div className="metric-value text-green">{metrics.odenen.toFixed(2)} ₺</div>
                  <div className="metric-desc">Ödemesi tamamlanmış giderler</div>
                </div>

                {/* Bekleyen Ödeme */}
                <div className="earnings-metric-card">
                  <div className="metric-card-header">
                    <span className="metric-icon-wrapper orange"><Clock size={20} /></span>
                    <span className="metric-title">Bekleyen Ödemeler</span>
                  </div>
                  <div className="metric-value text-orange">{metrics.bekleyen.toFixed(2)} ₺</div>
                  <div className="metric-desc">Ödeme bekleyen fatura/borçlar</div>
                </div>
              </div>

              {/* Görsel Grafikler */}
              {(() => {
                let accumulatedPercent = 0;
                const donutSegments = Object.entries(metrics.paymentTypes)
                  .filter(([_, amount]) => amount > 0)
                  .map(([type, amount], idx) => {
                    const percent = amount / (metrics.totalGider || 1);
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

                return (
                  <div className="chart-container-grid">
                    {/* 1. Gider Kategorisi Dağılımı */}
                    <div className="chart-card">
                      <h3>Kategori Dağılımı</h3>
                      <div className="chart-bar-list" style={{ gap: '0.75rem' }}>
                        {metrics.categories.length > 0 ? (
                          metrics.categories
                            .sort((a, b) => b.amount - a.amount)
                            .map((cat, idx) => {
                              const maxAmount = Math.max(...metrics.categories.map(c => c.amount), 1);
                              const percentage = (cat.amount / maxAmount) * 100;
                              const overallPercentage = (cat.amount / (metrics.totalGider || 1)) * 100;
                              
                              const initials = cat.name.substring(0, 2).toUpperCase();
                              
                              const barColors = [
                                'linear-gradient(90deg, #f87171 0%, #ef4444 100%)', // red
                                'linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)', // blue
                                'linear-gradient(90deg, #818cf8 0%, #6366f1 100%)', // purple
                                'linear-gradient(90deg, #34d399 0%, #10b981 100%)', // green
                                'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', // yellow
                              ];
                              const selectedBarColor = barColors[idx % barColors.length];

                              return (
                                <div key={cat.name} className="premium-chart-row">
                                  <div 
                                    className="stylist-chart-avatar" 
                                    style={{ background: `linear-gradient(135deg, ${idx % 2 === 0 ? '#ef4444, #f87171' : '#3b82f6, #60a5fa'})` }}
                                  >
                                    {initials}
                                  </div>
                                  <div className="chart-row-details">
                                    <div className="chart-bar-info">
                                      <div className="chart-stylist-meta">
                                        <span className="chart-stylist-name">{cat.name}</span>
                                      </div>
                                      <div className="chart-stylist-value">
                                        <strong>{cat.amount.toFixed(2)} ₺</strong>
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
                      <h3>Gider Ödeme Yöntemi</h3>
                      <div className="donut-chart-layout">
                        {metrics.totalGider > 0 ? (
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
                                    {metrics.totalGider.toFixed(0)} ₺
                                  </text>
                                  <text x="50" y="62" textAnchor="middle" className="donut-center-lbl" style={{ fontSize: '6px', fontWeight: '600', fill: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Toplam Gider
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
                );
              })()}

              {/* Hızlı Fatura Ekleme Formu */}
              <section className="section-content quick-invoice-card" style={{ marginBottom: '2rem', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>Hızlı Fatura Kaydı Ekle</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  Manuel fatura (Elektrik, Su, Doğalgaz vb.) ekleyerek doğrudan gider listesine yansıtın.
                </p>
                <form onSubmit={handleAddQuickInvoice} className="quick-invoice-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Fatura Başlığı *</label>
                    <input
                      type="text"
                      required
                      value={quickInvoiceTitle}
                      onChange={(e) => setQuickInvoiceTitle(e.target.value)}
                      placeholder="Örn: Haziran Dönemi"
                      className="filter-input"
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Fatura Türü *</label>
                    <select
                      value={quickInvoiceType}
                      onChange={(e) => setQuickInvoiceType(e.target.value)}
                      className="filter-select"
                    >
                      <option value="Elektrik">Elektrik</option>
                      <option value="Su">Su</option>
                      <option value="Doğalgaz">Doğalgaz</option>
                      <option value="İnternet">İnternet</option>
                      <option value="Kira">Kira</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Tutar (₺) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={quickInvoiceAmount}
                      onChange={(e) => setQuickInvoiceAmount(e.target.value)}
                      placeholder="0.00"
                      className="filter-input"
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Fatura Tarihi *</label>
                    <input
                      type="date"
                      required
                      value={quickInvoiceDate}
                      onChange={(e) => setQuickInvoiceDate(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Ödeme Durumu</label>
                    <select
                      value={quickInvoiceStatus}
                      onChange={(e) => setQuickInvoiceStatus(e.target.value)}
                      className="filter-select"
                    >
                      <option value="Ödeme Bekleniyor">Ödeme Bekleniyor</option>
                      <option value="Ödendi">Ödendi</option>
                    </select>
                  </div>
                  {quickInvoiceStatus === 'Ödendi' && (
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Ödeme Yöntemi</label>
                      <select
                        value={quickInvoicePaymentType}
                        onChange={(e) => setQuickInvoicePaymentType(e.target.value)}
                        className="filter-select"
                      >
                        <option value="Nakit">Nakit</option>
                        <option value="Kredi Kartı">Kredi Kartı</option>
                        <option value="Havale/EFT">Havale/EFT</option>
                        <option value="IBAN">IBAN</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>
                  )}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Notlar / Açıklama</label>
                    <input
                      type="text"
                      value={quickInvoiceNotes}
                      onChange={(e) => setQuickInvoiceNotes(e.target.value)}
                      placeholder="Fatura detay notu..."
                      className="filter-input"
                    />
                  </div>
                  <button type="submit" className="confirm" style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Fatura Ekle
                  </button>
                </form>
              </section>

              {/* Detaylı Gider Listesi */}
              <section className="section-content" style={{ marginTop: '2.5rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Gider Kayıt Detayları</h2>
                  <div className="search-bar" style={{ maxWidth: '320px', width: '100%', margin: 0, padding: '0.45rem 0.75rem' }}>
                    <span className="search-icon"><Search size={16} /></span>
                    <input
                      type="text"
                      placeholder="Gider adı, not veya kategori ara..."
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

                <div className="appointments-table-container" style={{ marginTop: '0' }}>
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Gider Başlığı</th>
                        <th>Kategori</th>
                        <th>Tutar</th>
                        <th>Ödeme Durumu</th>
                        <th>Ödeme Türü</th>
                        <th>Açıklama</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentExpenses.length > 0 ? (
                        currentExpenses.map((exp) => (
                          <tr key={exp.id}>
                            <td style={{ fontWeight: '500' }}>{formatDateTime(exp.date)}</td>
                            <td style={{ fontWeight: '600' }}>{exp.title}</td>
                            <td>
                              <span className="percent-badge" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                                {exp.category}
                              </span>
                            </td>
                            <td className="price-text" style={{ color: '#ef4444' }}>{exp.amount.toFixed(2)} ₺</td>
                            <td>
                              <span className={`status-badge ${
                                exp.payment_status === 'Ödendi' ? 'status-completed' : 'status-cancelled'
                              }`} style={{ fontSize: '0.7rem' }}>
                                {exp.payment_status}
                              </span>
                            </td>
                            <td style={{ fontWeight: '500' }}>{exp.payment_type || '-'}</td>
                            <td style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.notes}>
                              {exp.notes || '-'}
                            </td>
                            <td className="action-cell">
                              <button onClick={() => openEditModal(exp)} className="action-btn-view" title="Düzenle" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteExpense(exp.id)} className="action-btn-view" title="Sil" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            Gider kaydı bulunamadı.
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
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content text-left" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Yeni Gider Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="close-modal-btn">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="modal-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Gider Başlığı *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Örn: Haziran Elektrik Faturası"
                    className="filter-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Kategori *</label>
                    <select
                      value={isCustomCategory ? 'CUSTOM' : formCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          setIsCustomCategory(true);
                          setFormCategory('');
                        } else {
                          setIsCustomCategory(false);
                          setFormCategory(val);
                        }
                      }}
                      className="filter-select"
                    >
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="CUSTOM">+ Yeni Tür Ekle...</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Tutar (₺) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="filter-input"
                    />
                  </div>
                </div>

                {isCustomCategory && (
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Yeni Gider Türü *</label>
                    <input
                      type="text"
                      required
                      value={customCategoryInput}
                      onChange={(e) => {
                        setCustomCategoryInput(e.target.value);
                        setFormCategory(e.target.value);
                      }}
                      placeholder="Yeni gider kategorisini / türünü yazın..."
                      className="filter-input"
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Tarih *</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="filter-input"
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Ödeme Durumu</label>
                    <select
                      value={formPaymentStatus}
                      onChange={(e) => setFormPaymentStatus(e.target.value)}
                      className="filter-select"
                    >
                      <option value="Ödendi">Ödendi</option>
                      <option value="Ödeme Bekleniyor">Ödeme Bekleniyor</option>
                    </select>
                  </div>
                </div>

                {formPaymentStatus === 'Ödendi' && (
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Ödeme Yöntemi</label>
                    <select
                      value={formPaymentType}
                      onChange={(e) => setFormPaymentType(e.target.value)}
                      className="filter-select"
                    >
                      <option value="Nakit">Nakit</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Havale/EFT">Havale/EFT</option>
                      <option value="IBAN">IBAN</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                )}

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Açıklama / Notlar</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Ek detaylar..."
                    style={{ minHeight: '60px', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: 'none', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="modal-btn cancel">Vazgeç</button>
                <button type="submit" className="modal-btn confirm" style={{ background: '#ef4444' }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <div className="modal-backdrop">
          <div className="modal-content text-left" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Gideri Düzenle</h2>
              <button onClick={() => setEditingExpense(null)} className="close-modal-btn">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleUpdateExpense}>
              <div className="modal-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Gider Başlığı *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Kategori *</label>
                    <select
                      value={isCustomCategory ? 'CUSTOM' : formCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          setIsCustomCategory(true);
                          setFormCategory('');
                        } else {
                          setIsCustomCategory(false);
                          setFormCategory(val);
                        }
                      }}
                      className="filter-select"
                    >
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="CUSTOM">+ Yeni Tür Ekle...</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Tutar (₺) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                </div>

                {isCustomCategory && (
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Yeni Gider Türü *</label>
                    <input
                      type="text"
                      required
                      value={customCategoryInput}
                      onChange={(e) => {
                        setCustomCategoryInput(e.target.value);
                        setFormCategory(e.target.value);
                      }}
                      placeholder="Yeni gider kategorisini / türünü yazın..."
                      className="filter-input"
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Tarih *</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="filter-input"
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Ödeme Durumu</label>
                    <select
                      value={formPaymentStatus}
                      onChange={(e) => setFormPaymentStatus(e.target.value)}
                      className="filter-select"
                    >
                      <option value="Ödendi">Ödendi</option>
                      <option value="Ödeme Bekleniyor">Ödeme Bekleniyor</option>
                    </select>
                  </div>
                </div>

                {formPaymentStatus === 'Ödendi' && (
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Ödeme Yöntemi</label>
                    <select
                      value={formPaymentType}
                      onChange={(e) => setFormPaymentType(e.target.value)}
                      className="filter-select"
                    >
                      <option value="Nakit">Nakit</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Havale/EFT">Havale/EFT</option>
                      <option value="IBAN">IBAN</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                )}

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>Açıklama / Notlar</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    style={{ minHeight: '60px', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: 'none', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0' }}>
                <button type="button" onClick={() => setEditingExpense(null)} className="modal-btn cancel">Vazgeç</button>
                <button type="submit" className="modal-btn confirm" style={{ background: '#ef4444' }}>Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesDashboard;
