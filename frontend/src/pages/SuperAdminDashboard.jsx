import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { LayoutDashboard, Building2, Users, Calendar, Settings, Activity, LogOut, User, RefreshCw, AlertCircle, Zap, Shield, Search, X, Crown, CheckCircle2 } from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'salons', 'add-salon', 'logs'
  const [salons, setSalons] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Yeni salon ekleme form states
  const [newSalonName, setNewSalonName] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [newLicenseDuration, setNewLicenseDuration] = useState('12'); // Ay olarak
  const [newPlanType, setNewPlanType] = useState('demo');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success' or 'error'

  // Seçilen özel tarihleri tutmak için state
  const [customDates, setCustomDates] = useState({});

  // Düzenleme durumu state'i
  const [editingSalon, setEditingSalon] = useState(null); // { id, name, manager_email, license_end_date, password: '' }

  // Filtre state'leri
  const [salonFilter, setSalonFilter] = useState('');
  const [superLogFilter, setSuperLogFilter] = useState('');

  // Salon listesini getir
  const fetchSalons = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/super-admin/salons`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSalons(data);
      } else if (response.status === 401 || response.status === 403) {
        navigate('/login');
      }
    } catch (err) {
      console.error("Salon verileri yüklenirken hata oluştu:", err);
    }
  };

  // Sistem loglarını getir
  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Log verileri yüklenirken hata oluştu:", err);
    }
  };

  useEffect(() => {
    // Oturum kontrolü
    if (!token || role !== 'super_admin') {
      navigate('/login');
      return;
    }

    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchSalons(), fetchLogs()]);
      setLoading(false);
    };

    initData();
  }, [token, role, navigate]);

  // Lisans uzatma fonksiyonu (30 gün)
  const handleExtendLicense = async (id, currentLicenseEnd) => {
    try {
      const currentDate = new Date(currentLicenseEnd);
      currentDate.setDate(currentDate.getDate() + 30);
      const newLicenseEnd = currentDate.toISOString().split('T')[0];

      const response = await fetch(`${API_BASE_URL}/api/super-admin/salons/${id}/license`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ license_end_date: newLicenseEnd })
      });

      if (response.ok) {
        setMessageType('success');
        setMessage('Salon lisans süresi başarıyla 30 gün uzatıldı.');
        fetchSalons();
        fetchLogs();
        setTimeout(() => setMessage(''), 4000);
      } else {
        const errData = await response.json();
        setMessageType('error');
        setMessage(`Hata: ${errData.error || 'İşlem başarısız.'}`);
      }
    } catch (err) {
      console.error("Lisans uzatılırken hata oluştu:", err);
      setMessageType('error');
      setMessage('Bağlantı hatası oluştu.');
    }
  };

  // Özel lisans tarihi atama fonksiyonu
  const handleCustomLicenseDate = async (id) => {
    const selectedDate = customDates[id];
    if (!selectedDate) {
      setMessageType('error');
      setMessage('Lütfen geçerli bir tarih seçin.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/super-admin/salons/${id}/license`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ license_end_date: selectedDate })
      });

      if (response.ok) {
        setMessageType('success');
        setMessage(`Salon lisans bitiş tarihi ${selectedDate} olarak güncellendi.`);
        setCustomDates(prev => ({ ...prev, [id]: '' }));
        fetchSalons();
        fetchLogs();
        setTimeout(() => setMessage(''), 4000);
      } else {
        const errData = await response.json();
        setMessageType('error');
        setMessage(`Hata: ${errData.error || 'İşlem başarısız.'}`);
      }
    } catch (err) {
      console.error("Lisans tarihi güncellenirken hata oluştu:", err);
      setMessageType('error');
      setMessage('Bağlantı hatası oluştu.');
    }
  };

  // Salon dondurma / aktif etme toggle
  const handleToggleStatus = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/super-admin/salons/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessageType('success');
        setMessage('Salon erişim durumu başarıyla güncellendi.');
        fetchSalons();
        fetchLogs();
        setTimeout(() => setMessage(''), 4000);
      } else {
        const errData = await response.json();
        setMessageType('error');
        setMessage(`Hata: ${errData.error || 'İşlem başarısız.'}`);
      }
    } catch (err) {
      console.error("Salon durumu değiştirilirken hata oluştu:", err);
      setMessageType('error');
      setMessage('Bağlantı hatası oluştu.');
    }
  };

  // Yeni salon ekleme
  const handleAddSalon = async (e) => {
    e.preventDefault();
    if (!newSalonName || !newManagerEmail || !newManagerPassword) {
      setMessageType('error');
      setMessage('Lütfen tüm alanları doldurun.');
      return;
    }

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + parseInt(newLicenseDuration));
    const licenseEndDateStr = currentDate.toISOString().split('T')[0];

    try {
      const response = await fetch(`${API_BASE_URL}/api/super-admin/salons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newSalonName,
          license_end_date: licenseEndDateStr,
          manager_email: newManagerEmail,
          manager_password: newManagerPassword,
          plan_type: newPlanType
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessageType('success');
        setMessage('Yeni salon kaydı başarıyla oluşturuldu ve yönetici temsilcisi tanımlandı.');
        setNewSalonName('');
        setNewManagerEmail('');
        setNewManagerPassword('');
        setNewLicenseDuration('12');
        setNewPlanType('demo');
        fetchSalons();
        fetchLogs();
        setActiveTab('salons'); // Salon listesine yönlendir
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessageType('error');
        setMessage(`Hata: ${data.error || 'Salon kaydı oluşturulamadı.'}`);
      }
    } catch (err) {
      console.error("Salon oluşturulurken hata:", err);
      setMessageType('error');
      setMessage('Bağlantı hatası oluştu.');
    }
  };

  // Salon düzenleme modalını kaydet
  const handleUpdateSalon = async (e) => {
    e.preventDefault();
    if (!editingSalon.name || !editingSalon.manager_email) {
      setMessageType('error');
      setMessage('Lütfen salon adı ve yönetici e-postasını doldurun.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/super-admin/salons/${editingSalon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingSalon.name,
          license_end_date: editingSalon.license_end_date,
          manager_email: editingSalon.manager_email,
          manager_password: editingSalon.password || undefined, // Boş bırakıldıysa gönderme
          plan_type: editingSalon.plan_type
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessageType('success');
        setMessage('Salon ve yönetici bilgileri başarıyla güncellendi.');
        setEditingSalon(null); // Modalı kapat
        fetchSalons();
        fetchLogs();
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessageType('error');
        setMessage(`Hata: ${data.error || 'Bilgiler güncellenemedi.'}`);
      }
    } catch (err) {
      console.error("Salon güncellenirken hata:", err);
      setMessageType('error');
      setMessage('Bağlantı hatası oluştu.');
    }
  };

  // Çıkış yapma
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Metrikler
  const totalSalons = salons.length;
  const activeSalons = salons.filter(s => s.is_active).length;
  const frozenSalons = salons.filter(s => !s.is_active).length;

  // Yakın zamanda lisansı bitecek olanlar (30 gün veya daha az kalmış)
  const expiringSoonSalons = salons.filter(s => {
    const timeDiff = new Date(s.license_end_date) - new Date();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 && daysDiff <= 30;
  });

  // --- RENDERING SECTIONS ---

  // Sekme 1: Genel Bakış
  const renderOverview = () => (
    <div className="overview-tab">
      <section className="metrics-grid">
        <div className="metric-card">
          <Building2 size={24} className="metric-icon" />
          <div className="metric-info">
            <h3>Kayıtlı Salon Sayısı</h3>
            <p className="metric-number">{totalSalons}</p>
          </div>
        </div>
        <div className="metric-card success">
          <span className="metric-icon"><CheckCircle2 size={24} /></span>
          <div className="metric-info">
            <h3>Aktif Lisanslı</h3>
            <p className="metric-number">{activeSalons}</p>
          </div>
        </div>
        <div className="metric-card warning">
          <span className="metric-icon"></span>
          <div className="metric-info">
            <h3>Dondurulmuş Salonlar</h3>
            <p className="metric-number">{frozenSalons}</p>
          </div>
        </div>
      </section>

      <div className="overview-summary-grid">
        <div className="summary-card expiring-card">
          <h3>Lisansı Yakında Bitecek Salonlar (Son 30 Gün)</h3>
          {expiringSoonSalons.length > 0 ? (
            <div className="expiring-list">
              {expiringSoonSalons.map(s => {
                const daysLeft = Math.ceil((new Date(s.license_end_date) - new Date()) / (1000 * 3600 * 24));
                return (
                  <div key={s.id} className="expiring-item">
                    <span className="exp-name">{s.name}</span>
                    <span className="exp-badge">{daysLeft} gün kaldı ({s.license_end_date})</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-expiring">Lisansı kritik seviyeye yaklaşmış salon bulunmamaktadır. Harika!</p>
          )}
        </div>

        <div className="summary-card stats-summary-card">
          <h3>Hızlı Eylemler</h3>
          <div className="quick-actions-list">
            <button onClick={() => setActiveTab('add-salon')} className="quick-action-btn primary-action">
              Yeni Salon Tanımla
            </button>
            <button onClick={() => setActiveTab('salons')} className="quick-action-btn secondary-action">
              Salon Listesini İncele
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSalonsList = () => {
    const filtered = salons.filter(s =>
      s.name.toLowerCase().includes(salonFilter.toLowerCase()) ||
      (s.manager_email || '').toLowerCase().includes(salonFilter.toLowerCase())
    );
    return (
    <section className="companies-list-section">
      <div className="section-title-row">
        <h2>Kayıtlı Salonlar</h2>
        <span className="list-count">{totalSalons} Salon</span>
      </div>

      <div className="list-filter-bar">
        <span className="filter-icon"><Search size={16} /></span>
        <input
          type="text"
          className="list-filter-input"
          placeholder="Salon adı veya yönetici e-postasına göre ara..."
          value={salonFilter}
          onChange={e => setSalonFilter(e.target.value)}
        />
        {salonFilter && (
          <button className="filter-clear-btn" onClick={() => setSalonFilter('')}><X size={14} /></button>
        )}
      </div>

      <div className="companies-table-container">
        <table className="companies-table">
          <thead>
            <tr>
              <th>Salon Bilgileri / Yönetici Temsilci</th>
              <th>Paket Tipi</th>
              <th>Lisans Bitiş Tarihi</th>
              <th>Erişim Durumu</th>
              <th>Yönetici Aksiyonları</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(salon => (
              <tr key={salon.id} className={!salon.is_active ? 'row-frozen' : ''}>
                <td>
                  <div className="company-meta">
                    <span className="comp-title">{salon.name}</span>
                    <span className="comp-email">{salon.manager_email}</span>
                  </div>
                </td>
                <td>
                  <span className={`plan-badge-sa ${salon.plan_type || 'demo'}`}>
                    {salon.plan_type === 'premium' ? '👑 Premium' : salon.plan_type === 'standart' ? '⭐ Standart' : '📝 Demo'}
                  </span>
                </td>
                <td>
                  <span className={`license-date-badge ${new Date(salon.license_end_date) < new Date() ? 'expired' : ''}`}>
                    {salon.license_end_date}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${salon.is_active ? 'active' : 'frozen'}`}>
                    {salon.is_active ? 'Aktif' : 'Donduruldu'}
                  </span>
                </td>
                <td>
                  <div className="actions-cell">
                    <div className="row-actions-group">
                      <button 
                        onClick={() => handleToggleStatus(salon.id)} 
                        className={`action-btn-small ${salon.is_active ? 'freeze' : 'activate'}`}
                        title={salon.is_active ? 'Salon Erişimini Dondur' : 'Salon Erişimini Aktifleştir'}
                      >
                        {salon.is_active ? 'Dondur' : 'Aktif Et'}
                      </button>
                      <button 
                        onClick={() => handleExtendLicense(salon.id, salon.license_end_date)} 
                        className="action-btn-small extend"
                        title="Lisans Süresini 30 Gün Uzat"
                      >
                        30 Gün Uzat
                      </button>
                      <button 
                        onClick={() => setEditingSalon({ ...salon, password: '' })} 
                        className="action-btn-small edit-btn"
                        title="Salonu Düzenle"
                      >
                        Düzenle
                      </button>
                    </div>
                    
                    <div className="custom-date-picker">
                      <input 
                        type="date" 
                        value={customDates[salon.id] || ''} 
                        onChange={(e) => setCustomDates({...customDates, [salon.id]: e.target.value})}
                        className="custom-date-input"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <button 
                        onClick={() => handleCustomLicenseDate(salon.id)} 
                        className="action-btn-small apply-date"
                        title="Belirtilen Tarihi Lisans Sonu Olarak Ayarla"
                        disabled={!customDates[salon.id]}
                      >
                        Uygula
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="no-logs">{salonFilter ? 'Arama sonucu bulunamadı.' : 'Kayıtlı salon bulunmamaktadır.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
    );
  };

  // Sekme 3: Yeni Salon Ekleme Formu
  const renderAddSalonForm = () => (
    <section className="add-company-section">
      <div className="form-header-row">
        <h2>Yeni Salon Tanımla</h2>
        <p className="form-description">Sisteme yeni bir güzellik merkezi veya kuaför salonu ekleyin, lisans süresi ve yönetici yetkilerini tanımlayın.</p>
      </div>

      <form onSubmit={handleAddSalon} className="add-company-form long-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Salon Adı / Ticari Unvanı</label>
            <input 
              type="text" 
              placeholder="Örn: Lüks Makas Güzellik Salonu" 
              value={newSalonName}
              onChange={(e) => setNewSalonName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Yönetici Temsilci E-postası</label>
            <input 
              type="email" 
              placeholder="yonetici@salon.com" 
              value={newManagerEmail}
              onChange={(e) => setNewManagerEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Yönetici Temsilci Şifresi</label>
            <input 
              type="password" 
              placeholder="En az 6 karakter girin" 
              value={newManagerPassword}
              onChange={(e) => setNewManagerPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Lisans Geçerlilik Süresi</label>
            <select 
              value={newLicenseDuration}
              onChange={(e) => setNewLicenseDuration(e.target.value)}
            >
              <option value="1">1 Ay Lisans</option>
              <option value="3">3 Ay Lisans</option>
              <option value="6">6 Ay Lisans</option>
              <option value="12">1 Yıl Lisans (Önerilen)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Paket Tipi</label>
            <select 
              value={newPlanType}
              onChange={(e) => setNewPlanType(e.target.value)}
            >
              <option value="demo">Demo Sürümü (0 ₺)</option>
              <option value="standart">Standart Paket (1999 ₺/ay)</option>
              <option value="premium">Premium Paket (3999 ₺/ay)</option>
            </select>
          </div>
        </div>

        <button type="submit" className="create-company-btn">
          Yeni Salon Kaydını Tanımla
        </button>
      </form>
    </section>
  );

  // Sekme 4: Sistem Logları (Audit Logs)
  const renderAuditLogs = () => (
    <section className="audit-logs-section no-margin-top">
      <div className="section-title-row">
        <h2>Sistem İşlem Geçmişi (Audit Logs)</h2>
        <button onClick={fetchLogs} className="refresh-logs-btn"><RefreshCw size={14} className="btn-icon" /> Listeyi Yenile</button>
      </div>
      <div className="list-filter-bar">
        <span className="filter-icon"><Search size={16} /></span>
        <input
          type="text"
          className="list-filter-input"
          placeholder="E-posta, eylem veya IP adresine göre ara..."
          value={superLogFilter}
          onChange={e => setSuperLogFilter(e.target.value)}
        />
        {superLogFilter && (
          <button className="filter-clear-btn" onClick={() => setSuperLogFilter('')}><X size={14} /></button>
        )}
      </div>
      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Tarih / Saat</th>
              <th>İşlemi Gerçekleştiren</th>
              <th>Eylem / Açıklama</th>
              <th>IP Adresi</th>
            </tr>
          </thead>
          <tbody>
            {logs
              .filter(log => {
                const q = superLogFilter.toLowerCase();
                return !q ||
                  (log.user_email || '').toLowerCase().includes(q) ||
                  (log.action || '').toLowerCase().includes(q) ||
                  (log.ip_address || '').includes(q);
              }).length > 0 ? (
              logs
                .filter(log => {
                  const q = superLogFilter.toLowerCase();
                  return !q ||
                    (log.user_email || '').toLowerCase().includes(q) ||
                    (log.action || '').toLowerCase().includes(q) ||
                    (log.ip_address || '').includes(q);
                })
                .map(log => (
                <tr key={log.id}>
                  <td className="log-time">{log.timestamp}</td>
                  <td className="log-user">{log.user_email}</td>
                  <td className="log-action">{log.action}</td>
                  <td className="log-ip">{log.ip_address || '127.0.0.1'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-logs">{superLogFilter ? 'Arama sonucu bulunamadı.' : 'Herhangi bir sistem işlemi kaydedilmemiştir.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  // Düzenleme Modalı Bileşeni (Overlay)
  const renderEditModal = () => (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Salon ve Yönetici Güncellemesi</h2>
          <button onClick={() => setEditingSalon(null)} className="close-modal-btn"><X size={14} /></button>
        </div>
        <form onSubmit={handleUpdateSalon} className="modal-form">
          <div className="form-group">
            <label>Salon Adı / Ticari Unvanı</label>
            <input 
              type="text" 
              value={editingSalon.name} 
              onChange={(e) => setEditingSalon({ ...editingSalon, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Yönetici Temsilci E-postası</label>
            <input 
              type="email" 
              value={editingSalon.manager_email} 
              onChange={(e) => setEditingSalon({ ...editingSalon, manager_email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Yönetici Temsilci Şifresi (Değiştirmek istemiyorsanız boş bırakın)</label>
            <input 
              type="password" 
              placeholder="Yeni şifreyi giriniz" 
              value={editingSalon.password || ''} 
              onChange={(e) => setEditingSalon({ ...editingSalon, password: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Lisans Bitiş Tarihi</label>
            <input 
              type="date" 
              value={editingSalon.license_end_date} 
              onChange={(e) => setEditingSalon({ ...editingSalon, license_end_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Paket Tipi</label>
            <select 
              value={editingSalon.plan_type || 'demo'}
              onChange={(e) => setEditingSalon({ ...editingSalon, plan_type: e.target.value })}
            >
              <option value="demo">Demo Sürümü (0 ₺)</option>
              <option value="standart">Standart Paket (1999 ₺/ay)</option>
              <option value="premium">Premium Paket (3999 ₺/ay)</option>
            </select>
          </div>

          <div className="modal-footer-buttons">
            <button type="button" onClick={() => setEditingSalon(null)} className="modal-btn cancel">Vazgeç</button>
            <button type="submit" className="modal-btn submit">Değişiklikleri Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Yönetici paneli yükleniyor, lütfen bekleyiniz...</p>
      </div>
    );
  }

  return (
    <div className="super-admin-dashboard-layout">
      {/* Sol Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" className="brand-logo-img" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} alt="GlowCut" />
          <div className="brand-meta">
            <span className="logo-text">Glow<span className="accent">Cut</span></span>
            <span className="sidebar-role">Süper Admin</span>
          </div>
        </div>
        
        <nav className="sidebar-menu">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} className="sidebar-icon" /> Genel Bakış
          </button>
          <button 
            onClick={() => setActiveTab('salons')} 
            className={`sidebar-item ${activeTab === 'salons' ? 'active' : ''}`}
          >
            <Building2 size={18} className="sidebar-icon" /> Salon Listesi
          </button>
          <button 
            onClick={() => setActiveTab('add-salon')} 
            className={`sidebar-item ${activeTab === 'add-salon' ? 'active' : ''}`}
          >
            <Settings size={18} className="sidebar-icon" /> Salon Kaydet
          </button>
          <button 
            onClick={() => setActiveTab('logs')} 
            className={`sidebar-item ${activeTab === 'logs' ? 'active' : ''}`}
          >
            Sistem Günlüğü
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-sidebar-btn">
            <LogOut size={18} className="sidebar-icon" /> Güvenli Çıkış
          </button>
        </div>
      </aside>

      {/* Sağ Ana İçerik Alanı */}
      <div className="main-content">
        <header className="main-header">
          <div className="header-title">
            <h1>{
              activeTab === 'overview' ? 'Sistem Genel Durumu' :
              activeTab === 'salons' ? 'Salon Yönetim Paneli' :
              activeTab === 'add-salon' ? 'Yeni Salon Kaydı' :
              'Sistem İşlem Geçmişi (Audit Logs)'
            }</h1>
            <p>Salonları, lisans sürelerini ve yönetici erişimlerini tek merkezden yönetin.</p>
          </div>
          <div className="user-profile-badge">
            <div className="user-avatar"><Crown size={20} /></div>
            <div className="user-details">
              <span className="user-email">{localStorage.getItem('email') || 'superadmin@glowcut.com'}</span>
              <span className="user-role-label">Sistem Yöneticisi</span>
            </div>
          </div>
        </header>

        <div className="content-container">
          {message && (
            <div className={`dashboard-alert ${messageType}`}>
              {message}
            </div>
          )}

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'salons' && renderSalonsList()}
          {activeTab === 'add-salon' && renderAddSalonForm()}
          {activeTab === 'logs' && renderAuditLogs()}
        </div>
      </div>

      {/* Salon Düzenleme Modalı */}
      {editingSalon && renderEditModal()}
    </div>
  );
};

export default SuperAdminDashboard;
