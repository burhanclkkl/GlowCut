import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { LayoutDashboard, Building2, Users, Calendar, Settings, Activity, LogOut, User, RefreshCw, AlertCircle, Zap, Shield, Search, X, Inbox, GripVertical, Edit, Moon, Sun, Maximize2, Minimize2, Download, ChevronLeft, ChevronRight, Clock, Building, Scissors, FileText, TrendingUp, Wallet, Lock, Crown, CheckCircle2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './AdminDashboard.css';

const hourlySlots = Array.from({ length: 24 }).map((_, i) => {
  const start = String(i).padStart(2, '0') + ':00';
  const end = String(i + 1 === 24 ? 0 : i + 1).padStart(2, '0') + ':00';
  return { start, end };
});

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    return tab || 'overview';
  });

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Müşteri CRM States
  const [customers, setCustomers] = useState([]);
  const [newCustFirstName, setNewCustFirstName] = useState('');
  const [newCustLastName, setNewCustLastName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');
  const [editingCust, setEditingCust] = useState(null); // { id, first_name, last_name, phone, notes, is_active }
  const [custFilter, setCustFilter] = useState('');

  // Pagination States
  const [custCurrentPage, setCustCurrentPage] = useState(1);
  const [logCurrentPage, setLogCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Bildirim mesajları
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success' or 'error'
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Hizmet form states
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptPrice, setNewDeptPrice] = useState('');
  const [editingDept, setEditingDept] = useState(null); // { id, name, price }

  // Stilist form states
  const [newEmpFirstName, setNewEmpFirstName] = useState('');
  const [newEmpLastName, setNewEmpLastName] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpDeptId, setNewEmpDeptId] = useState('');
  const [editingEmp, setEditingEmp] = useState(null); // { id, first_name, last_name, phone, department_id, is_active }

  // Randevu/Mola Şablonu form states
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateStart, setNewTemplateStart] = useState('09:00');
  const [newTemplateEnd, setNewTemplateEnd] = useState('17:00');
  const [editingTemplate, setEditingTemplate] = useState(null); // { id, name, start_time, end_time }

  // Filtre state'leri
  const [deptFilter, setDeptFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [logFilter, setLogFilter] = useState('');

  // Haftalık Planlayıcı Takvim State'i (Haftanın Pazartesi gününü tutar)
  const getMonday = (d) => {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi 1, Pazar 0'dır
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));

  // Özel Saatli Randevu Modalı State'i (Sürükle bırak sonrasında açılır)
  const [customShiftModal, setCustomShiftModal] = useState(null); // { employeeId, dateStr, startTime, endTime }
  const [customShiftError, setCustomShiftError] = useState(''); // Inline hata mesajı

  // Sürükle-bırak sırasında hangi hücrenin üzerinde olunduğunu tutan state
  const [dragOverCell, setDragOverCell] = useState(null); // { dateStr, templateId }

  // Hızlı şablon atama modal state'i
  const [templateAssignModal, setTemplateAssignModal] = useState(null); // { customerId, dateStr }
  const [templateStylistId, setTemplateStylistId] = useState('');
  const [templateServiceId, setTemplateServiceId] = useState('');

  // Randevu düzenleme ve detay görüntüleme modal state'leri
  const [editingShiftModal, setEditingShiftModal] = useState(null);
  const [viewingShiftModal, setViewingShiftModal] = useState(null);
  const [todayAppointmentModal, setTodayAppointmentModal] = useState(null); // Bugün çalışan stilistler detay modalı
  const [confirmModal, setConfirmModal] = useState(null);
  const [localPaidAmounts, setLocalPaidAmounts] = useState({});
  const [showNightHours, setShowNightHours] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [plannerEmpFilter, setPlannerEmpFilter] = useState('');
  const [plannerViewMode, setPlannerViewMode] = useState('weekly'); // 'weekly' | 'stylist'
  const [plannerSelectedDay, setPlannerSelectedDay] = useState(null); // dateStr for stylist view
  const [selectedStylistId, setSelectedStylistId] = useState('');
  const [profile, setProfile] = useState({ company_name: '', email: '', remaining_days: 0 });
  const [profileForm, setProfileForm] = useState({ company_name: '', new_password: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchProfile();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!selectedStylistId && employees.length > 0) {
      const firstActive = employees.find(e => e.is_active);
      if (firstActive) {
        setSelectedStylistId(String(firstActive.id));
      }
    }
  }, [employees, selectedStylistId]);

  useEffect(() => {
    if (templateAssignModal) {
      setTemplateStylistId(employees.length > 0 ? String(employees[0].id) : '');
      setTemplateServiceId(departments.length > 0 ? String(departments[0].id) : '');
    }
  }, [templateAssignModal, employees, departments]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setProfileForm({ company_name: data.company_name, new_password: '' });
      }
    } catch (error) {
      console.error("Profil yüklenirken hata:", error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
        fetchProfile();
        setProfileForm(prev => ({ ...prev, new_password: '' })); // Şifre alanını temizle
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Güncelleme başarısız.' });
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'Bağlantı hatası.' });
    }
    setProfileLoading(false);
  };

  const isPastDateTime = (dateStr, timeStr) => {
    if (!dateStr) return false;
    let dateTimeStr = dateStr;
    if (timeStr) {
      dateTimeStr += `T${timeStr}:00`;
    } else {
      dateTimeStr += 'T23:59:59';
    }
    const targetDate = new Date(dateTimeStr);
    const now = new Date();
    return targetDate < now;
  };

  const [resizingShift, setResizingShift] = useState(null); // { message, onConfirm } // { shiftId, employeeId, employeeName, dateStr, startTime, endTime }

  // Çıkış yapma
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // API veri yükleme metotları
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error("Hizmet kategorileri yüklenirken hata:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stylists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Map backend properties to match frontend usage
        const mappedData = data.map(e => ({
          ...e,
          phone_number: e.phone,
          department_name: e.service ? e.service.name : 'Hizmet Yok',
          department_id: e.service ? e.service.id : ''
        }));
        setEmployees(mappedData);
      }
    } catch (err) {
      console.error("Stilistler yüklenirken hata:", err);
    }
  };

  const fetchShiftTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointment-templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setShiftTemplates(data);
      }
    } catch (err) {
      console.error("Şablonlar yüklenirken hata:", err);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Backend returns start_datetime, we map to start_time for compatibility with frontend rendering code
        const mappedData = data.map(s => ({
          ...s,
          stylist_id: s.stylist_id || s.employee_id,
          employee_id: s.stylist_id || s.employee_id,
          start_time: s.start_datetime,
          end_time: s.end_datetime
        }));
        setShifts(mappedData);
      }
    } catch (err) {
      console.error("Randevular yüklenirken hata:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Loglar yüklenirken hata:", err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error("Müşteriler yüklenirken hata:", err);
    }
  };

  useEffect(() => {
    // Yetki kontrolü (admin veya super_admin olmalı)
    if (!token || (role !== 'admin' && role !== 'super_admin')) {
      navigate('/login');
      return;
    }

    const initData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDepartments(),
        fetchEmployees(),
        fetchCustomers(),
        fetchShiftTemplates(),
        fetchShifts(),
        fetchLogs()
      ]);
      setLoading(false);
    };

    initData();
  }, [token, role, navigate]);

  const showNotification = (msg, type = 'success') => {
    setMessageType(type);
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  // Haftanın günlerini hesapla
  const getDaysOfWeek = () => {
    const days = [];
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      
      const options = { day: 'numeric', month: 'short' };
      const formattedDate = date.toLocaleDateString('tr-TR', options);
      
      days.push({
        dayName: dayNames[i],
        dateStr,
        formattedDate
      });
    }
    return days;
  };

  // Önceki/Sonraki Hafta Butonları
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  // ==========================================
  // === DEPARTMAN EYLEMLERİ ==================
  // ==========================================
  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDeptName || !newDeptName.trim()) return;
     
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newDeptName.trim(),
          price: newDeptPrice ? parseFloat(newDeptPrice) : null
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Hizmet kategorisi başarıyla eklendi.");
        setNewDeptName('');
        setNewDeptPrice('');
        fetchDepartments();
        fetchLogs();
      } else {
        showNotification(data.error || "Hizmet kategorisi eklenemedi.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleUpdateDept = async (e) => {
    e.preventDefault();
    if (!editingDept.name.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/services/${editingDept.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: editingDept.name.trim(),
          price: editingDept.price ? parseFloat(editingDept.price) : null
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Hizmet kategorisi güncellendi.");
        setEditingDept(null);
        fetchDepartments();
        fetchLogs();
      } else {
        showNotification(data.error || "Güncelleme başarısız.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleDeleteDept = async (id) => {
    setConfirmModal({
      message: "Bu hizmet kategorisini silmek istediğinize emin misiniz? Bağlı stilistler de etkilenebilir!",
      onConfirm: async () => {
        try {
      const response = await fetch(`${API_BASE_URL}/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Hizmet kategorisi silindi.");
        fetchDepartments();
        fetchEmployees();
        fetchLogs();
      } else {
        showNotification(data.error || "Silme işlemi başarısız.", "error");
      }
        } catch (err) {
          showNotification("Bağlantı hatası oluştu.", "error");
        }
      }
    });
  };

  // ==========================================
  // === PERSONEL EYLEMLERİ ==================
  // ==========================================
  const handleAddEmp = async (e) => {
    e.preventDefault();
    if (!newEmpFirstName || !newEmpLastName || !newEmpDeptId) {
      showNotification("Lütfen ad, soyad ve hizmet kategorisi seçiniz.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stylists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: newEmpFirstName,
          last_name: newEmpLastName,
          phone: newEmpPhone || undefined,
          department_id: parseInt(newEmpDeptId)
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Yeni stilist sisteme eklendi.");
        setNewEmpFirstName('');
        setNewEmpLastName('');
        setNewEmpPhone('');
        setNewEmpDeptId('');
        fetchEmployees();
        fetchLogs();
      } else {
        showNotification(data.error || "Stilist eklenemedi.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleUpdateEmp = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stylists/${editingEmp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: editingEmp.first_name,
          last_name: editingEmp.last_name,
          phone: editingEmp.phone,
          department_id: parseInt(editingEmp.department_id),
          is_active: editingEmp.is_active
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Stilist bilgileri güncellendi.");
        setEditingEmp(null);
        fetchEmployees();
        fetchLogs();
      } else {
        showNotification(data.error || "Güncelleme başarısız.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleToggleEmpStatus = async (emp) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stylists/${emp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !emp.is_active })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification(`Stilist durumu güncellendi.`);
        fetchEmployees();
        fetchLogs();
      } else {
        showNotification(data.error || "İşlem başarısız.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleDeleteEmp = async (id) => {
    setConfirmModal({
      message: "Bu stilisti silmek istediğinize emin misiniz? Tüm randevu kayıtları da silinecektir!",
      onConfirm: async () => {
        try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stylists/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Stilist sistemden silindi.");
        fetchEmployees();
        fetchShifts();
        fetchLogs();
      } else {
        showNotification(data.error || "Silme işlemi başarısız.", "error");
      }
        } catch (err) {
          showNotification("Bağlantı hatası oluştu.", "error");
        }
      }
    });
  };

  // ==========================================
  // === MÜŞTERİ (CRM) EYLEMLERİ ==============
  // ==========================================
  const handleAddCust = async (e) => {
    e.preventDefault();
    if (!newCustFirstName || !newCustLastName) {
      showNotification("Lütfen müşteri ad ve soyadını giriniz.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: newCustFirstName,
          last_name: newCustLastName,
          phone: newCustPhone || undefined,
          notes: newCustNotes || undefined
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Yeni müşteri CRM'e eklendi.");
        setNewCustFirstName('');
        setNewCustLastName('');
        setNewCustPhone('');
        setNewCustNotes('');
        fetchCustomers();
        fetchLogs();
      } else {
        showNotification(data.error || "Müşteri eklenemedi.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleUpdateCust = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/customers/${editingCust.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: editingCust.first_name,
          last_name: editingCust.last_name,
          phone: editingCust.phone,
          notes: editingCust.notes,
          is_active: editingCust.is_active
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Müşteri bilgileri güncellendi.");
        setEditingCust(null);
        fetchCustomers();
        fetchLogs();
      } else {
        showNotification(data.error || "Güncelleme başarısız.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleToggleCustStatus = async (cust) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/customers/${cust.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !cust.is_active })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification(`Müşteri durumu güncellendi.`);
        fetchCustomers();
        fetchLogs();
      } else {
        showNotification(data.error || "İşlem başarısız.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleDeleteCust = async (id) => {
    setConfirmModal({
      message: "Bu müşteriyi silmek istediğinize emin misiniz? Bağlı randevu kayıtları da silinecektir!",
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/admin/customers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (response.ok) {
            showNotification("Müşteri sistemden silindi.");
            fetchCustomers();
            fetchShifts();
            fetchLogs();
          } else {
            showNotification(data.error || "Silme işlemi başarısız.", "error");
          }
        } catch (err) {
          showNotification("Bağlantı hatası oluştu.", "error");
        }
      }
    });
  };

  // ==========================================
  // === VARDİYA / ŞABLON EYLEMLERİ ===========
  // ==========================================
  const handleAddTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplateName) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointment-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newTemplateName,
          start_time: newTemplateStart,
          end_time: newTemplateEnd
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Randevu/mola şablonu oluşturuldu.");
        setNewTemplateName('');
        fetchShiftTemplates();
        fetchLogs();
      } else {
        showNotification(data.error || "Şablon oluşturulamadı.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleDeleteTemplate = async (id) => {
    setConfirmModal({
      message: "Bu şablonu silmek istediğinize emin misiniz?",
      onConfirm: async () => {
        try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointment-templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Randevu/mola şablonu silindi.");
        fetchShiftTemplates();
        fetchLogs();
      } else {
        showNotification(data.error || "Şablon silinemedi.", "error");
      }
        } catch (err) {
          showNotification("Bağlantı hatası oluştu.", "error");
        }
      }
    });
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointment-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          start_time: editingTemplate.start_time,
          end_time: editingTemplate.end_time,
        })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Şablon başarıyla güncellendi.");
        setEditingTemplate(null);
        fetchShiftTemplates();
      } else {
        showNotification(data.error || "Şablon güncellenemedi.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  // API Randevu Atama Ortak Metodu
  const assignShiftAPI = async (employeeId, customerId, serviceId, dateStr, startTime, endTime, price = '', notes = '') => {
    // Gece randevusu tarih hesabı
    const [startHour, startMin] = startTime.split(':');
    const [endHour, endMin] = endTime.split(':');

    const startDateTimeStr = `${dateStr} ${startTime}:00`;
    
    if (isPastDateTime(dateStr, startTime)) {
      showNotification("Geçmiş bir tarihe/saate randevu oluşturulamaz.", "error");
      return;
    }
    
    let [y, m, d] = dateStr.split('-').map(Number);
    let endDateObj = new Date(y, m - 1, d);

    if (
      parseInt(endHour) < parseInt(startHour) || 
      (parseInt(endHour) === parseInt(startHour) && parseInt(endMin) < parseInt(startMin))
    ) {
      endDateObj.setDate(endDateObj.getDate() + 1);
    }
    
    const endY = endDateObj.getFullYear();
    const endM = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endD = String(endDateObj.getDate()).padStart(2, '0');
    const endDateStr = `${endY}-${endM}-${endD}`;
    
    const endDateTimeStr = `${endDateStr} ${endTime}:00`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: parseInt(employeeId),
          customer_id: parseInt(customerId),
          service_id: serviceId ? parseInt(serviceId) : null,
          start_datetime: startDateTimeStr,
          end_datetime: endDateTimeStr,
          price: price ? parseFloat(price) : null,
          notes: notes
        })
      });

      const data = await response.json();
      if (response.ok) {
        showNotification("Randevu başarıyla oluşturuldu.");
        fetchShifts();
        fetchLogs();
      } else {
        showNotification(data.error || "Randevu oluşturulamadı.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleDeleteShift = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Randevu silindi.");
        fetchShifts();
        fetchLogs();
      } else {
        showNotification(data.error || "Silme işlemi başarısız.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  // ==========================================
  // === SÜRÜKLE BIRAK YARDIMCI METOTLARI =====
  // ==========================================
  const handleDragStart = (e, customerId) => {
    e.dataTransfer.setData("customerId", String(customerId));
    e.dataTransfer.effectAllowed = "move";
  };

  // Tarih ve saat stringlerini güvenle ayıklayan yardımcılar (crash-proof)
  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return '00:00';
    const cleanStr = String(dateTimeStr);
    const parts = cleanStr.split(/[ T]/);
    return parts[1] ? parts[1].substring(0, 5) : '00:00';
  };

  const formatDatePart = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const cleanStr = String(dateTimeStr);
    const parts = cleanStr.split(/[ T]/);
    return parts[0] || '';
  };

  const isSlotInShift = (sStart, sEnd, slotStart, slotEnd) => {
    const toMins = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    let start = toMins(sStart);
    let end = toMins(sEnd);
    let s_start = toMins(slotStart);
    let s_end = toMins(slotEnd);

    // Handle overnight shifts
    if (end < start) {
      end += 24 * 60;
    }
    if (s_end < s_start) {
      s_end += 24 * 60;
    }

    return start <= s_start && end >= s_end;
  };

  const handleDropEmployee = (e, dateStr, slot, forceStylistId = null) => {
    e.preventDefault();
    if (isPastDateTime(dateStr, slot.start)) {
      showNotification("Geçmiş bir tarihe/saate randevu oluşturulamaz.", "error");
      return;
    }
    const customerId = e.dataTransfer.getData("customerId");
    if (!customerId) return;

    const customer = customers.find(c => c.id === parseInt(customerId));
    if (!customer) return;

    const activeEmplList = employees.filter(emp => emp.is_active);
    setCustomShiftModal({
      customerId: parseInt(customerId),
      customerName: `${customer.first_name} ${customer.last_name}`,
      dateStr: dateStr,
      startTime: slot.start,
      endTime: slot.end,
      employeeId: forceStylistId || (activeEmplList.length > 0 ? String(activeEmplList[0].id) : ''),
      serviceId: '',
      price: '',
      notes: '',
      paymentStatus: 'Ödeme Bekleniyor',
      paymentType: '',
      paidAmount: 0.0
    });
  };


  // Zaman Çizelgesi Modeli İşlevleri
  const getShiftsStartingInHour = (dateStr, slot) => {
    return shifts.filter(s => {
      const sStart = formatTime(s.start_time);
      const sEnd = formatTime(s.end_time);
      const startDateStr = formatDatePart(s.start_time);
      const sHour = sStart.split(':')[0];
      const slotHour = slot.start.split(':')[0];
      
      // Durum 1: Randevu bu tarihte ve saatte başlıyor
      if (startDateStr === dateStr && sHour === slotHour) {
        return true;
      }
      
      // Durum 2: Önceki gün başlayıp gece yarısını geçen randevu (Ertesi günün 00:00 slotunda çizilir)
      if (slotHour === '00' && startDateStr !== dateStr) {
        let startDt = new Date(`${startDateStr}T00:00:00Z`);
        startDt.setUTCDate(startDt.getUTCDate() + 1);
        const nextDayStr = startDt.toISOString().split('T')[0];
        
        if (nextDayStr === dateStr) {
           const startParts = sStart.split(':').map(Number);
           const endParts = sEnd.split(':').map(Number);
           let startMins = startParts[0] * 60 + startParts[1];
           let endMins = endParts[0] * 60 + endParts[1];
           if (endMins <= startMins && endMins !== 0) {
              return true; // Geceyi geçmiş
           }
        }
      }
      return false;
    });
  };

  const calculateDayOverlaps = (shiftsForDay) => {
    if (!shiftsForDay || shiftsForDay.length === 0) return {};
    
    const parseTime = (timeStr) => {
      const parts = timeStr.split(':').map(Number);
      return parts[0] * 60 + parts[1];
    };
    
    const parsedShifts = shiftsForDay.map(s => {
      const startStr = s.start_time.includes(' ') ? s.start_time.split(' ')[1] : s.start_time;
      const endStr = s.end_time.includes(' ') ? s.end_time.split(' ')[1] : s.end_time;
      let startMins = parseTime(startStr);
      let endMins = parseTime(endStr);
      if (endMins <= startMins) endMins += 24 * 60; // cross midnight
      return { ...s, startMins, endMins };
    }).sort((a, b) => a.startMins - b.startMins || a.endMins - b.endMins);

    const placements = {};
    let currentCluster = [];
    let clusterEnd = 0;

    const processCluster = (cluster) => {
      const columns = [];
      cluster.forEach(shift => {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i];
          const lastShiftInCol = col[col.length - 1];
          // Allow edges to touch without triggering an overlap (<= instead of <)
          if (lastShiftInCol.endMins <= shift.startMins) {
            col.push(shift);
            placements[shift.id] = { index: i };
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([shift]);
          placements[shift.id] = { index: columns.length - 1 };
        }
      });
      const count = columns.length;
      cluster.forEach(shift => {
        placements[shift.id].count = count;
      });
    };

    parsedShifts.forEach(shift => {
      if (currentCluster.length === 0) {
        currentCluster.push(shift);
        clusterEnd = shift.endMins;
      } else {
        if (shift.startMins < clusterEnd) {
          currentCluster.push(shift);
          if (shift.endMins > clusterEnd) {
            clusterEnd = shift.endMins;
          }
        } else {
          processCluster(currentCluster);
          currentCluster = [shift];
          clusterEnd = shift.endMins;
        }
      }
    });

    if (currentCluster.length > 0) {
      processCluster(currentCluster);
    }
    return placements;
  };

  const getShiftBlockStyle = (shift, overlappingCount, index, currentDayStr) => {
    const startDateStr = formatDatePart(shift.start_time);
    const isContinuation = startDateStr !== currentDayStr;
    
    const sStart = formatTime(shift.start_time);
    const sEnd = formatTime(shift.end_time);
    
    const startParts = sStart.split(':').map(Number);
    const endParts = sEnd.split(':').map(Number);
    
    let startMins = startParts[0] * 60 + startParts[1];
    let endMins = endParts[0] * 60 + endParts[1];
    
    if (endMins <= startMins && endMins !== 0) {
      endMins += 24 * 60;
    }
    
    const pixelsPerMinute = 1.0; // 1 saat = 60px => 1dk = 1.0px
    let topOffset = 0;
    let height = 0;
    
    if (!isContinuation) {
      topOffset = startParts[1] * pixelsPerMinute;
      let durationMins = endMins - startMins;
      let maxVisibleMins = (24 * 60) - startMins;
      let visibleDurationMins = Math.min(durationMins, maxVisibleMins);
      height = visibleDurationMins * pixelsPerMinute;
      
      if (resizingShift && resizingShift.id === shift.id) {
         if (resizingShift.direction === 'top') {
            let diff = resizingShift.currentHeight - resizingShift.initialHeight;
            topOffset = topOffset - diff;
            if (topOffset < -startMins * pixelsPerMinute) {
               topOffset = -startMins * pixelsPerMinute;
            }
            height = resizingShift.currentHeight;
         } else {
            let currentDuration = Math.max(15, Math.round(resizingShift.currentHeight / pixelsPerMinute));
            height = Math.min(currentDuration, maxVisibleMins) * pixelsPerMinute;
         }
      }
    } else {
      topOffset = 0; // 00:00 slotundan başlar
      let remainingMins = endMins - (24 * 60);
      height = remainingMins * pixelsPerMinute;
      
      if (resizingShift && resizingShift.id === shift.id) {
         if (resizingShift.direction === 'bottom') {
            let currentDuration = Math.max(15, Math.round(resizingShift.currentHeight / pixelsPerMinute));
            let newEndMins = startMins + currentDuration;
            if (newEndMins > 24 * 60) {
                height = (newEndMins - 24 * 60) * pixelsPerMinute;
            } else {
                height = 0; // Artık ertesi güne sarkmıyor
            }
         }
      }
    }
    
    const hue = ((shift.stylist_id || shift.employee_id) * 137.5) % 360;
    const backgroundColor = `hsl(${hue}, 75%, 92%)`;
    const borderColor = `hsl(${hue}, 70%, 65%)`;
    
    const widthPercent = 100 / (overlappingCount || 1);
    const leftPercent = index * widthPercent;
    
    return {
      top: `${topOffset + 1}px`,
      height: `${Math.max(15, height - 2)}px`,
      width: overlappingCount > 1 ? `calc(${widthPercent}% - 4px)` : 'calc(100% - 2px)',
      left: overlappingCount > 1 ? `calc(${leftPercent}% + 2px)` : '1px',
      backgroundColor,
      borderLeftColor: borderColor,
      opacity: isContinuation ? 0.85 : 1 // Sarkan kısım biraz daha saydam
    };
  };

    const handleContextMenu = (e, shift) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      shift: shift
    });
  };

  // Tıklamayla menüyü kapat
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleResizeStart = (e, shift, currentDayStr, direction = 'bottom') => {
    e.stopPropagation();
    setResizingShift({
      id: shift.id,
      startY: e.clientY,
      initialHeight: parseInt(getShiftBlockStyle(shift, 1, 0, currentDayStr).height),
      currentHeight: parseInt(getShiftBlockStyle(shift, 1, 0, currentDayStr).height),
      pixelsPerMinute: 1.0,
      direction: direction
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizingShift) return;
      const deltaY = e.clientY - resizingShift.startY;
      let newHeight;
      if (resizingShift.direction === 'bottom') {
         newHeight = Math.max(30, resizingShift.initialHeight + deltaY); // Min 15 dk
      } else {
         newHeight = Math.max(30, resizingShift.initialHeight - deltaY);
      }
      setResizingShift(prev => ({ ...prev, currentHeight: newHeight }));
    };

    const handleMouseUp = async () => {
      if (!resizingShift) return;
      const shift = shifts.find(s => s.id === resizingShift.id);
      if (shift) {
         const newDurationMins = Math.round(resizingShift.currentHeight / resizingShift.pixelsPerMinute);
         
         const sStart = formatTime(shift.start_time);
         const startParts = sStart.split(':').map(Number);
         let startMins = startParts[0] * 60 + startParts[1];
         
         const sEnd = formatTime(shift.end_time);
         const endParts = sEnd.split(':').map(Number);
         let endMins = endParts[0] * 60 + endParts[1];
         if (endMins <= startMins) endMins += 24 * 60; // handle cross midnight
         
         let newStartDatetimeStr = shift.start_time;
         let newEndDatetimeStr = shift.end_time;
         
         const startDatePart = shift.start_time.split(/[ T]/)[0];
         
         if (resizingShift.direction === 'bottom') {
             let newEndMins = startMins + newDurationMins;
             let newDateStr = startDatePart;
             
             if (newEndMins >= 24 * 60) {
                 newEndMins -= 24 * 60;
                 let targetDate = new Date(`${startDatePart}T00:00:00Z`);
                 targetDate.setUTCDate(targetDate.getUTCDate() + 1);
                 newDateStr = targetDate.toISOString().split('T')[0];
             }
             const newEndHour = String(Math.floor(newEndMins / 60)).padStart(2, '0');
             const newEndMin = String(newEndMins % 60).padStart(2, '0');
             newEndDatetimeStr = `${newDateStr} ${newEndHour}:${newEndMin}:00`;
         } else {
             // Resizing from top
             let newStartMins = endMins - newDurationMins;
             if (newStartMins < 0) newStartMins = 0; // limit at 00:00 today
             
             const newStartHour = String(Math.floor(newStartMins / 60)).padStart(2, '0');
             const newStartMin = String(newStartMins % 60).padStart(2, '0');
             newStartDatetimeStr = `${startDatePart} ${newStartHour}:${newStartMin}:00`;
         }
         
         try {
            const response = await fetch(`${API_BASE_URL}/api/admin/appointments/${shift.id}`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                start_datetime: newStartDatetimeStr, 
                end_datetime: newEndDatetimeStr 
              })
            });
            if (response.ok) {
               showNotification("Randevu süresi güncellendi.");
               fetchShifts(); 
               fetchLogs();
            } else {
               const errData = await response.json();
               showNotification(errData.error || "Süre güncellenemedi.", "error");
            }
         } catch (e) {
            showNotification("Bağlantı hatası.", "error");
         }
      }
      setResizingShift(null);
    };

    if (resizingShift) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingShift, shifts, token]);

  // Belirli Hücreye ait Atanmış Randevuları Getir (ESKİ)

  const getShiftsForCell = (dateStr, slot) => {
    return shifts.filter(s => {
      const sDate = formatDatePart(s.start_time);
      if (sDate !== dateStr) return false;

      const sStart = formatTime(s.start_time);
      const sEnd = formatTime(s.end_time);

      return isSlotInShift(sStart, sEnd, slot.start, slot.end);
    });
  };

  // Özel Saatli Randevu Form Gönderimi
  const handleCustomShiftSubmit = async (e) => {
    e.preventDefault();
    if (!customShiftModal) return;

    if (isPastDateTime(customShiftModal.dateStr, customShiftModal.startTime)) {
      setCustomShiftError("Geçmiş bir tarihe/saate randevu oluşturulamaz.");
      return;
    }

    if (!customShiftModal.employeeId) {
      setCustomShiftError("Lütfen bir stilist seçiniz.");
      return;
    }

    if (customShiftModal.paymentStatus === 'Kısmi Ödeme') {
      const priceVal = parseFloat(customShiftModal.price) || 0;
      const paidVal = parseFloat(customShiftModal.paidAmount) || 0;
      if (paidVal < 0) {
        setCustomShiftError("Ödenen tutar 0'dan küçük olamaz.");
        return;
      }
      if (paidVal > priceVal) {
        setCustomShiftError(`Ödenen tutar toplam fiyattan (${priceVal} ₺) fazla olamaz.`);
        return;
      }
    }

    // Validate start time < end time (unless crossing midnight)
    const [sh, sm] = customShiftModal.startTime.split(':').map(Number);
    const [eh, em] = customShiftModal.endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    if (startMins === endMins) {
      setCustomShiftError("Başlangıç ve bitiş saati aynı olamaz.");
      return;
    }

    setCustomShiftError(''); // Önceki hatayı temizle
    const modalSnapshot = { ...customShiftModal };

    try {
      const [startHour, startMin] = modalSnapshot.startTime.split(':');
      const [endHour, endMin] = modalSnapshot.endTime.split(':');
      const startDateTimeStr = `${modalSnapshot.dateStr} ${modalSnapshot.startTime}:00`;

      let [y, m, d] = modalSnapshot.dateStr.split('-').map(Number);
      let endDateObj = new Date(y, m - 1, d);
      if (
        parseInt(endHour) < parseInt(startHour) ||
        (parseInt(endHour) === parseInt(startHour) && parseInt(endMin) < parseInt(startMin))
      ) {
        endDateObj.setDate(endDateObj.getDate() + 1);
      }
      const endY = endDateObj.getFullYear();
      const endM = String(endDateObj.getMonth() + 1).padStart(2, '0');
      const endD = String(endDateObj.getDate()).padStart(2, '0');
      const endDateStr = `${endY}-${endM}-${endD}`;
      const endDateTimeStr = `${endDateStr} ${modalSnapshot.endTime}:00`;

      const response = await fetch(`${API_BASE_URL}/api/admin/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: parseInt(modalSnapshot.employeeId),
          customer_id: parseInt(modalSnapshot.customerId),
          service_id: modalSnapshot.serviceId ? parseInt(modalSnapshot.serviceId) : null,
          start_datetime: startDateTimeStr,
          end_datetime: endDateTimeStr,
          price: modalSnapshot.price ? parseFloat(modalSnapshot.price) : null,
          notes: modalSnapshot.notes,
          payment_status: modalSnapshot.paymentStatus || 'Ödeme Bekleniyor',
          payment_type: modalSnapshot.paymentType || null,
          paid_amount: modalSnapshot.paymentStatus === 'Kısmi Ödeme' ? (parseFloat(modalSnapshot.paidAmount) || 0.0) : (modalSnapshot.paymentStatus === 'Ödendi' ? (parseFloat(modalSnapshot.price) || 0.0) : 0.0)
        })
      });

      const data = await response.json();
      if (response.ok) {
        showNotification("Randevu başarıyla oluşturuldu.");
        setCustomShiftModal(null);
        setCustomShiftError('');
        fetchShifts();
        fetchLogs();
      } else {
        setCustomShiftError(data.error || "Randevu oluşturulamadı.");
      }
    } catch (err) {
      setCustomShiftError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    }
  };

  // Metrikler
  const _today = new Date();
  const todayStr = _today.getFullYear() + '-' + String(_today.getMonth() + 1).padStart(2, '0') + '-' + String(_today.getDate()).padStart(2, '0');
  const totalDepts = departments.length;
  const totalEmps = employees.length;
  const activeEmps = employees.filter(e => e.is_active).length;
  const activeShiftsToday = shifts.filter(s => formatDatePart(s.start_time) === todayStr);
  const totalCustomers = customers.length;

  const todayActiveShifts = activeShiftsToday.filter(s => s.status !== 'cancelled');
  const todayTotalCiro = todayActiveShifts.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);
  const todayCollected = todayActiveShifts.reduce((acc, s) => {
    if (s.payment_status === 'Ödendi') {
      return acc + (parseFloat(s.price) || 0);
    } else if (s.payment_status === 'Kısmi Ödeme') {
      return acc + (parseFloat(s.paid_amount) || 0);
    }
    return acc;
  }, 0);
  const todayPendingShifts = todayActiveShifts.filter(s => s.status === 'pending' || s.status === 'confirmed').length;
  const todayCompletedShifts = todayActiveShifts.filter(s => s.status === 'completed').length;

  // --- RENDERING TABS ---

  // Sekme 1: Genel Bakış
  const renderOverview = () => (
    <div className="overview-tab">
      <section className="metrics-grid">
        {/* Bugünkü Ciro */}
        <div className="metric-card">
          <div className="metric-icon purple">
            <TrendingUp size={20} />
          </div>
          <div className="metric-info">
            <h3>Bugünkü Tahmini Ciro</h3>
            <p className="metric-number">{todayTotalCiro.toFixed(2)} ₺</p>
            <span className="metric-desc">Toplam randevu bedeli</span>
          </div>
        </div>

        {/* Bugünkü Tahsilat */}
        <div className="metric-card">
          <div className="metric-icon green">
            <Wallet size={20} />
          </div>
          <div className="metric-info">
            <h3>Bugünkü Tahsilat</h3>
            <p className="metric-number">{todayCollected.toFixed(2)} ₺</p>
            <span className="metric-desc">Kısmi ve tam ödemeler dahil</span>
          </div>
        </div>

        {/* Bugünkü Randevular */}
        <div className="metric-card">
          <div className="metric-icon blue">
            <Calendar size={20} />
          </div>
          <div className="metric-info">
            <h3>Bugünkü Aktif Randevular</h3>
            <p className="metric-number">{todayActiveShifts.length} Randevu</p>
            <span className="metric-desc">{todayPendingShifts} bekleyen, {todayCompletedShifts} tamamlanan</span>
          </div>
        </div>

        {/* Müşteri CRM */}
        <div className="metric-card">
          <div className="metric-icon orange">
            <Users size={20} />
          </div>
          <div className="metric-info">
            <h3>Müşteri Portföyü</h3>
            <p className="metric-number">{totalCustomers} Müşteri</p>
            <span className="metric-desc">Toplam kayıtlı CRM kaydı</span>
          </div>
        </div>

        {/* Stilist Kadrosu */}
        <div className="metric-card">
          <div className="metric-icon red">
            <Scissors size={20} />
          </div>
          <div className="metric-info">
            <h3>Stilist Kadrosu</h3>
            <p className="metric-number">{activeEmps} / {totalEmps}</p>
            <span className="metric-desc">Görev başındaki aktif stilistler</span>
          </div>
        </div>
      </section>

      <div className="overview-summary-grid">
        <div className="summary-card expiring-card">
          <div className="summary-card-header-modern">
            <div className="icon-wrapper">
              <Calendar size={18} className="text-blue-500" />
            </div>
            <h3>Bugün Çalışan Stilistler <span className="date-badge">{todayStr}</span></h3>
          </div>
          
          <div className="overview-today-summary-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '0.65rem 1rem', background: 'var(--bg-dark-soft)', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.78rem', fontWeight: '700', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Özet:</span>
            <span style={{ color: 'var(--primary-color)', background: 'rgba(124, 58, 237, 0.08)', padding: '2px 8px', borderRadius: '12px' }}>{activeShiftsToday.filter(s => s.status !== 'cancelled').length} Aktif Randevu</span>
            <span style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '12px' }}>{activeShiftsToday.filter(s => s.status === 'completed' || s.payment_status === 'Ödendi').length} Tamamlanan</span>
            <span style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.08)', padding: '2px 8px', borderRadius: '12px' }}>{activeShiftsToday.filter(s => s.status === 'cancelled').length} İptal</span>
          </div>

          {employees.filter(e => e.is_active).length > 0 ? (
            <div className="today-shifts-modern-list">
              {employees.filter(e => e.is_active).map(emp => {
                const empShiftsToday = activeShiftsToday.filter(s => s.stylist_id === emp.id || s.employee_id === emp.id);
                const activeEmpShifts = empShiftsToday.filter(s => s.status !== 'cancelled');
                return (
                  <div key={emp.id} className={`modern-shift-item ${empShiftsToday.length > 0 ? 'has-shifts' : 'no-shifts'}`}>
                    <div className="shift-emp-info">
                      <div className={`emp-avatar-small ${activeEmpShifts.length > 0 ? 'active-avatar' : 'inactive-avatar'}`}>
                        {emp.first_name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="emp-name" style={{ fontWeight: '700' }}>{emp.first_name} {emp.last_name}</span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: activeEmpShifts.length > 0 ? 'rgba(124, 58, 237, 0.1)' : '#f1f5f9',
                            color: activeEmpShifts.length > 0 ? 'var(--primary-color)' : 'var(--text-muted)'
                          }}>
                            {activeEmpShifts.length > 0 ? `${activeEmpShifts.length} Randevu` : 'Randevu Yok'}
                          </span>
                        </div>
                        {(() => {
                          const servicesToday = Array.from(new Set(
                            activeEmpShifts.map(s => s.service_name).filter(Boolean)
                          ));
                          if (servicesToday.length > 0) {
                            return (
                              <span style={{ fontSize: '0.7rem', opacity: 0.8, color: 'var(--primary-color)', fontWeight: '600' }}>
                                Hizmetler: {servicesToday.join(', ')}
                              </span>
                            );
                          }
                          return emp.department_name && (
                            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                              {emp.department_name}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                      {empShiftsToday.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'flex-end' }}>
                          {empShiftsToday.map(s => (
                            <div 
                              key={s.id} 
                              className="shift-time-badge-pill"
                              style={{ 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '600',
                                border: '1px solid',
                                background: s.status === 'cancelled' ? 'rgba(239, 68, 68, 0.06)' : (s.payment_status === 'Ödendi' || s.status === 'completed' ? 'rgba(16, 185, 129, 0.06)' : (s.payment_status === 'Kısmi Ödeme' ? 'rgba(245, 158, 11, 0.06)' : 'rgba(124, 58, 237, 0.06)')),
                                color: s.status === 'cancelled' ? '#ef4444' : (s.payment_status === 'Ödendi' || s.status === 'completed' ? '#10b981' : (s.payment_status === 'Kısmi Ödeme' ? '#f59e0b' : '#7c3aed')),
                                borderColor: s.status === 'cancelled' ? 'rgba(239, 68, 68, 0.15)' : (s.payment_status === 'Ödendi' || s.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : (s.payment_status === 'Kısmi Ödeme' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(124, 58, 237, 0.15)')),
                                textDecoration: s.status === 'cancelled' ? 'line-through' : 'none'
                              }}
                              onClick={() => setTodayAppointmentModal({ shift: s, stylist: emp })}
                              title={s.status === 'cancelled' ? 'Randevu İptal Edildi' : `${s.customer_name} • ${s.service_name || 'Hizmet Belirtilmedi'}`}
                            >
                              <Clock size={10} />
                              {formatTime(s.start_time)} - {formatTime(s.end_time)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Randevu yok</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-shifts-state">
              <div className="empty-icon-circle">
                <Inbox size={24} />
              </div>
              <p>Sistemde kayıtlı aktif stilist bulunmamaktadır.</p>
              <span className="empty-hint">Stilistler sekmesinden yeni stilist ekleyebilirsiniz.</span>
            </div>
          )}
        </div>

        <div className="summary-card stats-summary-card">
          <h3>Hızlı Planlama Aksiyonları</h3>
          <div className="quick-actions-list">
            <button onClick={() => setActiveTab('shifts')} className="quick-action-btn primary-action">
              Sürükle-Bırak Randevu Planlama
            </button>
            <button onClick={() => setActiveTab('employees')} className="quick-action-btn secondary-action">
              Yeni Stilist Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Sekme 2: Hizmet Kategorileri
  const renderDepartments = () => (
    <div className="departments-tab-container">
      <div className="admin-grid-layout">
        {/* Sol Kolon: Hizmet Kategorisi Ekleme */}
        <section className="add-company-section">
          <h2>Hizmet Kategorisi Ekle</h2>
          <p className="form-description">Sistemde stilist gruplayabileceğiniz yeni hizmet kategorileri tanımlayın.</p>
          <form onSubmit={handleAddDept} className="add-company-form">
            <div className="form-group">
              <label>Hizmet Kategorisi Adı</label>
              <input 
                type="text" 
                placeholder="Örn: Saç Boyama, Keratin, Manikür" 
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Varsayılan Fiyat (₺) - İsteğe Bağlı</label>
              <input 
                type="number" 
                placeholder="Örn: 150.00" 
                step="0.01"
                min="0"
                value={newDeptPrice}
                onChange={(e) => setNewDeptPrice(e.target.value)}
              />
            </div>
            <button type="submit" className="create-company-btn">Ekle</button>
          </form>
        </section>

        {/* Sağ Kolon: Hizmet Kategorisi Listesi */}
        <section className="companies-list-section">
          <div className="section-title-row">
            <h2>Hizmet Kategorileri</h2>
            <span className="list-count">{totalDepts} Tanımlı</span>
          </div>
          <div className="list-filter-bar">
            <span className="filter-icon"><Search size={16} /></span>
            <input
              type="text"
              className="list-filter-input"
              placeholder="Hizmet kategorisi adına göre ara..."
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            />
            {deptFilter && (
              <button className="filter-clear-btn" onClick={() => setDeptFilter('')}><X size={14} /></button>
            )}
          </div>
          <div className="companies-table-container">
            <table className="companies-table">
              <thead>
                <tr>
                  <th>Hizmet Kategorisi Adı</th>
                  <th>Varsayılan Fiyat</th>
                  <th>Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {departments.filter(d => d.name.toLowerCase().includes(deptFilter.toLowerCase())).length > 0 ? (
                  departments.filter(d => d.name.toLowerCase().includes(deptFilter.toLowerCase())).map(d => (
                    <tr key={d.id}>
                      <td>
                        <span className="comp-title">{d.name}</span>
                      </td>
                      <td>
                        <span className="comp-title">{d.price ? d.price + ' ₺' : '-'}</span>
                      </td>
                      <td>
                        <div className="row-actions-group">
                          <button 
                            onClick={() => setEditingDept({ id: d.id, name: d.name, price: d.price || '' })} 
                            className="action-btn-small edit-btn"
                          >
                            Düzenle
                          </button>
                          <button 
                            onClick={() => handleDeleteDept(d.id)} 
                            className="action-btn-small freeze"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="no-logs">{deptFilter ? 'Arama sonucu bulunamadı.' : 'Tanımlanmış hizmet kategorisi bulunmamaktadır.'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );

  // Sekme 3: Stilistler
  const renderEmployees = () => (
    <div className="employees-tab-container">
      <div className="admin-grid-layout">
        {/* Sol Kolon: Stilist Ekle */}
        <section className="add-company-section">
          <h2>Yeni Stilist Ekle</h2>
          <p className="form-description">Salonunuza yeni bir stilist tanımlayarak randevu oluşturmaya başlayın.</p>
          <form onSubmit={handleAddEmp} className="add-company-form">
            <div className="form-group">
              <label>Adı</label>
              <input 
                type="text" 
                placeholder="Örn: Ahmet" 
                value={newEmpFirstName}
                onChange={(e) => setNewEmpFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Soyadı</label>
              <input 
                type="text" 
                placeholder="Örn: Yılmaz" 
                value={newEmpLastName}
                onChange={(e) => setNewEmpLastName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Telefon Numarası</label>
              <input 
                type="text" 
                placeholder="Örn: 05551112233" 
                value={newEmpPhone}
                onChange={(e) => setNewEmpPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Hizmet Kategorisi</label>
              <select 
                value={newEmpDeptId} 
                onChange={(e) => setNewEmpDeptId(e.target.value)}
                required
              >
                <option value="">Seçiniz...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="create-company-btn">Stilist Ekle</button>
          </form>
        </section>

        {/* Sağ Kolon: Stilist Listesi */}
        <section className="companies-list-section">
          <div className="section-title-row">
            <h2>Stilistler</h2>
            <span className="list-count">{totalEmps} Kayıtlı</span>
          </div>
          <div className="list-filter-bar">
            <span className="filter-icon"><Search size={16} /></span>
            <input
              type="text"
              className="list-filter-input"
              placeholder="Ad, soyad veya telefon ara..."
              value={empFilter}
              onChange={e => setEmpFilter(e.target.value)}
            />
            {empFilter && (
              <button className="filter-clear-btn" onClick={() => setEmpFilter('')}><X size={14} /></button>
            )}
            <select
              className="list-filter-select"
              value={empDeptFilter}
              onChange={e => setEmpDeptFilter(e.target.value)}
            >
              <option value="">Tüm Hizmet Kategorileri</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="companies-table-container">
            <table className="companies-table">
              <thead>
                <tr>
                  <th>Ad Soyad / Telefon</th>
                  <th>Hizmet</th>
                  <th>Durum</th>
                  <th>Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {employees
                  .filter(emp => {
                    const q = empFilter.toLowerCase();
                    const matchText = !q ||
                      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) ||
                      (emp.phone_number || '').includes(q);
                    const matchDept = !empDeptFilter || (emp.department_name || '') === empDeptFilter;
                    return matchText && matchDept;
                  }).length > 0 ? (
                  employees
                    .filter(emp => {
                      const q = empFilter.toLowerCase();
                      const matchText = !q ||
                        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) ||
                        (emp.phone_number || '').includes(q);
                      const matchDept = !empDeptFilter || (emp.department_name || '') === empDeptFilter;
                      return matchText && matchDept;
                    })
                    .map(emp => (
                    <tr key={emp.id} className={!emp.is_active ? 'row-frozen' : ''}>
                      <td>
                        <div className="company-meta">
                          <span className="comp-title">{emp.first_name} {emp.last_name}</span>
                          <span className="comp-email">{emp.phone_number || 'Telefon girilmedi'}</span>
                        </div>
                      </td>
                      <td>{emp.department_name || 'Hizmet Yok'}</td>
                      <td>
                        <span className={`status-badge ${emp.is_active ? 'active' : 'frozen'}`}>
                          {emp.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions-group">
                          <button 
                            onClick={() => handleToggleEmpStatus(emp)} 
                            className={`action-btn-small ${emp.is_active ? 'freeze' : 'activate'}`}
                          >
                            {emp.is_active ? 'Pasif Et' : 'Aktif Et'}
                          </button>
                          <button 
                            onClick={() => setEditingEmp({ ...emp })} 
                            className="action-btn-small edit-btn"
                          >
                            Düzenle
                          </button>
                          <button 
                            onClick={() => handleDeleteEmp(emp.id)} 
                            className="action-btn-small freeze"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-logs">{empFilter || empDeptFilter ? 'Arama sonucu bulunamadı.' : 'Kayıtlı stilist bulunmamaktadır.'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );

  // Sekme 3.5: Müşteriler
  const renderCustomers = () => {
    const filteredCustomers = customers.filter(c => {
      const q = custFilter.toLowerCase();
      return !q ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        (c.phone || '').includes(q);
    });
    const custTotalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
    const custIndexOfLastItem = custCurrentPage * itemsPerPage;
    const custIndexOfFirstItem = custIndexOfLastItem - itemsPerPage;
    const currentCustomers = filteredCustomers.slice(custIndexOfFirstItem, custIndexOfLastItem);

    return (
      <div className="employees-tab-container">
      <div className="admin-grid-layout">
        {/* Sol Kolon: Müşteri Ekle */}
        <section className="add-company-section">
          <h2>Yeni Müşteri Ekle</h2>
          <p className="form-description">CRM veritabanınıza yeni bir müşteri kaydedin.</p>
          <form onSubmit={handleAddCust} className="add-company-form">
            <div className="form-group">
              <label>Adı</label>
              <input 
                type="text" 
                placeholder="Örn: Canan" 
                value={newCustFirstName}
                onChange={(e) => setNewCustFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Soyadı</label>
              <input 
                type="text" 
                placeholder="Örn: Öztürk" 
                value={newCustLastName}
                onChange={(e) => setNewCustLastName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Telefon Numarası</label>
              <input 
                type="text" 
                placeholder="Örn: 05321112233" 
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Notlar (Kalıcı Tercih/Alerji vb.)</label>
              <textarea 
                placeholder="Örn: Kuru saç tipi, sarı ton dip boyası formülü..." 
                value={newCustNotes}
                onChange={(e) => setNewCustNotes(e.target.value)}
                className="crm-notes-textarea"
              />
            </div>
            <button type="submit" className="create-company-btn">Müşteri Ekle</button>
          </form>
        </section>

        {/* Sağ Kolon: Müşteri Listesi */}
        <section className="companies-list-section">
          <div className="section-title-row">
            <h2>Müşteriler (CRM)</h2>
            <span className="list-count">{customers.length} Kayıtlı</span>
          </div>
          <div className="list-filter-bar">
            <span className="filter-icon"><Search size={16} /></span>
            <input
              type="text"
              className="list-filter-input"
              placeholder="Müşteri adı veya telefon ara..."
              value={custFilter}
              onChange={e => { setCustFilter(e.target.value); setCustCurrentPage(1); }}
            />
            {custFilter && (
              <button className="filter-clear-btn" onClick={() => { setCustFilter(''); setCustCurrentPage(1); }}><X size={14} /></button>
            )}
          </div>
          <div className="companies-table-container">
            <table className="companies-table">
              <thead>
                <tr>
                  <th>Ad Soyad / Telefon</th>
                  <th>Notlar</th>
                  <th>Durum</th>
                  <th>Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {currentCustomers.length > 0 ? (
                  currentCustomers.map(c => (
                    <tr key={c.id} className={!c.is_active ? 'row-frozen' : ''}>
                      <td>
                        <div className="company-meta">
                          <span className="comp-title">{c.first_name} {c.last_name}</span>
                          <span className="comp-email">{c.phone || 'Telefon girilmedi'}</span>
                        </div>
                      </td>
                      <td className="crm-notes-cell">
                        {c.notes ? (
                          <div className="crm-notes-bubble" title={c.notes}>
                            <FileText className="crm-notes-icon" size={14} />
                            <span>{c.notes}</span>
                          </div>
                        ) : (
                          <span className="crm-notes-bubble-empty">Not eklenmedi</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${c.is_active ? 'active' : 'frozen'}`}>
                          {c.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions-group">
                          <button 
                            onClick={() => handleToggleCustStatus(c)} 
                            className={`action-btn-small ${c.is_active ? 'freeze' : 'activate'}`}
                          >
                            {c.is_active ? 'Pasif Et' : 'Aktif Et'}
                          </button>
                          <button 
                            onClick={() => setEditingCust({ ...c })} 
                            className="action-btn-small edit-btn"
                          >
                            Düzenle
                          </button>
                          <button 
                            onClick={() => handleDeleteCust(c.id)} 
                            className="action-btn-small freeze"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-logs">{custFilter ? 'Arama sonucu bulunamadı.' : 'Kayıtlı müşteri bulunmamaktadır.'}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {custTotalPages > 1 && (
              <div className="pagination-wrapper" style={{ marginTop: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setCustCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={custCurrentPage === 1}
                  className="pagination-btn prev"
                >
                  Önceki
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: custTotalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      type="button"
                      key={pageNum}
                      onClick={() => setCustCurrentPage(pageNum)}
                      className={`pagination-btn page-num ${custCurrentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button 
                  type="button"
                  onClick={() => setCustCurrentPage(prev => Math.min(prev + 1, custTotalPages))}
                  disabled={custCurrentPage === custTotalPages}
                  className="pagination-btn next"
                >
                  Sonraki
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

  // Müşteri Düzenleme Modalı
  const renderEditCustModal = () => {
    if (!editingCust) return null;
    return (
      <div className="modal-backdrop">
        <div className="modal-content text-left">
          <div className="modal-header">
            <h2>Müşteri Bilgilerini Güncelle</h2>
            <button onClick={() => setEditingCust(null)} className="close-modal-btn"><X size={14} /></button>
          </div>
          <form onSubmit={handleUpdateCust} className="modal-form">
            <div className="form-group">
              <label>Müşteri Adı</label>
              <input 
                type="text" 
                value={editingCust.first_name || ''}
                onChange={(e) => setEditingCust({ ...editingCust, first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Müşteri Soyadı</label>
              <input 
                type="text" 
                value={editingCust.last_name || ''}
                onChange={(e) => setEditingCust({ ...editingCust, last_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Telefon Numarası</label>
              <input 
                type="text" 
                value={editingCust.phone || ''}
                onChange={(e) => setEditingCust({ ...editingCust, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Notlar (Tercih/Alerji vb.)</label>
              <textarea 
                value={editingCust.notes || ''}
                onChange={(e) => setEditingCust({ ...editingCust, notes: e.target.value })}
                className="crm-notes-textarea"
              />
            </div>
            <div className="form-group check-inline-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input 
                type="checkbox" 
                id="editCustActive"
                checked={editingCust.is_active}
                onChange={(e) => setEditingCust({ ...editingCust, is_active: e.target.checked })}
              />
              <label htmlFor="editCustActive" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Sistemde Aktif Müşteri
              </label>
            </div>
            <div className="modal-footer-buttons" style={{ marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setEditingCust(null)} className="modal-btn cancel">Vazgeç</button>
              <button type="submit" className="modal-btn submit">Kaydet</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Sekme 4: Sürükle Bırak Randevu Planlama (Drag & Drop Planner)

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Haftalık Randevu Programı', {
        views: [{ showGridLines: false }]
      });

      sheet.columns = [
        { header: '', key: 'emp', width: 25 },
        { header: '', key: 'dept', width: 20 },
        { header: '', key: 'mon', width: 18 },
        { header: '', key: 'tue', width: 18 },
        { header: '', key: 'wed', width: 18 },
        { header: '', key: 'thu', width: 18 },
        { header: '', key: 'fri', width: 18 },
        { header: '', key: 'sat', width: 18 },
        { header: '', key: 'sun', width: 18 }
      ];

      const companyName = profile.company_name || 'Randevu Planı';
      const weekStr = `${new Date(currentWeekStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} Haftası`;

      sheet.mergeCells('A1:I2');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `${companyName} - ${weekStr}`;
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

      sheet.addRow([]);

      const headerRow = sheet.addRow(['Stilist Adı', 'Hizmet', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      });

      const activeEmployees = (plannerViewMode === 'stylist' && selectedStylistId)
        ? employees.filter(e => e.is_active && String(e.id) === selectedStylistId)
        : employees.filter(e => e.is_active);
      const days = getDaysOfWeek();

      activeEmployees.forEach((emp, index) => {
        const empShifts = shifts.filter(s => (s.stylist_id || s.employee_id) === emp.id);
        const rowData = [
          `${emp.first_name} ${emp.last_name}`,
          emp.department_name || 'Belirtilmedi'
        ];

        days.forEach(day => {
          const dayShifts = empShifts.filter(s => s.start_time.startsWith(day.dateStr));
          if (dayShifts.length > 0) {
            const shiftTexts = dayShifts.map(s => {
              const start = s.start_time.substring(11, 16);
              const end = s.end_time.substring(11, 16);
              return `${start} - ${end}`;
            }).join('\n');
            rowData.push(shiftTexts);
          } else {
            rowData.push('İzinli');
          }
        });

        const row = sheet.addRow(rowData);
        row.height = 30;
        const bgColor = index % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';

        row.eachCell((cell, colNum) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
          
          if (colNum <= 2) {
             cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
             cell.font = { bold: true, color: { argb: 'FF334155' } };
          } else {
             if (cell.value === 'İzinli') {
                 cell.font = { italic: true, color: { argb: 'FF94A3B8' } };
             } else {
                 cell.font = { color: { argb: 'FF0F172A' }, bold: true };
                 cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }; 
             }
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Randevu_Plani_${weekStr.replace(/\s+/g, '_')}.xlsx`);
    } catch (err) {
      console.error("Excel dışa aktarılırken hata:", err);
      alert("Excel dosyası oluşturulurken bir hata oluştu.");
    }
  };

  // =============================================
  // === STİLİSTE ÖZEL GÜNLÜK TABLO GÖRÜNÜMü ===
  // =============================================
  const renderStylistDailyView = () => {
    const daysOfWeek = getDaysOfWeek();
    const activeEmps = employees.filter(e => e.is_active);

    const getStylistShiftsStartingInHour = (dateStr, slot) => {
      if (!selectedStylistId) return [];
      return shifts.filter(s => {
        const sEmpId = s.stylist_id || s.employee_id;
        if (String(sEmpId) !== selectedStylistId) return false;

        const sStart = formatTime(s.start_time);
        const sEnd = formatTime(s.end_time);
        const startDateStr = formatDatePart(s.start_time);
        const sHour = sStart.split(':')[0];
        const slotHour = slot.start.split(':')[0];
        
        if (startDateStr === dateStr && sHour === slotHour) {
          return true;
        }
        
        // Gece yarısını geçen randevular (Ertesi günün 00:00 slotunda çizilir)
        if (slotHour === '00' && startDateStr !== dateStr) {
          let startDt = new Date(`${startDateStr}T00:00:00Z`);
          startDt.setUTCDate(startDt.getUTCDate() + 1);
          const nextDayStr = startDt.toISOString().split('T')[0];
          
          if (nextDayStr === dateStr) {
             const startParts = sStart.split(':').map(Number);
             const endParts = sEnd.split(':').map(Number);
             let startMins = startParts[0] * 60 + startParts[1];
             let endMins = endParts[0] * 60 + endParts[1];
             if (endMins <= startMins && endMins !== 0) endMins += 24 * 60;
             return endMins > 24 * 60;
          }
        }
        return false;
      });
    };

    const visibleSlots = hourlySlots.filter(slot => {
      if (showNightHours) return true;
      return parseInt(slot.start.split(':')[0]) >= 8;
    });

    return (
      <div className="stylist-daily-view">
        {activeEmps.length === 0 ? (
          <div className="empty-shifts-state" style={{ margin: '2rem' }}>
            <div className="empty-icon-circle"><Inbox size={24} /></div>
            <p>Sistemde aktif stilist bulunmamaktadır.</p>
            <span className="empty-hint">Stilistler sekmesinden stilist ekleyin.</span>
          </div>
        ) : !selectedStylistId ? (
          <div className="empty-shifts-state" style={{ margin: '2rem' }}>
            <div className="empty-icon-circle"><Users size={24} /></div>
            <p>Lütfen programını görüntülemek için bir stilist seçin.</p>
          </div>
        ) : (
          <div className="planner-table-scroll-wrapper">
            <table className="planner-drag-table">
              <thead>
                <tr>
                  <th className="template-col-header">Randevu Saatleri</th>
                  {daysOfWeek.map(day => (
                    <th key={day.dateStr} className="day-col-header">
                      <div className="day-header-top-row">
                        <div className="day-header-text">
                          <span className="day-name-hdr">{day.dayName}</span>
                          <span className="day-date-hdr">{day.formattedDate}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleSlots.map(slot => (
                  <tr key={slot.start}>
                    <td className="template-cell-info">
                      <strong>{slot.start} - {slot.end}</strong>
                    </td>
                    {daysOfWeek.map(day => {
                      const cellShifts = getStylistShiftsStartingInHour(day.dateStr, slot);

                      return (
                        <td
                          key={day.dateStr}
                          className="planner-drop-zone-cell"
                        >
                          <div className="dropped-employees-container">
                            {cellShifts.map((s) => {
                              const style = getShiftBlockStyle(s, 1, 0, day.dateStr);
                              let displayStartTime = formatTime(s.start_time);
                              let displayEndTime = formatTime(s.end_time);

                              return (
                                <div
                                  key={s.id}
                                  className={`absolute-shift-block status-${s.status || 'confirmed'}`}
                                  style={{ ...style, cursor: 'pointer' }}
                                  onClick={() => setViewingShiftModal(s)}
                                  title={`Müşteri: ${s.customer_name || 'Mola'}\nNot: ${s.notes || ''}\nÜcret: ${s.price ? s.price + ' ₺' : 'Belirtilmedi'}\nDurum: ${s.status === 'confirmed' ? 'Onaylandı' : s.status === 'pending' ? 'Beklemede' : s.status === 'completed' ? 'Tamamlandı' : 'İptal Edildi'} (Tıklayın: Detay)`}
                                >
                                  <div className="shift-block-time">
                                     <span className="shift-time-text">{displayStartTime} - {displayEndTime}</span>
                                  </div>
                                  <div className="shift-block-name" style={{ fontWeight: '700' }}>{s.customer_name || 'Bloke / Mola'}</div>
                                  <div className="shift-block-employee" style={{ fontSize: '0.7rem', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.stylist_name}</div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderShifts = () => {
    const daysOfWeek = getDaysOfWeek();
    
    const allOverlaps = {};
    daysOfWeek.forEach(day => {
       const dayShifts = shifts.filter(s => formatDatePart(s.start_time) === day.dateStr);
       const dayOverlaps = calculateDayOverlaps(dayShifts);
       Object.assign(allOverlaps, dayOverlaps);
    });

    return (
      <div className="planner-tab-layout">
        
        {/* Sol Kenar: Sürüklenebilir Müşteriler Listesi */}
        <aside className="employees-drag-source">
          <div className="drag-source-header">
            <h3>Müşteri Listesi</h3>
            <p>Randevu atamak için müşteriyi takvime sürükleyin.</p>
            <div className="planner-emp-filter-container">
              <Search size={14} className="filter-icon" />
              <input 
                type="text" 
                placeholder="İsim veya telefon ara..." 
                value={plannerEmpFilter}
                onChange={(e) => setPlannerEmpFilter(e.target.value)}
                className="planner-emp-filter-input"
              />
            </div>
          </div>
          <div className="draggable-employees-list">
            {customers
              .filter(c => c.is_active)
              .filter(c => {
                if (!plannerEmpFilter) return true;
                const searchStr = plannerEmpFilter.toLowerCase();
                const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
                const phone = (c.phone || '').toLowerCase();
                return fullName.includes(searchStr) || phone.includes(searchStr);
              })
              .map(cust => (
              <div 
                key={cust.id}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, cust.id)}
                className="draggable-employee-card"
                title="Sürüklemek için fareyle tutup takvime bırakın"
              >
                <div className="card-avatar"><User size={16} /></div>
                <div className="card-info">
                  <span className="card-name">{cust.first_name} {cust.last_name}</span>
                  <span className="card-dept">{cust.phone || 'Telefon belirtilmedi'}</span>
                </div>
                <span className="drag-handle-dots"><GripVertical size={16} /></span>
              </div>
            ))}
            {customers.filter(c => c.is_active).length === 0 && (
              <p className="no-active-emp-warn">Sistemde aktif müşteri bulunmamaktadır.</p>
            )}
          </div>
        </aside>

        {/* Sağ Kenar: Planlama Takvimi */}
        <main className="weekly-planner-container">
          <header className="planner-week-navigation">
            <div className="planner-header-left">
              <div className="view-mode-toggle">
                <button
                  className={`view-mode-btn ${plannerViewMode === 'weekly' ? 'active' : ''}`}
                  onClick={() => setPlannerViewMode('weekly')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Calendar size={16} /> Haftalık Görünüm
                </button>
                <button
                  className={`view-mode-btn ${plannerViewMode === 'stylist' ? 'active' : ''}`}
                  onClick={() => setPlannerViewMode('stylist')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Users size={16} /> Stilist Görünümü
                </button>
              </div>

              <div className="week-range-label">
                <Calendar size={14} style={{ marginRight: '0.5rem' }} />
                <strong>{new Date(currentWeekStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> haftası
              </div>
            </div>

            <div className="planner-header-right">
              {plannerViewMode === 'stylist' && (
                <div className="header-stylist-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                  <Users size={14} style={{ color: '#475569' }} />
                  <select
                    value={selectedStylistId}
                    onChange={(e) => setSelectedStylistId(e.target.value)}
                    style={{ border: 'none', background: 'transparent', padding: '0.4rem 0.5rem', fontSize: '0.8rem', fontWeight: '600', color: '#475569', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
                  >
                    <option value="" style={{ background: '#ffffff', color: '#0f172a' }}>Stilist Seçiniz...</option>
                    {employees.filter(e => e.is_active).map(emp => (
                      <option key={emp.id} value={emp.id} style={{ background: '#ffffff', color: '#0f172a' }}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="week-nav-group">
                <button onClick={handlePrevWeek} className="nav-week-btn" title="Önceki Hafta">
                  <ChevronLeft size={14} /> <span>Önceki Hafta</span>
                </button>
                <button onClick={handleCurrentWeek} className="nav-week-btn secondary">Bugün</button>
                <button onClick={handleNextWeek} className="nav-week-btn" title="Sonraki Hafta">
                  <span>Sonraki Hafta</span> <ChevronRight size={14} />
                </button>
              </div>

              <div className="action-buttons-group">
                <button 
                  onClick={() => {
                    if (profile?.plan_type !== 'premium') {
                      setShowUpgradeModal(true);
                    } else {
                      handleExportExcel();
                    }
                  }} 
                  className="nav-week-btn excel-btn"
                  title="Şu anki programı Excel olarak indir"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={14} /> 
                  <span>Excel İndir</span>
                  {profile?.plan_type !== 'premium' && <Lock size={12} style={{ opacity: 0.7 }} />}
                </button>
                <button 
                  onClick={() => setShowNightHours(!showNightHours)} 
                  className={`nav-week-btn ${showNightHours ? 'secondary' : ''}`}
                  title={showNightHours ? 'Geceyi Gizle' : 'Geceyi Göster'}
                >
                  {showNightHours ? <Sun size={14} /> : <Moon size={14} />}
                  <span>{showNightHours ? 'Geceyi Gizle' : 'Geceyi Göster'}</span>
                </button>
              </div>
            </div>
          </header>

          {plannerViewMode === 'stylist' ? renderStylistDailyView() : (
            <div className="planner-table-scroll-wrapper">
            <table className="planner-drag-table">
              <thead>
                <tr>
                  <th className="template-col-header">Randevu Saatleri</th>
                  {(expandedDay ? daysOfWeek.filter(d => d.dateStr === expandedDay) : daysOfWeek).map(day => {
                    const isOverHeader = dragOverCell?.dateStr === day.dateStr && dragOverCell?.templateId === 'header';
                    return (
                      <th 
                        key={day.dateStr} 
                        className={`day-col-header ${isOverHeader ? 'drag-over-header' : ''} ${expandedDay === day.dateStr ? 'expanded-col' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverCell?.dateStr !== day.dateStr || dragOverCell?.templateId !== 'header') {
                            setDragOverCell({ dateStr: day.dateStr, templateId: 'header' });
                          }
                        }}
                        onDragLeave={() => setDragOverCell(null)}
                        onDrop={(e) => {
                          setDragOverCell(null);
                          e.preventDefault();
                          if (isPastDateTime(day.dateStr, null)) {
                            showNotification("Geçmiş bir tarihe şablon atanamaz.", "error");
                            return;
                          }
                          const customerId = e.dataTransfer.getData("customerId");
                          if (!customerId) return;
                          
                          setTemplateAssignModal({
                            customerId: parseInt(customerId),
                            dateStr: day.dateStr
                          });
                        }}
                      onClick={(e) => { e.stopPropagation(); setExpandedDay(expandedDay === day.dateStr ? null : day.dateStr); }}
                      style={{ cursor: 'pointer' }}
                      >
                        <div className="day-header-top-row">
                          <div className="day-header-text">
                            <span className="day-name-hdr">{day.dayName}</span>
                            <span className="day-date-hdr">{day.formattedDate}</span>
                          </div>
                          <div className="expand-day-btn" title={expandedDay === day.dateStr ? "Daralt" : "Genişlet"}>
                            {expandedDay === day.dateStr ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
                          </div>
                        </div>
                        <div className="quick-drop-hint">Hızlı Şablon <Inbox size={14} /></div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Her Bir 1 Saatlik Dilim İçin Satır */}
                {hourlySlots
                  .filter(slot => {
                    if (showNightHours) return true;
                    const h = parseInt(slot.start.split(':')[0]);
                    return h >= 8;
                  })
                  .map(slot => (
                  <tr key={`${slot.start}-${slot.end}`}>
                    <td className="template-cell-info">
                      <strong>{slot.start} - {slot.end}</strong>
                    </td>
                    {(expandedDay ? daysOfWeek.filter(d => d.dateStr === expandedDay) : daysOfWeek).map(day => {
                      const cellShifts = getShiftsStartingInHour(day.dateStr, slot);
                      const slotId = `${slot.start}-${slot.end}`;
                      const isOver = dragOverCell?.dateStr === day.dateStr && dragOverCell?.templateId === slotId;
                      return (
                        <td 
                          key={day.dateStr}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverCell?.dateStr !== day.dateStr || dragOverCell?.templateId !== slotId) {
                              setDragOverCell({ dateStr: day.dateStr, templateId: slotId });
                            }
                          }}
                          onDragLeave={() => setDragOverCell(null)}
                          onDrop={(e) => {
                            setDragOverCell(null);
                            handleDropEmployee(e, day.dateStr, slot);
                          }}
                          className={`planner-drop-zone-cell ${isOver ? 'drag-over' : ''} ${expandedDay === day.dateStr ? 'expanded-col' : ''}`}
                        >
                          <div className="dropped-employees-container">
                            {cellShifts.map((s, idx) => {
                              const overlapInfo = allOverlaps[s.id] || { count: 1, index: 0 };
                              const style = getShiftBlockStyle(s, overlapInfo.count, overlapInfo.index, day.dateStr);
                              let displayStartTime = formatTime(s.start_time);
                              let displayEndTime = formatTime(s.end_time);
                              
                              if (resizingShift?.id === s.id) {
                                  const startParts = formatTime(s.start_time).split(':').map(Number);
                                  let startMins = startParts[0] * 60 + startParts[1];
                                  
                                  const endParts = formatTime(s.end_time).split(':').map(Number);
                                  let endMins = endParts[0] * 60 + endParts[1];
                                  if (endMins <= startMins) endMins += 24 * 60;
                                  
                                  const currentDurationMins = Math.round(resizingShift.currentHeight / resizingShift.pixelsPerMinute);
                                  
                                  if (resizingShift.direction === 'bottom') {
                                      let newEndMins = startMins + currentDurationMins;
                                      if (newEndMins >= 24 * 60) newEndMins -= 24 * 60;
                                      const h = String(Math.floor(newEndMins / 60)).padStart(2, '0');
                                      const m = String(newEndMins % 60).padStart(2, '0');
                                      displayEndTime = `${h}:${m}`;
                                  } else {
                                      let newStartMins = endMins - currentDurationMins;
                                      if (newStartMins < 0) newStartMins = 0;
                                      const h = String(Math.floor(newStartMins / 60)).padStart(2, '0');
                                      const m = String(newStartMins % 60).padStart(2, '0');
                                      displayStartTime = `${h}:${m}`;
                                  }
                              }
                              
                              return (
                                <div 
                                  key={s.id} 
                                  className={`absolute-shift-block status-${s.status || 'confirmed'} ${resizingShift?.id === s.id ? 'resizing' : ''}`}
                                  style={style}
                                  title={`Müşteri: ${s.customer_name || 'Mola'}\nStilist: ${s.stylist_name}\nNot: ${s.notes || ''}\nÜcret: ${s.price ? s.price + ' ₺' : 'Belirtilmedi'}\nDurum: ${s.status || 'Onaylandı'} (Sağ Tıklayın)`}
                                  onContextMenu={(e) => handleContextMenu(e, s)}
                                >
                                  <div className="shift-resizer shift-resizer-top" onMouseDown={(e) => handleResizeStart(e, s, day.dateStr, 'top')} />
                                  <div className="shift-block-time">
                                     <span className="shift-time-text">{displayStartTime} - {displayEndTime}</span>
                                  </div>
                                  <div className="shift-block-name" style={{ fontWeight: '700' }}>{s.customer_name || 'Bloke / Mola'}</div>
                                  <div className="shift-block-employee" style={{ fontSize: '0.7rem', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.stylist_name}</div>
                                  
                                  <div className="shift-resizer shift-resizer-bottom" onMouseDown={(e) => handleResizeStart(e, s, day.dateStr, 'bottom')} />
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </main>
      </div>
    );
  };

  // Sekme 5: İşlem Logları
  const renderAuditLogs = () => {
    const filteredLogs = logs.filter(log => {
      const q = logFilter.toLowerCase();
      return !q ||
        (log.user_email || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.ip_address || '').includes(q);
    });
    const logTotalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
    const logIndexOfLastItem = logCurrentPage * itemsPerPage;
    const logIndexOfFirstItem = logIndexOfLastItem - itemsPerPage;
    const currentLogs = filteredLogs.slice(logIndexOfFirstItem, logIndexOfLastItem);

    return (
      <section className="audit-logs-section no-margin-top">
      <div className="section-title-row">
        <h2>Salon İşlem Geçmişi (Audit Logs)</h2>
        <button onClick={fetchLogs} className="refresh-logs-btn"><RefreshCw size={14} className="btn-icon" /> Listeyi Yenile</button>
      </div>
      <div className="list-filter-bar">
        <span className="filter-icon"><Search size={16} /></span>
        <input
          type="text"
          className="list-filter-input"
          placeholder="E-posta, eylem veya IP adresine göre ara..."
          value={logFilter}
          onChange={e => { setLogFilter(e.target.value); setLogCurrentPage(1); }}
        />
        {logFilter && (
          <button className="filter-clear-btn" onClick={() => { setLogFilter(''); setLogCurrentPage(1); }}><X size={14} /></button>
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
            {currentLogs.length > 0 ? (
              currentLogs.map(log => (
                <tr key={log.id}>
                  <td className="log-time">{log.timestamp}</td>
                  <td className="log-user">{log.user_email}</td>
                  <td className="log-action">{log.action}</td>
                  <td className="log-ip">{log.ip_address || '127.0.0.1'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-logs">{logFilter ? 'Arama sonucu bulunamadı.' : 'Herhangi bir sistem işlemi kaydedilmemiştir.'}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {logTotalPages > 1 && (
          <div className="pagination-wrapper" style={{ marginTop: '1rem' }}>
            <button 
              type="button"
              onClick={() => setLogCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={logCurrentPage === 1}
              className="pagination-btn prev"
            >
              Önceki
            </button>
            <div className="pagination-pages">
              {Array.from({ length: logTotalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  type="button"
                  key={pageNum}
                  onClick={() => setLogCurrentPage(pageNum)}
                  className={`pagination-btn page-num ${logCurrentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button 
              type="button"
              onClick={() => setLogCurrentPage(prev => Math.min(prev + 1, logTotalPages))}
              disabled={logCurrentPage === logTotalPages}
              className="pagination-btn next"
            >
              Sonraki
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

  // Sekme 6: Hazır Randevu/Mola Şablonları (Templates Management)
  const renderTemplates = () => (
    <div className="templates-tab-container">
      <div className="admin-grid-layout">
        {/* Sol Kolon: Şablon Ekleme */}
        <section className="add-company-section">
          <h2>Hazır Randevu/Mola Ekle</h2>
          <p className="form-description">Haftalık planlama ekranında hızlıca atayabileceğiniz randevu/mola saatleri tanımlayın.</p>
          <form onSubmit={handleAddTemplate} className="add-company-form">
            <div className="form-group">
              <label>Şablon Adı</label>
              <input 
                type="text" 
                placeholder="Örn: Sabah Fönü, Öğle Molası" 
                value={newTemplateName} 
                onChange={(e) => setNewTemplateName(e.target.value)}
                required
              />
            </div>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label>Başlangıç Saati</label>
                <input 
                  type="time" 
                  value={newTemplateStart} 
                  onChange={(e) => setNewTemplateStart(e.target.value)}
                  className="modal-time-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Bitiş Saati</label>
                <input 
                  type="time" 
                  value={newTemplateEnd} 
                  onChange={(e) => setNewTemplateEnd(e.target.value)}
                  className="modal-time-input"
                  required
                />
              </div>
            </div>
            <button type="submit" className="create-company-btn">Şablon Ekle</button>
          </form>
        </section>

        {/* Sağ Kolon: Şablon Listesi */}
        <section className="companies-list-section">
          <div className="section-title-row">
            <h2>Kayıtlı Hazır Randevu/Molalar</h2>
            <span className="list-count">{shiftTemplates.length} Adet</span>
          </div>
          <div className="list-filter-bar">
            <span className="filter-icon"><Search size={16} /></span>
            <input
              type="text"
              className="list-filter-input"
              placeholder="Şablon adına göre ara..."
              value={templateFilter}
              onChange={e => setTemplateFilter(e.target.value)}
            />
            {templateFilter && (
              <button className="filter-clear-btn" onClick={() => setTemplateFilter('')}><X size={14} /></button>
            )}
          </div>
          <div className="companies-table-container">
            <table className="companies-table">
              <thead>
                <tr>
                  <th>Randevu/Mola Adı</th>
                  <th>Saat Aralığı</th>
                  <th>Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {shiftTemplates.filter(t => t.name.toLowerCase().includes(templateFilter.toLowerCase())).length > 0 ? (
                  shiftTemplates.filter(t => t.name.toLowerCase().includes(templateFilter.toLowerCase())).map(t => (
                    <tr key={t.id}>
                      <td>
                        <span className="comp-title">{t.name}</span>
                      </td>
                      <td>
                        <span className="comp-email">{t.start_time} - {t.end_time}</span>
                      </td>
                      <td>
                        <div className="row-actions-group">
                          <button
                            onClick={() => setEditingTemplate({ id: t.id, name: t.name, start_time: t.start_time, end_time: t.end_time })}
                            className="action-btn-small edit-btn"
                          >
                            Düzenle
                          </button>
                          <button 
                            onClick={() => handleDeleteTemplate(t.id)} 
                            className="action-btn-small freeze"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="no-logs">{templateFilter ? 'Arama sonucu bulunamadı.' : 'Kayıtlı hazır randevu/mola şablonu bulunmamaktadır.'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );

  // Şablon Düzenle Modali
  const renderEditTemplateModal = () => (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Вardiya Şablonunu Güncelle</h2>
          <button onClick={() => setEditingTemplate(null)} className="close-modal-btn"><X size={14} /></button>
        </div>
        <form onSubmit={handleUpdateTemplate} className="modal-form">
          <div className="form-group">
            <label>Şablon Adı</label>
            <input
              type="text"
              value={editingTemplate.name}
              onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
              required
              placeholder="Örn: Sabah Fönü"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Başlangıç Saati</label>
              <input
                type="time"
                value={editingTemplate.start_time}
                onChange={e => setEditingTemplate({ ...editingTemplate, start_time: e.target.value })}
                className="modal-time-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Bitiş Saati</label>
              <input
                type="time"
                value={editingTemplate.end_time}
                onChange={e => setEditingTemplate({ ...editingTemplate, end_time: e.target.value })}
                className="modal-time-input"
                required
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setEditingTemplate(null)} className="modal-cancel-btn">Vazgeç</button>
            <button type="submit" className="modal-save-btn">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );

  // Bugün Çalışan Stilistler - Randevu Detay Modalı
  const renderTodayAppointmentModal = () => {
    if (!todayAppointmentModal) return null;

    const { shift, stylist } = todayAppointmentModal;
     
    // Shift'in saatleri içindeki tüm randevuları bul
    const shiftDate = formatDatePart(shift.start_time); // YYYY-MM-DD
    const shiftStart = formatTime(shift.start_time);
    const shiftEnd = formatTime(shift.end_time);
    const shiftStylistId = shift.stylist_id || shift.employee_id;
     
    const appointmentsInShift = shifts.filter(apt => {
      if (formatDatePart(apt.start_time) !== shiftDate) return false;
      const aptTime = formatTime(apt.start_time);
      const isInTime = aptTime >= shiftStart && aptTime < shiftEnd;
      const isForThisStylist = apt.stylist_id === shiftStylistId || apt.employee_id === shiftStylistId;
      return isInTime && isForThisStylist;
    });

    const handleFieldUpdate = async (appointmentId, fields) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/appointments/${appointmentId}`,
          {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(fields)
          }
        );
        if (!response.ok) throw new Error('Güncelleme başarısız.');
        fetchShifts();
      } catch (error) {
        showNotification(error.message, "error");
      }
    };

    const handleCancelAppointment = async (appointmentId) => {
      if (window.confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?")) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/admin/appointments/${appointmentId}`,
            {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ status: 'cancelled' })
            }
          );
          if (!response.ok) throw new Error('İptal işlemi başarısız.');
          showNotification("Randevu iptal edildi.");
          fetchShifts();
        } catch (error) {
          showNotification(error.message, "error");
        }
      }
    };

    const handleEditFromModal = (apt) => {
      setTodayAppointmentModal(null);
      handleEditShiftClick(apt);
    };

    const handleViewFromModal = (apt) => {
      setTodayAppointmentModal(null);
      setViewingShiftModal(apt);
    };

    return (
      <div className="modal-backdrop">
        <div className="modal-content" style={{ maxWidth: '600px' }}>
          <div className="modal-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} style={{ color: '#6366f1' }} />
              {shiftStart} - {shiftEnd} Randevuları
            </h2>
            <button onClick={() => setTodayAppointmentModal(null)} className="close-modal-btn"><X size={14} /></button>
          </div>

          <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 0.35rem 0' }}><strong>Stilist:</strong> {stylist.first_name} {stylist.last_name}</p>
              <p style={{ margin: '0' }}><strong>Tarih:</strong> {new Date(shiftDate).toLocaleDateString('tr-TR')}</p>
            </div>

            {appointmentsInShift.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {appointmentsInShift.map(apt => (
                  <div key={apt.id} className={`appointment-detail-card status-${apt.status}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>{apt.customer_name || 'Müşteri'}</h4>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                        </p>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem' }}>
                          <strong>Hizmet:</strong> {apt.service_name || 'Belirtilmemiş'} {apt.price ? `(${apt.price} ₺)` : ''}
                        </p>
                        {apt.notes && (
                          <p style={{ margin: '0', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={12} /> {apt.notes}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleViewFromModal(apt)}
                          className="action-btn-small edit-btn"
                          style={{ padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                          title="Görüntüle"
                        >
                          <Users size={14} />
                        </button>
                        <button
                          onClick={() => handleEditFromModal(apt)}
                          className="action-btn-small edit-btn"
                          style={{ padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                          title="Düzenle"
                        >
                          <Edit size={14} />
                        </button>
                        {apt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="action-btn-small freeze"
                            style={{ padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                            title="İptal Et"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Durum</label>
                        <select 
                          value={apt.status}
                          onChange={(e) => handleFieldUpdate(apt.id, { status: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.6rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            background: 'var(--bg-dark-soft, #f8fafc)',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <option value="pending">Beklemede</option>
                          <option value="confirmed">Onaylandı</option>
                          <option value="cancelled">İptal Edildi</option>
                          <option value="completed">Tamamlandı</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Ödeme</label>
                        <select 
                          value={apt.payment_status || 'Ödeme Bekleniyor'}
                          onChange={(e) => handleFieldUpdate(apt.id, { payment_status: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.6rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            background: 'var(--bg-dark-soft, #f8fafc)',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <option value="Ödeme Bekleniyor">Bekleniyor</option>
                          <option value="Ödendi">Ödendi</option>
                          <option value="Kısmi Ödeme">Kısmi Ödeme</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Ödeme Türü</label>
                        <select 
                          value={apt.payment_type || ''}
                          onChange={(e) => handleFieldUpdate(apt.id, { payment_type: e.target.value || null })}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.6rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            background: 'var(--bg-dark-soft, #f8fafc)',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <option value="">Seçiniz</option>
                          <option value="Nakit">Nakit</option>
                          <option value="Havale/EFT">Havale/EFT</option>
                          <option value="IBAN">IBAN</option>
                          <option value="Kredi Kartı">Kredi Kartı</option>
                          <option value="Diğer">Diğer</option>
                        </select>
                      </div>
                    </div>
                    {apt.payment_status === 'Kısmi Ödeme' && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px dashed var(--border-color, #e2e8f0)', paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Ödenen Tutar:</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Maksimum: {apt.price || 0} ₺</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0.75rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>₺</span>
                          <input
                            type="number"
                            value={localPaidAmounts[apt.id] !== undefined ? localPaidAmounts[apt.id] : (apt.paid_amount || 0)}
                            onChange={(e) => {
                              const val = e.target.value;
                              const floatVal = parseFloat(val) || 0;
                              const priceVal = parseFloat(apt.price) || 0;
                              
                              if (floatVal > priceVal) {
                                setLocalPaidAmounts({ ...localPaidAmounts, [apt.id]: priceVal.toString() });
                                showNotification(`Ödenen tutar toplam fiyattan (${priceVal} ₺) fazla olamaz. Otomatik olarak üst sınıra çekildi.`, "warning");
                              } else if (floatVal < 0) {
                                setLocalPaidAmounts({ ...localPaidAmounts, [apt.id]: '0' });
                              } else {
                                setLocalPaidAmounts({ ...localPaidAmounts, [apt.id]: val });
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const priceVal = parseFloat(apt.price) || 0;
                              const cappedVal = Math.min(Math.max(val, 0), priceVal);
                              handleFieldUpdate(apt.id, { paid_amount: cappedVal });
                              setLocalPaidAmounts({ ...localPaidAmounts, [apt.id]: cappedVal.toString() });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = parseFloat(e.target.value) || 0;
                                const priceVal = parseFloat(apt.price) || 0;
                                const cappedVal = Math.min(Math.max(val, 0), priceVal);
                                handleFieldUpdate(apt.id, { paid_amount: cappedVal });
                                setLocalPaidAmounts({ ...localPaidAmounts, [apt.id]: cappedVal.toString() });
                                e.target.blur();
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.75rem 0.45rem 1.6rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color, #e2e8f0)',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              background: 'var(--bg-dark-soft, #f8fafc)',
                              color: 'var(--text-primary)',
                              outline: 'none',
                              transition: 'all 0.15s'
                            }}
                            min="0"
                            max={apt.price || undefined}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                <p>Bu saatler arasında randevu bulunmamaktadır.</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              onClick={() => setTodayAppointmentModal(null)}
              className="modal-btn cancel"
              style={{ width: '100%' }}
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Silme Onay Modalı
  const renderConfirmModal = () => (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
            <AlertCircle size={20} /> Silme İşlemini Onayla
          </h2>
          <button onClick={() => setConfirmModal(null)} className="close-modal-btn"><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: '1rem 0', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
          {confirmModal.message}
        </div>
        <div className="modal-actions">
          <button onClick={() => setConfirmModal(null)} className="modal-cancel-btn">Vazgeç</button>
          <button 
            onClick={() => {
              confirmModal.onConfirm();
              setConfirmModal(null);
            }} 
            className="modal-btn cancel"
            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.7rem 1.75rem', borderRadius: 'var(--radius-md)', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}
          >
            Evet, Sil
          </button>
        </div>
      </div>
    </div>
  );

  // Hizmet Düzenleme Modalı
  const renderEditDeptModal = () => (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Hizmet Kategorisi Düzenle</h2>
          <button onClick={() => setEditingDept(null)} className="close-modal-btn"><X size={14} /></button>
        </div>
        <form onSubmit={handleUpdateDept} className="modal-form">
          <div className="form-group">
            <label>Hizmet Kategorisi Adı</label>
            <input 
              type="text" 
              value={editingDept.name} 
              onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Varsayılan Fiyat (₺) - İsteğe Bağlı</label>
            <input 
              type="number" 
              placeholder="Örn: 150.00" 
              step="0.01"
              min="0"
              value={editingDept.price || ''} 
              onChange={(e) => setEditingDept({ ...editingDept, price: e.target.value })}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setEditingDept(null)} className="modal-cancel-btn">Vazgeç</button>
            <button type="submit" className="modal-save-btn">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );

  // Stilist Düzenleme Modalı
  const renderEditEmpModal = () => (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Stilist Bilgilerini Güncelle</h2>
          <button onClick={() => setEditingEmp(null)} className="close-modal-btn"><X size={14} /></button>
        </div>
        <form onSubmit={handleUpdateEmp} className="modal-form">
          <div className="form-group">
            <label>Adı</label>
            <input 
              type="text" 
              value={editingEmp.first_name} 
              onChange={(e) => setEditingEmp({ ...editingEmp, first_name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Soyadı</label>
            <input 
              type="text" 
              value={editingEmp.last_name} 
              onChange={(e) => setEditingEmp({ ...editingEmp, last_name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Telefon Numarası</label>
            <input 
              type="text" 
              value={editingEmp.phone || ''} 
              onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Hizmet Kategorisi</label>
            <select 
              value={editingEmp.department_id || ''} 
              onChange={(e) => setEditingEmp({ ...editingEmp, department_id: e.target.value })}
              required
            >
              <option value="">Seçiniz...</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={editingEmp.is_active} 
                onChange={(e) => setEditingEmp({ ...editingEmp, is_active: e.target.checked })}
              />
              Sistemde Aktif Stilist
            </label>
          </div>
          <div className="modal-footer-buttons">
            <button type="button" onClick={() => setEditingEmp(null)} className="modal-btn cancel">Vazgeç</button>
            <button type="submit" className="modal-btn submit">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );

  // Sürükle Bırak Sonrası Özel Saat Belirleme Modalı
  const renderCustomShiftModal = () => {
    // Seçili saatte hangi stilistlerin müsait olduğunu hesapla
    const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const selStartMins = toMins(customShiftModal.startTime);
    const selEndMins = toMins(customShiftModal.endTime) || (toMins(customShiftModal.startTime) + 60);

    const busyEmpIds = new Set(
      shifts
        .filter(s => formatDatePart(s.start_time) === customShiftModal.dateStr)
        .filter(s => {
          const sStart = toMins(formatTime(s.start_time));
          const sEnd = toMins(formatTime(s.end_time)) || (sStart + 60);
          return sStart < selEndMins && sEnd > selStartMins; // overlap check
        })
        .map(s => s.stylist_id || s.employee_id)
    );

    return (
      <div className="modal-backdrop">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Yeni Randevu Oluştur</h2>
            <button onClick={() => { setCustomShiftModal(null); setCustomShiftError(''); }} className="close-modal-btn"><X size={14} /></button>
          </div>
          <form onSubmit={handleCustomShiftSubmit} className="modal-form">
            <div className="custom-shift-info" style={{ marginBottom: '1.25rem', background: '#f0f9ff', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
              <p style={{ margin: 0 }}><strong>Müşteri:</strong> {customShiftModal.customerName}</p>
              <p style={{ margin: '0.3rem 0 0' }}><strong>Tarih:</strong> {customShiftModal.dateStr}</p>
            </div>

            {customShiftError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                color: '#dc2626',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} style={{ color: '#dc2626', marginTop: '1px', flexShrink: 0 }} />
                <span>{customShiftError}</span>
              </div>
            )}
            
            <div className="form-group">
              <label>Stilist Seçin
                <span style={{ fontWeight: '400', fontSize: '0.78rem', color: '#64748b', marginLeft: '0.5rem' }}>
                  {busyEmpIds.size > 0 ? `(${busyEmpIds.size} stilist bu saatte meşgul)` : '(tümü müsait)'}
                </span>
              </label>
              <select
                value={customShiftModal.employeeId}
                onChange={(e) => { setCustomShiftModal({ ...customShiftModal, employeeId: e.target.value }); setCustomShiftError(''); }}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                <option value="">Seçiniz...</option>
                {employees.filter(emp => emp.is_active).map(emp => {
                  const isBusy = busyEmpIds.has(emp.id);
                  return (
                    <option key={emp.id} value={emp.id} disabled={isBusy}>
                      {emp.first_name} {emp.last_name}{isBusy ? ' (Meşgul)' : ' (Müsait)'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Hizmet Seçin</label>
                <select
                  value={customShiftModal.serviceId}
                  onChange={(e) => {
                    const selectedService = departments.find(d => d.id === parseInt(e.target.value));
                    setCustomShiftModal({ 
                      ...customShiftModal, 
                      serviceId: e.target.value,
                      // Auto-populate price from service if available
                      price: selectedService?.price ? selectedService.price.toString() : customShiftModal.price || ''
                    });
                  }}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                  <option value="">Seçiniz...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Hizmet Ücreti (₺)</label>
                <input 
                  type="number" 
                  placeholder="Örn: 450" 
                  value={customShiftModal.price || ''}
                  onChange={(e) => setCustomShiftModal({ ...customShiftModal, price: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Ödeme Durumu</label>
                <select
                  value={customShiftModal.paymentStatus || 'Ödeme Bekleniyor'}
                  onChange={(e) => setCustomShiftModal({ ...customShiftModal, paymentStatus: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                  <option value="Ödeme Bekleniyor">Ödeme Bekleniyor</option>
                  <option value="Ödendi">Ödendi</option>
                  <option value="Kısmi Ödeme">Kısmi Ödeme</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ödeme Türü</label>
                <select
                  value={customShiftModal.paymentType || ''}
                  onChange={(e) => setCustomShiftModal({ ...customShiftModal, paymentType: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                  <option value="">Seçiniz...</option>
                  <option value="Nakit">Nakit</option>
                  <option value="Havale/EFT">Havale/EFT</option>
                  <option value="IBAN">IBAN</option>
                  <option value="Kredi Kartı">Kredi Kartı</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
            </div>

            {customShiftModal.paymentStatus === 'Kısmi Ödeme' && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600' }}>Ödenen Tutar (₺) *</label>
                <input
                  type="number"
                  placeholder="Örn: 200"
                  value={customShiftModal.paidAmount || ''}
                  onChange={(e) => setCustomShiftModal({ ...customShiftModal, paidAmount: e.target.value })}
                  min="0"
                  max={customShiftModal.price || undefined}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: customShiftModal.price && parseFloat(customShiftModal.paidAmount) > parseFloat(customShiftModal.price) ? '1px solid var(--error)' : '1px solid var(--border)',
                    outline: 'none',
                    boxShadow: customShiftModal.price && parseFloat(customShiftModal.paidAmount) > parseFloat(customShiftModal.price) ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none'
                  }}
                />
                {customShiftModal.price && parseFloat(customShiftModal.paidAmount) > parseFloat(customShiftModal.price) && (
                  <span className="error-text" style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Ödenen tutar toplam fiyattan ({customShiftModal.price} ₺) fazla olamaz.
                  </span>
                )}
              </div>
            )}

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Başlangıç Saati</label>
                <input 
                  type="time" 
                  value={customShiftModal.startTime}
                  onChange={(e) => { setCustomShiftModal({ ...customShiftModal, startTime: e.target.value }); setCustomShiftError(''); }}
                  required
                />
              </div>
              <div className="form-group">
                <label>Bitiş Saati</label>
                <input 
                  type="time" 
                  value={customShiftModal.endTime}
                  onChange={(e) => { setCustomShiftModal({ ...customShiftModal, endTime: e.target.value }); setCustomShiftError(''); }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Randevu Notları</label>
              <textarea 
                placeholder="Örn: Kırık fön ve saç kesimi..." 
                value={customShiftModal.notes || ''}
                onChange={(e) => setCustomShiftModal({ ...customShiftModal, notes: e.target.value })}
                className="crm-notes-textarea"
              />
            </div>

            <div className="modal-footer-buttons">
              <button type="button" onClick={() => { setCustomShiftModal(null); setCustomShiftError(''); }} className="modal-btn cancel">Vazgeç</button>
              <button type="submit" className="modal-btn submit">Randevu Oluştur</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Hızlı Hazır Randevu/Mola Şablonu Atama Modalı
  const renderTemplateAssignModal = () => {
    const cust = customers.find(c => c.id === templateAssignModal.customerId);
    const custName = cust ? `${cust.first_name} ${cust.last_name}` : "Müşteri";

    return (
      <div className="modal-backdrop">
        <div className="modal-content text-left">
          <div className="modal-header">
            <h2>Hazır Randevu/Mola Şablonu Ata</h2>
            <button onClick={() => setTemplateAssignModal(null)} className="close-modal-btn"><X size={14} /></button>
          </div>
          <div className="modal-body-content" style={{ textAlign: 'left' }}>
            <div className="custom-shift-info" style={{ marginBottom: '1.25rem' }}>
              <p><strong>Müşteri:</strong> {custName}</p>
              <p><strong>Tarih:</strong> {templateAssignModal.dateStr}</p>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Stilist Seçin</label>
              <select
                value={templateStylistId}
                onChange={(e) => setTemplateStylistId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                <option value="">Seçiniz...</option>
                {employees.filter(emp => emp.is_active).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Hizmet Alanı</label>
              <select
                value={templateServiceId}
                onChange={(e) => setTemplateServiceId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                <option value="">Seçiniz...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            
            <div className="templates-selector-group">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: '800' }}>Bir Şablon Seçin:</h3>
              <div className="assign-templates-grid">
                {shiftTemplates.map(t => (
                  <button 
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (!templateStylistId) {
                        showNotification("Lütfen önce bir stilist seçin.", "error");
                        return;
                      }
                      assignShiftAPI(templateStylistId, templateAssignModal.customerId, templateServiceId, templateAssignModal.dateStr, t.start_time, t.end_time);
                      setTemplateAssignModal(null);
                    }}
                    className="assign-template-card-btn"
                  >
                    <strong>{t.name}</strong>
                    <span>{t.start_time} - {t.end_time}</span>
                  </button>
                ))}
                {shiftTemplates.length === 0 && (
                  <p className="no-templates-msg-modal">Kayıtlı hazır randevu/mola şablonu bulunmamaktadır. Lütfen sol panelden bir şablon ekleyin.</p>
                )}
              </div>

              <div className="modal-divider">veya</div>

              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: '800' }}>Özel Saat Aralığı Tanımla:</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!templateStylistId) {
                  showNotification("Lütfen önce bir stilist seçin.", "error");
                  return;
                }
                const start = e.target.startTime.value;
                const end = e.target.endTime.value;
                assignShiftAPI(templateStylistId, templateAssignModal.customerId, templateServiceId, templateAssignModal.dateStr, start, end);
                setTemplateAssignModal(null);
              }} className="mini-modal-form">
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Başlangıç Saati</label>
                    <input type="time" name="startTime" defaultValue="09:00" className="modal-time-input" required />
                  </div>
                  <div className="form-group">
                    <label>Bitiş Saati</label>
                    <input type="time" name="endTime" defaultValue="17:00" className="modal-time-input" required />
                  </div>
                </div>
                <button type="submit" className="modal-btn submit full-width mt-1" style={{ width: '100%', marginTop: '1.25rem' }}>Özel Randevu Ata</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleEditShiftClick = (s) => {
    const sDate = formatDatePart(s.start_time);
    const sStart = formatTime(s.start_time);
    const sEnd = formatTime(s.end_time);
    setEditingShiftModal({
      shiftId: s.id,
      employeeId: s.stylist_id || s.employee_id,
      customerId: s.customer_id,
      serviceId: s.service_id || '',
      dateStr: sDate,
      startTime: sStart,
      endTime: sEnd,
      price: s.price || '',
      notes: s.notes || '',
      status: s.status || 'confirmed',
      paymentStatus: s.payment_status || 'Ödeme Bekleniyor',
      paymentType: s.payment_type || '',
      paidAmount: s.paid_amount || 0.0
    });
  };

  const handleEditingShiftSubmit = async (e) => {
    e.preventDefault();
    if (!editingShiftModal) return;

    if (isPastDateTime(editingShiftModal.dateStr, editingShiftModal.startTime)) {
      showNotification("Randevu geçmiş bir tarihe güncellenemez.", "error");
      return;
    }

    // Gece randevusu tarih hesabı
    let endDate = new Date(editingShiftModal.dateStr);
    const [startHour, startMin] = editingShiftModal.startTime.split(':');
    const [endHour, endMin] = editingShiftModal.endTime.split(':');

    const startDateTimeStr = `${editingShiftModal.dateStr} ${editingShiftModal.startTime}:00`;

    if (
      parseInt(endHour) < parseInt(startHour) || 
      (parseInt(endHour) === parseInt(startHour) && parseInt(endMin) < parseInt(startMin))
    ) {
      endDate.setDate(endDate.getDate() + 1);
    }
    const endDateStr = endDate.toISOString().split('T')[0];
    const endDateTimeStr = `${endDateStr} ${editingShiftModal.endTime}:00`;

    if (editingShiftModal.paymentStatus === 'Kısmi Ödeme') {
      const priceVal = parseFloat(editingShiftModal.price) || 0;
      const paidVal = parseFloat(editingShiftModal.paidAmount) || 0;
      if (paidVal < 0) {
        showNotification("Ödenen tutar 0'dan küçük olamaz.", "error");
        return;
      }
      if (paidVal > priceVal) {
        showNotification(`Ödenen tutar toplam fiyattan (${priceVal} ₺) fazla olamaz.`, "error");
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointments/${editingShiftModal.shiftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: parseInt(editingShiftModal.employeeId),
          customer_id: parseInt(editingShiftModal.customerId),
          service_id: editingShiftModal.serviceId ? parseInt(editingShiftModal.serviceId) : null,
          start_datetime: startDateTimeStr,
          end_datetime: endDateTimeStr,
          price: editingShiftModal.price ? parseFloat(editingShiftModal.price) : null,
          notes: editingShiftModal.notes,
          status: editingShiftModal.status,
          payment_status: editingShiftModal.paymentStatus,
          payment_type: editingShiftModal.paymentType || null,
          paid_amount: editingShiftModal.paymentStatus === 'Kısmi Ödeme' ? (parseFloat(editingShiftModal.paidAmount) || 0.0) : (editingShiftModal.paymentStatus === 'Ödendi' ? (parseFloat(editingShiftModal.price) || 0.0) : 0.0)
        })
      });

      const data = await response.json();
      if (response.ok) {
        showNotification("Randevu başarıyla güncellendi.");
        fetchShifts();
        fetchLogs();
      } else {
        showNotification(data.error || "Randevu güncellenemedi.", "error");
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
    setEditingShiftModal(null);
  };

  const renderEditingShiftModal = () => {
    return (
      <div className="modal-backdrop">
        <div className="modal-content text-left">
          <div className="modal-header">
            <h2>Randevu Düzenle</h2>
            <button onClick={() => setEditingShiftModal(null)} className="close-modal-btn"><X size={14} /></button>
          </div>
          <form onSubmit={handleEditingShiftSubmit} className="modal-form">
            <div className="custom-shift-info" style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <p><strong>Tarih:</strong> {editingShiftModal.dateStr}</p>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Müşteri Seçin</label>
              <select
                value={editingShiftModal.customerId}
                onChange={(e) => setEditingShiftModal({ ...editingShiftModal, customerId: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                <option value="">Seçiniz...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Stilist Seçin</label>
                <select
                  value={editingShiftModal.employeeId}
                  onChange={(e) => setEditingShiftModal({ ...editingShiftModal, employeeId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                  <option value="">Seçiniz...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Hizmet Seçin</label>
                <select
                  value={editingShiftModal.serviceId}
                  onChange={(e) => {
                    const selectedService = departments.find(d => d.id === parseInt(e.target.value));
                    setEditingShiftModal({ 
                      ...editingShiftModal, 
                      serviceId: e.target.value,
                      // Auto-populate price from service if available
                      price: selectedService?.price ? selectedService.price.toString() : editingShiftModal.price || ''
                    });
                  }}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                  <option value="">Seçiniz...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Hizmet Ücreti (₺)</label>
                <input 
                  type="number" 
                  value={editingShiftModal.price || ''}
                  onChange={(e) => setEditingShiftModal({ ...editingShiftModal, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Randevu Durumu</label>
                <select 
                  value={editingShiftModal.status || 'confirmed'}
                  onChange={(e) => setEditingShiftModal({ ...editingShiftModal, status: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                  <option value="confirmed">Onaylandı</option>
                  <option value="pending">Beklemede</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Ödeme Durumu</label>
                <select
                  value={editingShiftModal.paymentStatus || 'Ödeme Bekleniyor'}
                  onChange={(e) => setEditingShiftModal({ ...editingShiftModal, paymentStatus: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                  <option value="Ödeme Bekleniyor">Ödeme Bekleniyor</option>
                  <option value="Ödendi">Ödendi</option>
                  <option value="Kısmi Ödeme">Kısmi Ödeme</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ödeme Türü</label>
                <select
                  value={editingShiftModal.paymentType || ''}
                  onChange={(e) => setEditingShiftModal({ ...editingShiftModal, paymentType: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                  <option value="">Seçiniz...</option>
                  <option value="Nakit">Nakit</option>
                  <option value="Havale/EFT">Havale/EFT</option>
                  <option value="IBAN">IBAN</option>
                  <option value="Kredi Kartı">Kredi Kartı</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
            </div>

            {editingShiftModal.paymentStatus === 'Kısmi Ödeme' && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600' }}>Ödenen Tutar (₺) *</label>
                <input
                  type="number"
                  placeholder="Örn: 200"
                  value={editingShiftModal.paidAmount || ''}
                  onChange={(e) => setEditingShiftModal({ ...editingShiftModal, paidAmount: e.target.value })}
                  min="0"
                  max={editingShiftModal.price || undefined}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: editingShiftModal.price && parseFloat(editingShiftModal.paidAmount) > parseFloat(editingShiftModal.price) ? '1px solid var(--error)' : '1px solid var(--border)',
                    outline: 'none',
                    boxShadow: editingShiftModal.price && parseFloat(editingShiftModal.paidAmount) > parseFloat(editingShiftModal.price) ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none'
                  }}
                />
                {editingShiftModal.price && parseFloat(editingShiftModal.paidAmount) > parseFloat(editingShiftModal.price) && (
                  <span className="error-text" style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Ödenen tutar toplam fiyattan ({editingShiftModal.price} ₺) fazla olamaz.
                  </span>
                )}
              </div>
            )}

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Başlangıç Saati</label>
                <input 
                  type="time" 
                  value={editingShiftModal.startTime}
                  onChange={(e) => setEditingShiftModal({ ...editingShiftModal, startTime: e.target.value })}
                  className="modal-time-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Bitiş Saati</label>
                <input 
                  type="time" 
                  value={editingShiftModal.endTime}
                  onChange={(e) => setEditingShiftModal({ ...editingShiftModal, endTime: e.target.value })}
                  className="modal-time-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Randevu Notları</label>
              <textarea 
                value={editingShiftModal.notes || ''}
                onChange={(e) => setEditingShiftModal({ ...editingShiftModal, notes: e.target.value })}
                className="crm-notes-textarea"
              />
            </div>

            <div className="modal-footer-buttons" style={{ marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setEditingShiftModal(null)} className="modal-btn cancel">Vazgeç</button>
              <button type="submit" className="modal-btn submit">Kaydet</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderViewingShiftModal = () => {
    if (!viewingShiftModal) return null;
    const s = viewingShiftModal;
    const sDate = formatDatePart(s.start_time);
    const sStart = formatTime(s.start_time);
    const sEnd = formatTime(s.end_time);

    return (
      <div className="modal-backdrop">
        <div className="modal-content text-left" style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <h2>Randevu Detayları</h2>
            <button onClick={() => setViewingShiftModal(null)} className="close-modal-btn"><X size={14} /></button>
          </div>
          <div className="modal-body" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Müşteri</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{s.customer_name || 'Belirtilmedi'}</p>
                  {s.customer_phone && <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.customer_phone}</p>}
                </div>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stilist</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{s.stylist_name || 'Belirtilmedi'}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hizmet</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{s.service_name || 'Belirtilmedi'}</p>
                </div>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ücret</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600', color: '#10b981' }}>{s.price ? `${s.price} ₺` : 'Belirtilmedi'}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tarih</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{new Date(sDate).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Saat</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{sStart} - {sEnd}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ödeme Durumu</strong>
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
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ödeme Türü</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: '600' }}>{s.payment_type || 'Belirtilmedi'}</p>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Randevu Durumu</strong>
                <p style={{ margin: '0.2rem 0 0 0' }}>
                  <span className={`appointment-status-badge ${s.status}`} style={{ fontSize: '0.7rem' }}>
                    {s.status === 'confirmed' ? 'Onaylandı' :
                     s.status === 'pending' ? 'Beklemede' :
                     s.status === 'completed' ? 'Tamamlandı' : 'İptal Edildi'}
                  </span>
                </p>
              </div>

              {s.notes && (
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Notlar</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', borderLeft: '3px solid #6366f1' }}>{s.notes}</p>
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Yönetici paneli yükleniyor, lütfen bekleyiniz...</p>
      </div>
    );
  }

  const renderSettings = () => (
    <div className="tab-pane active fade-in">
      
      <div className="settings-container">
        {/* Lisans Durumu */}
        <div className="settings-card license-card">
          <div className="settings-card-header">
            <Clock size={20} className="icon-blue" />
            <h3>Abonelik Durumu</h3>
          </div>
          <div className="settings-card-body">
            <div className="license-stat">
              <span className="stat-label">Kalan Süre:</span>
              <span className={`stat-value ${(!profile.license_end_date || profile.remaining_days >= 7) ? 'success' : 'danger'}`}>
                {!profile.license_end_date ? 'Limitsiz' : `${profile.remaining_days} Gün`}
              </span>
            </div>
            <p className="license-note">Lisans bitiş tarihi: {profile.license_end_date ? new Date(profile.license_end_date).toLocaleDateString('tr-TR') : 'Sınırsız (Ömür Boyu)'}</p>
          </div>
        </div>

        {/* Profil Formu */}
        <div className="settings-card form-card">
          <div className="settings-card-header">
            <Building size={20} className="icon-purple" />
            <h3>Salon Bilgileri</h3>
          </div>
          <div className="settings-card-body">
            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="form-group">
                <label>Admin E-posta</label>
                <input type="text" value={profile.email} disabled className="disabled-input" />
                <span className="input-hint">E-posta adresi değiştirilemez.</span>
              </div>
              
              <div className="form-group">
                <label>Salon Adı</label>
                <input 
                  type="text" 
                  value={profileForm.company_name} 
                  onChange={(e) => setProfileForm({...profileForm, company_name: e.target.value})} 
                  required
                />
              </div>

              <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <Shield size={20} className="icon-red" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '700' }}>Güvenlik</h3>
              </div>
              
              <div className="form-group">
                <label>Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)</label>
                <input 
                  type="password" 
                  placeholder="******" 
                  value={profileForm.new_password}
                  onChange={(e) => setProfileForm({...profileForm, new_password: e.target.value})}
                  minLength={6}
                />
              </div>

              {profileMessage && (
                <div className={`form-alert ${profileMessage.type}`}>
                  {profileMessage.text}
                </div>
              )}

              <button type="submit" className="save-settings-btn" disabled={profileLoading}>
                {profileLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  if (activeTab === 'shifts') {
    return (
      <div className="planner-full-screen-layout">
        {/* Full-screen planner header */}
        <header className="planner-fs-header">
          <div className="fs-header-left">
            <button onClick={() => setActiveTab('overview')} className="back-to-dashboard-btn">
              ← Yönetim Paneline Dön
            </button>
            <div className="fs-title-box">
              <h2>Randevu Planlama Çalışma Alanı</h2>
              <p>Müşterileri 1 saatlik dilimlere sürükleyip bırakarak randevuları planlayın.</p>
            </div>
          </div>
          <div className="fs-header-right">
            <div className="user-avatar"><User size={20} /></div>
            <div className="user-details">
              <span className="user-email">{localStorage.getItem('email') || 'yonetici@glowcut.com'}</span>
              <span className="user-role-label">Salon Yöneticisi</span>
            </div>
          </div>
        </header>

        <div className="planner-fs-content">
          {message && (
            <div className={`dashboard-alert ${messageType}`}>
              {messageType === 'success' ? '' : ''} {message}
            </div>
          )}
                    {contextMenu && contextMenu.visible && (
            <div 
              className="shift-context-menu" 
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => { setViewingShiftModal(contextMenu.shift); setContextMenu(null); }}>
                <Search size={14} /> Görüntüle
              </button>
              <button onClick={() => { handleEditShiftClick(contextMenu.shift); setContextMenu(null); }}>
                <Edit size={14} /> Düzenle
              </button>
              <button className="danger" onClick={() => { handleDeleteShift(contextMenu.shift.id); setContextMenu(null); }}>
                <X size={14} /> İptal / Kaldır
              </button>
            </div>
          )}
          {renderShifts()}
        </div>
        {/* Stilist Düzenleme Modalı */}
        {editingEmp && renderEditEmpModal()}

        {/* Özel Saat Belirleme Modalı */}
        {customShiftModal && renderCustomShiftModal()}

        {/* Şablon Hızlı Atama Modalı */}
        {templateAssignModal && renderTemplateAssignModal()}

        {/* Randevu Düzenleme Modalı */}
        {editingShiftModal && renderEditingShiftModal()}

        {/* Randevu Detay/Görüntüleme Modalı */}
        {viewingShiftModal && renderViewingShiftModal()}
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
            <span className="sidebar-role">Salon Yetkilisi</span>
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
            onClick={() => setActiveTab('departments')} 
            className={`sidebar-item ${activeTab === 'departments' ? 'active' : ''}`}
          >
            <Building2 size={18} className="sidebar-icon" /> Hizmet Kategorileri
          </button>
          <button 
            onClick={() => setActiveTab('employees')} 
            className={`sidebar-item ${activeTab === 'employees' ? 'active' : ''}`}
          >
            <Scissors size={18} className="sidebar-icon" /> Stilist Yönetimi
          </button>
          <button 
            onClick={() => setActiveTab('customers')} 
            className={`sidebar-item ${activeTab === 'customers' ? 'active' : ''}`}
          >
            <Users size={18} className="sidebar-icon" /> Müşteri CRM
          </button>
          <button 
            onClick={() => setActiveTab('shifts')} 
            className={`sidebar-item ${activeTab === 'shifts' ? 'active' : ''}`}
          >
            <Calendar size={18} className="sidebar-icon" /> Randevu Planlama
          </button>
          <button 
            onClick={() => setActiveTab('templates')} 
            className={`sidebar-item ${activeTab === 'templates' ? 'active' : ''}`}
          >
            <Settings size={18} className="sidebar-icon" /> Hazır Şablonlar
          </button>
          <button 
            onClick={() => setActiveTab('logs')} 
            className={`sidebar-item ${activeTab === 'logs' ? 'active' : ''}`}
          >
            <Activity size={18} className="sidebar-icon" /> İşlem Logları
          </button>
          <hr className="sidebar-divider" style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          <button 
            onClick={() => navigate('/past-appointments')} 
            className="sidebar-item"
          >
            <Calendar size={18} className="sidebar-icon" /> Geçmiş Randevular
          </button>
          <button 
            onClick={() => {
              if (profile?.plan_type !== 'premium') {
                setShowUpgradeModal(true);
              } else {
                navigate('/earnings');
              }
            }} 
            className="sidebar-item"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={18} className="sidebar-icon" /> Kazanç Paneli
            </div>
            {profile?.plan_type !== 'premium' && <Lock size={14} style={{ opacity: 0.6 }} />}
          </button>
          <button 
            onClick={() => {
              if (profile?.plan_type !== 'premium') {
                setShowUpgradeModal(true);
              } else {
                navigate('/expenses');
              }
            }} 
            className="sidebar-item"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wallet size={18} className="sidebar-icon" /> Giderler Paneli
            </div>
            {profile?.plan_type !== 'premium' && <Lock size={14} style={{ opacity: 0.6 }} />}
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={18} className="sidebar-icon" /> Ayarlar
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
              activeTab === 'overview' ? 'Salon Genel Durumu' :
              activeTab === 'departments' ? 'Hizmet / Görev Yönetimi' :
              activeTab === 'employees' ? 'Stilist Kadrosu' :
              activeTab === 'customers' ? 'Müşteri CRM Yönetimi' :
              activeTab === 'shifts' ? 'Haftalık Randevu Planı' :
              activeTab === 'templates' ? 'Hazır Randevu/Mola Şablonları' :
              activeTab === 'settings' ? 'Ayarlar ve Salon Profili' :
              'Salon İşlem Geçmişi (Audit Logs)'
            }</h1>
            <p>{
              activeTab === 'overview' ? 'Saloninizin genel durumunu ve lisans bilgilerinizi görüntüleyin.' :
              activeTab === 'departments' ? 'Hizmet Kategorileriı ve görev alanlarını yönetin.' :
              activeTab === 'employees' ? 'Stilist kadronuzu yönetin ve izin durumlarını takip edin.' :
              activeTab === 'customers' ? 'Müşteri bilgilerinizi kaydedin, kalıcı tercihlerini ve notlarını yönetin.' :
              activeTab === 'shifts' ? 'Sürükle bırak ile kolayca haftalık randevuları planlayın.' :
              activeTab === 'templates' ? 'Sık kullandığınız randevu şablonlarını yönetin.' :
              activeTab === 'settings' ? 'Salon profilinizi ve güvenlik ayarlarınızı yapılandırın.' :
              'Sistemdeki son işlemleri ve kullanıcı etkinliklerini inceleyin.'
            }</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {profile?.is_demo && (
              <div className="demo-plan-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={14} /> Demo Plan
                <div className="demo-plan-info">
                  ({profile.current_stylists || 0}/{profile.demo_stylist_limit || 2} stilist)
                </div>
              </div>
            )}
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
            <div className={`dashboard-alert ${messageType}`}>
              {messageType === 'success' ? '' : ''} {message}
            </div>
          )}

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'departments' && renderDepartments()}
          {activeTab === 'employees' && renderEmployees()}
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'shifts' && renderShifts()}
          {activeTab === 'templates' && renderTemplates()}
          {activeTab === 'logs' && renderAuditLogs()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {/* Silme Onay Modalı */}
      {confirmModal && renderConfirmModal()}

      {/* Hizmet Düzenleme Modalı */}
      {editingDept && renderEditDeptModal()}

      {/* Stilist Düzenleme Modalı */}
      {editingEmp && renderEditEmpModal()}

      {/* Müşteri Düzenleme Modalı */}
      {editingCust && renderEditCustModal()}

      {/* Özel Saat Belirleme Modalı */}
      {customShiftModal && renderCustomShiftModal()}

      {/* Şablon Hızlı Atama Modalı */}
      {templateAssignModal && renderTemplateAssignModal()}

      {/* Randevu Düzenleme Modalı */}
      {editingShiftModal && renderEditingShiftModal()}

      {/* Bugün Çalışan Stilistler Detay Modalı */}
      {todayAppointmentModal && renderTodayAppointmentModal()}

      {/* Randevu Detay/Görüntüleme Modalı */}
      {viewingShiftModal && renderViewingShiftModal()}

      {/* Şablon Düzenle Modali */}
      {editingTemplate && renderEditTemplateModal()}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-backdrop" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'center', padding: '2.5rem' }}>
            <div className="modal-header" style={{ justifyContent: 'center', borderBottom: 'none', padding: 0 }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#7c3aed', marginBottom: '1rem' }}>
                <Crown size={30} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem', color: '#0f172a' }}>Premium Özelliği Kilidini Açın</h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Finansal Gelir & Gider Paneli, Gelişmiş Raporlar ve Excel indirme yetenekleri yalnızca <strong>Premium Paket</strong> üyelerine sunulmaktadır.
            </p>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', border: '1px solid #e2e8f0', textAlign: 'left' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Premium Paket Ayrıcalıkları:</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: '#475569' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={14} style={{ color: '#10b981' }} /> Sınırsız Randevu ve Stilist</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={14} style={{ color: '#10b981' }} /> Gelir & Gider Finans Paneli</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={14} style={{ color: '#10b981' }} /> Excel Raporları & Analitik Grafikler</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setShowUpgradeModal(false)} className="modal-btn cancel" style={{ flex: 1, margin: 0 }}>Vazgeç</button>
              <a href="mailto:support@glowcut.com?subject=GlowCut Premium Upgrade" className="modal-btn submit" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
                Yükseltme Talebi İlet
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
