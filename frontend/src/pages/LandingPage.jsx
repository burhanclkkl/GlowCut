import React, { useEffect, useState } from 'react';
import { 
  CalendarDays, MousePointer2, MoveVertical, Layers, 
  Moon, Activity, ShieldCheck, ChevronRight, CheckCircle2,
  Users, BarChart3, AlertCircle, ArrowUpDown,
  TrendingUp, Sparkles, HelpCircle, Heart, DollarSign, ChevronDown, ChevronUp, X
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [appointmentCount, setAppointmentCount] = useState(400);
  const [averagePrice, setAveragePrice] = useState(500);
  const [faqOpen, setFaqOpen] = useState({});
  const [selectedSimService, setSelectedSimService] = useState('Kesim');
  const [selectedSimStylist, setSelectedSimStylist] = useState('Ahmet');
  const [selectedSimTime, setSelectedSimTime] = useState('11:00');
  const [isBooked, setIsBooked] = useState(false);

  const demoSubject = "✨ GlowCut | 14 Günlük Ücretsiz Demo Aktivasyon Talebi";
  const demoBody = "GlowCut Destek Ekibine,\n\nSalonumuzda randevu çakışmalarını sıfırlamak ve operasyonel hızımızı artırmak için GlowCut 14 Günlük Ücretsiz Demo sürümünü deneyimlemek istiyoruz.\n\nDemo hesabımızın kurulması ve gerekli aktivasyon işlemlerinin başlatılması için bilgilerimizi aşağıda iletiyoruz:\n\n📋 SALON VE İLETİŞİM BİLGİLERİ\n--------------------------------------------------\nSalon Adı          : [Salonunuzun Adını Yazınız]\nYetkili Ad Soyad   : [Adınız ve Soyadınız]\nTelefon Numarası   : [Telefon Numaranız]\nE-posta Adresi     : [Tercih Ettiğiniz E-posta Adresi]\n--------------------------------------------------\n\nGerekli kurulum adımları ve bilgilendirme için dönüşünüzü rica eder, iyi çalışmalar dileriz.\n\nSaygılarımızla,\n[Yetkili Ad Soyad]";
  const demoMailto = `mailto:support@glowcut.com?subject=${encodeURIComponent(demoSubject)}&body=${encodeURIComponent(demoBody)}`;

  const standartSubject = "🚀 GlowCut | Standart Paket Abonelik Başvuru Talebi";
  const standartBody = "GlowCut Satış & Destek Ekibine,\n\nSalonumuzun büyüme hedefleri doğrultusunda, randevu çakışmalarını engelleyen ve sınırsız stilist yönetimini barındıran Standart Paket (1.999 ₺ / Ay) aboneliğimizi başlatmak istiyoruz.\n\nGerekli faturalandırma, ödeme adımları ve hesap aktivasyonu için salon bilgilerimiz aşağıda yer almaktadır:\n\n📋 SALON VE İLETİŞİM BİLGİLERİ\n--------------------------------------------------\nSalon Adı          : [Salonunuzun Adını Yazınız]\nYetkili Ad Soyad   : [Adınız ve Soyadınız]\nTelefon Numarası   : [Telefon Numaranız]\nTercih Edilen Email: [Giriş için kullanılacak e-posta]\n--------------------------------------------------\n\nAbonelik aktivasyon sürecinin başlatılması ve ödeme bağlantısı (linki) iletilmesi hususunda dönüşünüzü bekliyoruz.\n\nSaygılarımızla,\n[Yetkili Ad Soyad]";
  const standartMailto = `mailto:support@glowcut.com?subject=${encodeURIComponent(standartSubject)}&body=${encodeURIComponent(standartBody)}`;

  const premiumSubject = "👑 GlowCut | Premium Paket Abonelik & Kurulum Talebi";
  const premiumBody = "GlowCut Satış & Destek Ekibine,\n\nSalonumuzun tüm yönetim, randevu çizelgeleme, detaylı müşteri geçmişi, gelir-gider finans takibi ve gelişmiş Excel analitiği ihtiyaçlarını karşılamak üzere Premium Paket (3.999 ₺ / Ay) aboneliğimizi başlatmak istiyoruz.\n\nEn üst düzey deneyim için salonumuz adına gerekli tanımlamaların ve özel aktivasyonun yapılması adına bilgilerimiz aşağıda sunulmuştur:\n\n📋 SALON VE İLETİŞİM BİLGİLERİ\n--------------------------------------------------\nSalon Adı          : [Salonunuzun Adını Yazınız]\nYetkili Ad Soyad   : [Adınız ve Soyadınız]\nTelefon Numarası   : [Telefon Numaranız]\nTercih Edilen Email: [Giriş için kullanılacak e-posta]\n--------------------------------------------------\n\nÖdeme kanallarının paylaşılması, faturamızın düzenlenmesi ve Premium modüllerimizin (Finans & Raporlama) anında aktif edilmesi için dönüşünüzü rica ederiz.\n\nSaygılarımızla,\n[Yetkili Ad Soyad]";
  const premiumMailto = `mailto:support@glowcut.com?subject=${encodeURIComponent(premiumSubject)}&body=${encodeURIComponent(premiumBody)}`;

  const simServices = {
    'Kesim': { name: 'Saç Kesimi & Şekillendirme', price: 400, duration: 45, icon: 'Kesim' },
    'Boya': { name: 'Premium Renklendirme & Boya', price: 1200, duration: 120, icon: 'Boya' },
    'Bakim': { name: 'Keratin & Canlandırıcı Bakım', price: 800, duration: 90, icon: 'Bakim' },
  };

  const simStylists = {
    'Ahmet': { name: 'Ahmet Kaya', role: 'Master Stilist', rating: 4.9, avatar: 'A' },
    'Elif': { name: 'Elif Şen', role: 'Renk Uzmanı', rating: 4.8, avatar: 'E' },
    'Canan': { name: 'Canan Demir', role: 'Saç Bakım Uzmanı', rating: 4.9, avatar: 'C' },
  };

  const simTimes = ['09:30', '11:00', '13:30', '15:00', '16:30'];

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const hoursSaved = Math.round((appointmentCount * 8) / 60); // 8 minutes saved per appointment
  const extraRevenue = Math.round(appointmentCount * 0.15 * averagePrice); // 15% occupancy boost

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page-premium">
      {/* Dynamic Backgrounds */}
      <div className="ambient-bg ambient-1"></div>
      <div className="ambient-bg ambient-2"></div>
      <div className="ambient-bg ambient-3"></div>

      {/* Hero Section */}
      <header className="premium-hero">
        <div className="hero-content">
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} style={{ color: 'var(--accent)' }} /> GlowCut Sürüm 2.0 Yayında
          </div>
          <h1 className="hero-title">
            Salon Randevu Yönetiminde <br/>
            <span className="text-gradient-primary">Yeni Bir Standart.</span>
          </h1>
          <p className="hero-subtitle">
            Gelişmiş sürükle-bırak takvimi, müşteri odaklı CRM planlaması ve esnek randevu süresi boyutlandırma özellikleriyle salonunuzu sıfır hata ile yönetin.
          </p>
          <div className="hero-actions">
            <a href="/login" className="btn-primary-large">
              Hemen Başla <ChevronRight size={20} />
            </a>
          </div>
        </div>

        {/* Hero Visual - Floating UI */}
        <div className="hero-visual-showcase">
          <div className="floating-ui-card ui-main">
            <div className="ui-header">
              <div className="mac-dots"><span className="red"></span><span className="yellow"></span><span className="green"></span></div>
              <div className="ui-title">Randevu Çizelgesi</div>
            </div>
            <div className="ui-body">
              <div className="mock-grid">
                <div className="mock-col time-col">
                  <span>09:00</span><span>10:00</span><span>11:00</span>
                </div>
                <div className="mock-col day-col">
                  <div className="day-header">Pazartesi</div>
                  <div className="mock-shift-block drag-anim">
                    <span className="name">Canan Öztürk (Müşteri)</span>
                    <span className="time">09:00 - 10:30</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="floating-badge badge-1">
            <ShieldCheck size={20} /> %100 Çift Randevu Koruması
          </div>
          <div className="floating-badge badge-2">
            <MousePointer2 size={20} /> Müşteri Sürükle ve Bırak
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section id="analytics" className="premium-stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon"><MousePointer2 size={32} /></div>
            <h3 className="stat-number">1 Sn</h3>
            <p className="stat-desc">Randevu Kayıt Hızı</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><ShieldCheck size={32} /></div>
            <h3 className="stat-number">%100</h3>
            <p className="stat-desc">Müşteri Memnuniyeti</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Activity size={32} /></div>
            <h3 className="stat-number">4 Kat</h3>
            <p className="stat-desc">Daha Hızlı Planlama</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><BarChart3 size={32} /></div>
            <h3 className="stat-number">7/24</h3>
            <p className="stat-desc">Mobil & Web Erişim</p>
          </div>
        </div>
      </section>

      {/* Easiness Section */}
      <section id="easiness" className="premium-easiness-section">
        <div className="easiness-content">
          <h2>Ajanda Karışıklığına Son!</h2>
          <p>Telefonla gelen randevuları anında sürükle-bırak yöntemiyle takvime yerleştirin, stilistlerinizin doluluk oranlarını tek bakışta görün. Salon yöneticileri için en kolay yönetim paneli.</p>
        </div>
      </section>

      {/* Detail Features Vertical Layout */}
      <section id="features" className="premium-features-section">
        <div className="section-heading">
          <h2>Salon Sahipleri İçin Üstün Yetenekler</h2>
          <p>Her bir özellik, salonunuzun operasyonel hızını artırmak ve randevu kaçırma riskini sıfıra indirmek için özel tasarlandı.</p>
        </div>

        <div className="feature-showcase-container">
          
          {/* Feature 1: Sürükle Bırak */}
          <div className="feature-row">
            <div className="feature-text">
              <div className="icon-wrapper blue"><MousePointer2 size={28} /></div>
              <h3>Pürüzsüz Sürükle-Bırak Müşteri Planlama</h3>
              <p>Müşterinizi sol listeden tutup, takvimdeki istediğiniz gün ve saate bırakın. Modal üzerinden çalışacak stilisti, verilecek hizmeti ve ücret detaylarını seçerek randevuyu anında sabitleyin.</p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={18} /> Anında müşteri ve saat eşleştirme</li>
                <li><CheckCircle2 size={18} /> Kolay sürükle-bırak takvimi</li>
              </ul>
            </div>
            <div className="feature-visual">
              <div className="interactive-mock mock-drag">
                <div className="mock-cursor"><MousePointer2 size={24} color="#000" /></div>
                <div className="mock-employee-card">Canan Öztürk (Müşteri)</div>
                <div className="mock-drop-zone">09:00 - 10:00</div>
              </div>
            </div>
          </div>

          {/* Feature 2: Yukarı/Aşağı Esnetme (Resizing) */}
          <div className="feature-row reverse">
            <div className="feature-text">
              <div className="icon-wrapper purple"><ArrowUpDown size={28} /></div>
              <h3>Dinamik Randevu Esnetme (Resizing)</h3>
              <p>Boya işlemi saç kesiminden daha mı uzun sürüyor? Randevu kartının alt veya üst kenarından tutup çekerek süresini dilediğiniz gibi esnetin. Saatler gerçek zamanlı hesaplanır.</p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={18} /> Yukarı çekerek randevuyu erkene alma</li>
                <li><CheckCircle2 size={18} /> Aşağı çekerek randevu süresini uzatma</li>
                <li><CheckCircle2 size={18} /> Anlık süre ve ücret önizlemesi</li>
              </ul>
            </div>
            <div className="feature-visual">
              <div className="interactive-mock mock-resize">
                <div className="resize-handle top"></div>
                <div className="mock-shift resizing-active">
                  <div className="shift-time-live">11:00 - 13:30</div>
                  <div className="shift-name">Elif Ş. (Boya)</div>
                </div>
                <div className="resize-handle bottom"></div>
                <div className="mock-cursor-resize"><MoveVertical size={24} color="#000" /></div>
              </div>
            </div>
          </div>

          {/* Feature 3: Çakışma ve Yan Yana Dizilme */}
          <div className="feature-row">
            <div className="feature-text">
              <div className="icon-wrapper orange"><Layers size={28} /></div>
              <h3>Eşzamanlı Randevu Görünümü (Overlapping)</h3>
              <p>Aynı saat diliminde çalışan farklı stilistlerin randevuları takvimde birbirini ezmez. Sistem, akıllı yerleşim algoritması ile kartları yan yana dizerek ekranı en verimli şekilde kullanır.</p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={18} /> Farklı stilist randevularını aynı sütunda izleme</li>
                <li><CheckCircle2 size={18} /> Matematiksel olarak hizalanmış kart yerleşimi</li>
                <li><CheckCircle2 size={18} /> Okunabilirliği koruyan daraltma modu</li>
              </ul>
            </div>
            <div className="feature-visual">
              <div className="interactive-mock mock-overlap">
                <div className="overlap-container">
                  <div className="mock-shift half left">09:00 - 10:30 <br/>Canan Öztürk</div>
                  <div className="mock-shift half right">09:30 - 11:00 <br/>Merve Kaya</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 5: Kontrol & Güvenlik */}
          <div className="feature-row">
            <div className="feature-text">
              <div className="icon-wrapper red"><AlertCircle size={28} /></div>
              <h3>Çift Randevu (Double-Booking) Koruması</h3>
              <p>Bir stilist zaten doluyken ona aynı saat diliminde başka bir randevu yazmaya kalkarsanız, sistem sizi anında uyarır ve stilistin iki müşteriye birden atanmasını bloke eder.</p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={18} /> Stilist bazlı çakışma bariyeri</li>
                <li><CheckCircle2 size={18} /> Görsel ve animasyonlu hata uyarıları</li>
              </ul>
            </div>
            <div className="feature-visual">
              <div className="interactive-mock mock-error">
                <div className="error-toast">
                  <AlertCircle size={20} />
                  <span>Hata: Ahmet Kaya bu saatler arasında zaten dolu!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 6: Finansal Takip */}
          <div className="feature-row reverse">
            <div className="feature-text">
              <div className="icon-wrapper green"><BarChart3 size={28} /></div>
              <h3>Gelişmiş Finansal Gelir & Gider Takibi</h3>
              <p>Salonunuzun finansal gidişatını saniyeler içinde analiz edin. Randevu ciro girdilerini, fatura, kira, ürün alımları ve personel prim hak edişlerini tek ekrandan takip edin. Net kârlılık durumunuzu anlık grafiklerle görün.</p>
              <ul className="feature-bullets">
                <li><CheckCircle2 size={18} /> Otomatik Randevu Ciro Kayıtları</li>
                <li><CheckCircle2 size={18} /> Dinamik Gider Kategori Yönetimi</li>
                <li><CheckCircle2 size={18} /> Fatura ve Sabit Gider Planlama</li>
              </ul>
            </div>
            <div className="feature-visual">
              <div className="interactive-mock mock-finance">
                <div className="finance-container-mock">
                  <div className="finance-row-mock">
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'white' }}>Aylık Finans Raporu</span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>Kârlılık Yüksek</span>
                  </div>
                  <div className="finance-grid-mock">
                    <div className="finance-card-mock">
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Toplam Gelir</span>
                      <strong style={{ fontSize: '1.05rem', color: '#10b981', fontWeight: '800' }}>48.250 ₺</strong>
                      <div className="finance-bar-mock" style={{ marginTop: '8px' }}>
                        <div className="finance-bar-fill-income"></div>
                      </div>
                    </div>
                    <div className="finance-card-mock">
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Toplam Gider</span>
                      <strong style={{ fontSize: '1.05rem', color: '#ef4444', fontWeight: '800' }}>12.400 ₺</strong>
                      <div className="finance-bar-mock" style={{ marginTop: '8px' }}>
                        <div className="finance-bar-fill-expense"></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(124, 58, 237, 0.08)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(124, 58, 237, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'white' }}>Net Aylık Kâr</span>
                    <strong style={{ fontSize: '1.1rem', color: '#a78bfa', fontWeight: '900' }}>+35.850 ₺</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Randevu Simülatörü */}
      <section className="premium-simulator-section" style={{ padding: '5rem 2rem', background: '#0f172a', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div className="section-glow" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="section-heading" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="accent-label" style={{ color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>İNTERAKTİF RANDEVU SİMÜLATÖRÜ</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.5rem', marginBottom: '1rem', color: 'white' }}>Müşterilerinizin Yaşayacağı Kusursuz Rezervasyon Deneyimi</h2>
            <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>GlowCut, salonunuza özel online rezervasyon sayfası sunar. Aşağıdaki simülatörden bir müşteri gibi deneme yapın ve akıllı randevu oluşturma akışını görün.</p>
          </div>

          <div className="simulator-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            {/* Sol Seçim Alanı */}
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(10px)' }}>
              {/* Hizmet Seçimi */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Hizmet Seçin</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.entries(simServices).map(([key, service]) => (
                    <div 
                      key={key} 
                      onClick={() => { setSelectedSimService(key); setIsBooked(false); }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '1rem', 
                        borderRadius: '10px', 
                        border: '2px solid',
                        borderColor: selectedSimService === key ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                        background: selectedSimService === key ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.925rem' }}>{service.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Süre: {service.duration} Dk</span>
                      </div>
                      <span style={{ fontWeight: '800', color: 'var(--primary-color)', fontSize: '1.05rem' }}>{service.price} ₺</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stilist Seçimi */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. Stilist Seçin</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {Object.entries(simStylists).map(([key, stylist]) => (
                    <div 
                      key={key} 
                      onClick={() => { setSelectedSimStylist(key); setIsBooked(false); }}
                      style={{ 
                        flex: 1,
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        padding: '0.75rem', 
                        borderRadius: '10px', 
                        border: '2px solid',
                        borderColor: selectedSimStylist === key ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                        background: selectedSimStylist === key ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                        {stylist.avatar}
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{stylist.name}</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>{stylist.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saat Seçimi */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Saat Seçin</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {simTimes.map(t => (
                    <button 
                      key={t}
                      onClick={() => { setSelectedSimTime(t); setIsBooked(false); }}
                      style={{ 
                        padding: '0.45rem 1rem', 
                        borderRadius: '6px', 
                        border: '1px solid',
                        borderColor: selectedSimTime === t ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                        background: selectedSimTime === t ? 'var(--primary-color)' : 'transparent',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sağ Sonuç Bileti */}
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ borderBottom: '2px dashed rgba(255,255,255,0.08)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.78rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700' }}>RANDEVU BİLETİ</span>
                  <span style={{ fontSize: '0.78rem', background: '#22c55e', color: 'black', padding: '1px 8px', borderRadius: '4px', fontWeight: '700' }}>GLOWCUT ONAYLI</span>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem', color: 'white' }}>GlowCut Salon Rezervasyonu</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>GlowCut Akıllı Takvim Altyapısı</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1, marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>Seçilen Hizmet:</span>
                  <span style={{ fontWeight: '700', textAlign: 'right', color: 'white' }}>{simServices[selectedSimService].name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>Stilist:</span>
                  <span style={{ fontWeight: '700', color: 'white' }}>{simStylists[selectedSimStylist].name} ({simStylists[selectedSimStylist].role})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>Randevu Zamanı:</span>
                  <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>Bugün, Saat {selectedSimTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>Tahmini Süre:</span>
                  <span style={{ fontWeight: '700', color: 'white' }}>{simServices[selectedSimService].duration} Dakika</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: '700', color: 'white' }}>Toplam Tutar:</span>
                  <span style={{ fontWeight: '900', color: '#10b981' }}>{simServices[selectedSimService].price} ₺</span>
                </div>
              </div>

              {!isBooked ? (
                <button 
                  onClick={() => setIsBooked(true)}
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    borderRadius: '10px', 
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', 
                    color: 'white', 
                    fontWeight: '700', 
                    fontSize: '1rem', 
                    border: 'none', 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
                  }}
                >
                  Randevuyu Onayla
                </button>
              ) : (
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px dashed #22c55e', borderRadius: '10px', padding: '1rem', textAlign: 'center', animation: 'fadeIn 0.3s ease-out' }}>
                  <h4 style={{ color: '#22c55e', fontWeight: '800', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={18} /> Randevu Sabitlendi!
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                    Bu randevu anında GlowCut akıllı paneline işlendi ve stilistinizin takviminde kapatıldı. Randevu durumunu anlık olarak genel bakış panelinizden izleyebilirsiniz!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Müşteri Deneyimi Bölümü */}
      <section className="premium-client-experience-section" style={{ padding: '5rem 2rem', background: '#f8fafc', color: '#0f172a' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="section-heading" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="accent-label" style={{ color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>ZENGİN MÜŞTERİ DENEYİMİ</span>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.5rem', marginBottom: '1rem', color: '#0f172a' }}>Müşterilerinizi Özel Hissettirecek Premium Özellikler</h2>
            <p style={{ color: '#475569', maxWidth: '600px', margin: '0 auto' }}>GlowCut sadece bir iç yönetim ajandası değildir. Salonunuzun müşterilerine modern ve teknolojik bir deneyim sunarak sadakati artırır.</p>
          </div>

          <div className="experience-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', marginBottom: '1.25rem' }}>
                <CalendarDays size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.65rem', color: '#0f172a' }}>7/24 Çevrimiçi Randevu</h4>
              <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: '1.5', margin: 0, textAlign: 'left' }}>Müşterileriniz telefon aramalarıyla uğraşmadan, kendilerine özel link üzerinden istedikleri stilist ve saat dilimine anında randevu alabilirler.</p>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4', marginBottom: '1.25rem' }}>
                <TrendingUp size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.65rem', color: '#0f172a' }}>Finansal Gelir & Gider Takibi</h4>
              <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: '1.5', margin: 0, textAlign: 'left' }}>Salonunuzun tüm ciro, fatura, kira ve personel giderlerini tek panelden yönetin. Kategori bazlı özet grafiklerle kârlılık durumunuzu anlık izleyin.</p>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', marginBottom: '1.25rem' }}>
                <Heart size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.65rem', color: '#0f172a' }}>Kişisel Dijital Saç Defteri</h4>
              <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: '1.5', margin: 0, textAlign: 'left' }}>Müşterilerinizin saç analizlerini, saç boya karışım formüllerini ve geçmiş saç kesim fotoğraflarını sistemde saklayın. Onları her geldiklerinde şaşırtın.</p>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '1.25rem' }}>
                <Sparkles size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.65rem', color: '#0f172a' }}>Sadakat & Özel Kampanyalar</h4>
              <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: '1.5', margin: 0, textAlign: 'left' }}>Düzenli gelen müşterilerinize otomatik indirim puanları tanımlayın. Doğum günlerinde özel tebrik ve fön ikramı teklifleriyle bağınızı güçlendirin.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gelir Hesaplayıcı */}
      <section id="calculator" className="premium-calculator-section">
        <div className="section-glow"></div>
        <div className="calculator-container">
          <div className="calculator-header">
            <span className="accent-label">KAZANÇ & VERİMLİLİK HESAPLAYICI</span>
            <h2>GlowCut Salonunuza Ne Kadar Kazandırır?</h2>
            <p>Aylık ortalama randevu sayınızı ve ücretinizi girin, GlowCut ile kazanacağınız ek gelir ve zaman tasarrufunu anında görün.</p>
          </div>
          
          <div className="calculator-grid">
            <div className="calculator-inputs-card">
              <div className="slider-group">
                <div className="slider-labels">
                  <span>Aylık Toplam Randevu</span>
                  <strong>{appointmentCount} Randevu</strong>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="2000" 
                  step="50" 
                  value={appointmentCount} 
                  onChange={(e) => setAppointmentCount(parseInt(e.target.value))}
                  className="calculator-slider"
                />
                <div className="slider-limits">
                  <span>100</span>
                  <span>2000</span>
                </div>
              </div>
              
              <div className="slider-group">
                <div className="slider-labels">
                  <span>Ortalama Randevu Ücreti</span>
                  <strong>{averagePrice} ₺</strong>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="1500" 
                  step="25" 
                  value={averagePrice} 
                  onChange={(e) => setAveragePrice(parseInt(e.target.value))}
                  className="calculator-slider"
                />
                <div className="slider-limits">
                  <span>100 ₺</span>
                  <span>1500 ₺</span>
                </div>
              </div>
            </div>
            
            <div className="calculator-results-card">
              <div className="result-item">
                <div className="result-icon-box purple">
                  <TrendingUp size={24} />
                </div>
                <div className="result-text">
                  <span>Tahmini Aylık Ek Gelir</span>
                  <h3>{extraRevenue.toLocaleString('tr-TR')} ₺</h3>
                  <p>Çakışmaları önleyip optimal doluluk sağlayarak elde edeceğiniz kazanç artışı.</p>
                </div>
              </div>
              
              <div className="result-item">
                <div className="result-icon-box cyan">
                  <Activity size={24} />
                </div>
                <div className="result-text">
                  <span>Aylık Zaman Tasarrufu</span>
                  <h3>{hoursSaved} Saat</h3>
                  <p>Hızlı sürükle-bırak takvimi ve pratik CRM sayesinde kendinize ayıracağınız süre.</p>
                </div>
              </div>

              <div className="result-item">
                <div className="result-icon-box pink">
                  <Heart size={24} />
                </div>
                <div className="result-text">
                  <span>Müşteri Geri Dönüş Oranı</span>
                  <h3>+%20 Artış</h3>
                  <p>CRM notları ve kişiselleştirilmiş hizmet ile müşteri sadakatindeki yükseliş.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Neden GlowCut? */}
      <section id="why-glowcut" className="premium-benefits-section">
        <div className="section-heading">
          <span className="accent-label">NEDEN GLOWCUT?</span>
          <h2>Müşterilerinizi Özel Hissettirin, Salonunuzu Büyütün</h2>
          <p>Sadece randevuları yazmak yetmez. GlowCut, salon yönetimini bir deneyime dönüştürür.</p>
        </div>
        
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon"><Sparkles size={24} color="#7c3aed" /></div>
            <h4>Kişiselleştirilmiş CRM Ajandası</h4>
            <p>Müşterinizin boya kodunu, saç yapısını veya çay/kahve tercihini randevu oluştururken anında kaydedin. Bir sonraki gelişinde onu şaşırtın.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon"><Users size={24} color="#ec4899" /></div>
            <h4>Stilist Performans Kontrolü</h4>
            <p>Hangi stilistin bugün kaç müşterisi olduğunu ve ne kadar ciro ürettiğini raporlarda izleyin. Kadronuzu verimli şekilde yönetin.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon"><BarChart3 size={24} color="#06b6d4" /></div>
            <h4>Finansal Takip & Analitik</h4>
            <p>Her randevuda fiyat ve özel hizmet bilgilerini işleyerek gün sonunda ne kadar ciro elde ettiğinizi tek tıkla raporlayın.</p>
          </div>
        </div>
      </section>

      {/* Karşılaştırma Bölümü */}
      <section id="comparison" className="premium-comparison-section" style={{ padding: '6rem 2rem', background: '#ffffff', color: '#0f172a' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="section-heading" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span className="accent-label" style={{ color: 'var(--lp-primary)', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>KARŞILAŞTIRMA</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '0.5rem', marginBottom: '1rem', color: '#0f172a' }}>Neden Kağıt Ajanda Değil?</h2>
            <p style={{ color: '#475569', maxWidth: '600px', margin: '0 auto' }}>GlowCut'ın akıllı altyapısı ile geleneksel yöntemleri karşılaştırın, aradaki büyük farkı kendiniz görün.</p>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>ÖZELLİK</th>
                  <th className="glowcut-header">GLOWCUT AKILLI PANEL</th>
                  <th>KAĞIT DEFTER AJANDASI</th>
                  <th>STANDART TAKVİMLER</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '700' }}>Çakışma Koruması</td>
                  <td className="glowcut-cell"><CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> %100 Güvenli</td>
                  <td className="bad-cell">⚠️ Sürekli Çakışma Riski</td>
                  <td className="warning-cell">Kısmi (Elle Kontrol)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>Gelir & Gider Analizi</td>
                  <td className="glowcut-cell"><CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Otomatik & Canlı Rapor</td>
                  <td className="bad-cell">❌ Ay Sonu Elle Hesaplama</td>
                  <td className="bad-cell">❌ Yok</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>Müşteri Notları</td>
                  <td className="glowcut-cell"><CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Dijital & Arama Destekli</td>
                  <td className="bad-cell">❌ Sayfa Çevirerek Arama</td>
                  <td className="neutral-cell">Sadece İsim / Çok Sınırlı</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>Her Yerden Erişim</td>
                  <td className="glowcut-cell"><CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Bulut Tabanlı Mobil/Web</td>
                  <td className="bad-cell">❌ Sadece Salondaki Defter</td>
                  <td className="neutral-cell">Cihaz Senkronizeli</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '700' }}>Excel Raporlama & Aktarım</td>
                  <td className="glowcut-cell"><CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Tek Tıkla Detaylı Rapor</td>
                  <td className="bad-cell">❌ İmkansız / Manuel Kayıt</td>
                  <td className="bad-cell">❌ Dışarı Aktarılamaz</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Müşteri Yorumları & Hikayeleri */}
      <section id="testimonials" className="premium-testimonials-section">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="section-heading">
            <span className="accent-label">MUTLU SALON SAHİPLERİ</span>
            <h2>GlowCut Kullananlar Ne Diyor?</h2>
            <p>Türkiye genelinde yüzlerce salon sahibi, randevu karmaşasından kurtulup kârlılıklarını GlowCut ile artırdı.</p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-top">
                <div className="stars-container">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} size={14} className="star-icon-glow" />
                  ))}
                </div>
                <span className="testimonial-badge badge-revenue">📈 +%25 Ciro Artışı</span>
              </div>
              <p className="testimonial-quote">
                "GlowCut'a geçmeden önce defterdeki karalamalardan ve çift randevu çakışmalarından bıkmıştık. Sürükle-bırak takvimi o kadar kolay ki, tüm ekibimiz 1 günde alıştı. Aylık ciromuzda %25'lik net bir artış yakaladık!"
              </p>
              <div className="testimonial-user">
                <div className="testimonial-avatar avatar-purple-pink">MY</div>
                <div className="testimonial-meta">
                  <div className="user-name-wrapper">
                    <h4>Merve Yılmaz</h4>
                    <CheckCircle2 size={14} className="verified-badge-icon" />
                  </div>
                  <span>Merve Güzellik & Saç Tasarım, İzmir</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-top">
                <div className="stars-container">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} size={14} className="star-icon-glow" />
                  ))}
                </div>
                <span className="testimonial-badge badge-time">⚡ Günde 2 Saat Tasarruf</span>
              </div>
              <p className="testimonial-quote">
                "Gider paneli sayesinde nereye ne harcadığımızı tam olarak görebiliyoruz. Fatura ve masraf kaydetmek çok pratik. Ayrıca müşterilerimizin saç notlarını sistemde aratabilmek, o eski ajanda karmaşasını tamamen bitirdi."
              </p>
              <div className="testimonial-user">
                <div className="testimonial-avatar avatar-blue-cyan">OK</div>
                <div className="testimonial-meta">
                  <div className="user-name-wrapper">
                    <h4>Onur Kaya</h4>
                    <CheckCircle2 size={14} className="verified-badge-icon" />
                  </div>
                  <span>Attitude Studio, İstanbul</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-top">
                <div className="stars-container">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} size={14} className="star-icon-glow" />
                  ))}
                </div>
                <span className="testimonial-badge badge-satisfaction">🎯 %100 Memnuniyet</span>
              </div>
              <p className="testimonial-quote">
                "GlowCut'ın en sevdiğimiz tarafı mobilde mükemmel çalışması. Salonda olmasam bile telefonumdan o günkü stilist doluluk durumlarını, yapılan ödemeleri ve net kârlılığı canlı takip edebiliyorum. Kesinlikle tavsiye ederim."
              </p>
              <div className="testimonial-user">
                <div className="testimonial-avatar avatar-orange-green">BY</div>
                <div className="testimonial-meta">
                  <div className="user-name-wrapper">
                    <h4>Burak Yıldız</h4>
                    <CheckCircle2 size={14} className="verified-badge-icon" />
                  </div>
                  <span>Yıldız Barbershop, Ankara</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fiyatlandırma Bölümü */}
      <section id="pricing" className="premium-pricing-section">
        <div className="section-glow" style={{ position: 'absolute', top: '20%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        <div className="section-glow" style={{ position: 'absolute', bottom: '10%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="section-heading" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span className="accent-label" style={{ color: 'var(--lp-primary)', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>PLANLAR & FİYATLANDIRMA</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '0.5rem', marginBottom: '1rem', color: 'white' }}>Salonunuza En Uygun Planı Seçin</h2>
            <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>Hiçbir gizli ücret yok. İhtiyacınıza en uygun paketi seçin, dilediğiniz zaman iptal edin veya değiştirin.</p>
          </div>

          <div className="pricing-grid-3col">
            <div className="pricing-card-2">
              <div className="pricing-header">
                <h3>Demo Sürümü</h3>
                <p>Sistemi test etmek ve denemek isteyen salonlar için 14 günlük deneme sürümü.</p>
              </div>
              <div>
                <div className="pricing-price">
                  <span className="amount">0 ₺</span>
                  <span className="period">/ 14 Gün</span>
                </div>
                <ul className="pricing-features-list">
                  <li><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Maksimum 2 Stilist Tanımlama</li>
                  <li><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Temel Randevu Çizelgesi</li>
                  <li><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Detaylı Müşteri Notları</li>
                  <li className="disabled"><X size={16} style={{ color: '#ef4444' }} /> Gelişmiş Gelir & Gider Takibi</li>
                  <li className="disabled"><X size={16} style={{ color: '#ef4444' }} /> Excel ile Veri Dışa Aktarma</li>
                </ul>
              </div>
              <a href={demoMailto} className="pricing-btn">Ücretsiz Dene</a>
            </div>

            <div className="pricing-card-2">
              <div className="pricing-header">
                <h3>Standart Paket</h3>
                <p>Büyümekte olan, finansal takip dışındaki tüm planlama özelliklerine ihtiyaç duyan salonlar için.</p>
              </div>
              <div>
                <div className="pricing-price">
                  <span className="amount">1999 ₺</span>
                  <span className="period">/ aylık</span>
                </div>
                <ul className="pricing-features-list">
                  <li><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Sınırsız Randevu ve Stilist</li>
                  <li><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Gelişmiş Çakışma Koruması</li>
                  <li><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Detaylı Müşteri Notları & Geçmişi</li>
                  <li className="disabled"><X size={16} style={{ color: '#ef4444' }} /> Gelişmiş Gelir & Gider Takibi</li>
                  <li className="disabled"><X size={16} style={{ color: '#ef4444' }} /> Excel ile Veri Dışa Aktarma</li>
                </ul>
              </div>
              <a href={standartMailto} className="pricing-btn">Hemen Başla</a>
            </div>

            <div className="pricing-card-2 popular">
              <div style={{ position: 'absolute', top: '-15px', right: '20px', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px' }}>EN POPÜLER</div>
              <div className="pricing-header">
                <h3>Premium Paket</h3>
                <p>Tüm planlama, gelir-gider finans takibi ve detaylı raporlama özellikleriyle tam kapsamlı salon yönetimi.</p>
              </div>
              <div>
                <div className="pricing-price">
                  <span className="amount">3999 ₺</span>
                  <span className="period">/ aylık</span>
                </div>
                <ul className="pricing-features-list">
                  <li><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Sınırsız Randevu ve Stilist</li>
                  <li><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Gelişmiş Çakışma Koruması</li>
                  <li><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Detaylı Müşteri Notları & Geçmişi</li>
                  <li><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Gelir & Gider Finans Paneli</li>
                  <li><CheckCircle2 size={16} style={{ color: '#10b981' }} /> Excel Raporları & Analitik Grafikler</li>
                </ul>
              </div>
              <a href={premiumMailto} className="pricing-btn">Hemen Başla</a>
            </div>
          </div>
        </div>
      </section>

      {/* Sıkça Sorulan Sorular */}
      <section id="faq" className="premium-faq-section">
        <div className="faq-container">
          <div className="section-heading">
            <span className="accent-label">SSS</span>
            <h2>Sıkça Sorulan Sorular</h2>
            <p>GlowCut ile ilgili merak ettiğiniz soruların cevapları.</p>
          </div>
          
          <div className="faq-list">
            {[
              {
                q: "GlowCut'ı kullanmaya başlamak ne kadar sürer?",
                a: "Anında! GlowCut bulut tabanlı bir SaaS yazılımıdır. Giriş yaptığınız andan itibaren salonunuzu, stilistlerinizi ve müşterilerinizi tanımlayarak 1 dakika içinde randevu planlamaya başlayabilirsiniz."
              },
              {
                q: "Verilerimiz KVKK ile uyumlu şekilde korunuyor mu?",
                a: "Evet. Tüm verileriniz SSL/TLS şifrelemeli güvenli sunucularda saklanır. Müşteri bilgilerine ve geçmiş notlarına sadece sizin yetkilendirdiğiniz salon yöneticileri erişebilir."
              },
              {
                q: "Sürükle-bırak takvimi telefonda çalışır mı?",
                a: "Kesinlikle! GlowCut tamamen responsive (mobil uyumlu) tasarlanmıştır. Telefonunuzdan, tabletinizden veya bilgisayarınızdan takviminizi rahatça yönetebilirsiniz."
              },
              {
                q: "Müşteri özel notları nasıl kullanılır?",
                a: "Bir müşteriyi takvime sürüklediğinizde açılan modalda müşteri notu kısmına saç analizini, tercih ettiği boya markasını yazabilirsiniz. Bu notlar CRM veri tabanında saklanır."
              }
            ].map((item, idx) => (
              <div key={idx} className={`faq-item ${faqOpen[idx] ? 'open' : ''}`}>
                <button className="faq-question-btn" onClick={() => toggleFaq(idx)}>
                  <span>{item.q}</span>
                  {faqOpen[idx] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
