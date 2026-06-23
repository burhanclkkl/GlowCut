import os
from datetime import datetime, timedelta
from app import create_app
from app.extensions import db
from app.models.salon import Salon
from app.models.user import User
from app.models.service import Service
from app.models.stylist import Stylist
from app.models.customer import Customer
from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.expense import Expense
from app.models.appointment_template import AppointmentTemplate

# Flask uygulamasını başlat
app = create_app()

def seed_database():
    print("Veritabanı tohumlama (seeding) işlemi başlatıldı...")
    
    with app.app_context():
        # 1. Eski verileri temizle
        print("Mevcut veriler temizleniyor...")
        Appointment.query.delete()
        AppointmentTemplate.query.delete()
        Expense.query.delete()
        AuditLog.query.delete()
        Stylist.query.delete()
        Customer.query.delete()
        Service.query.delete()
        User.query.delete()
        Salon.query.delete()
        db.session.commit()
        
        # 2. Salonları Oluştur
        print("Salonlar oluşturuluyor...")
        license_start = datetime.utcnow()
        license_end = license_start + timedelta(days=365) # 1 Yıllık lisans
        
        # 2a. Demo Salonu
        salon_demo = Salon(
            name="GlowCut Demo Salonu",
            is_active=True,
            plan_type="demo",
            is_demo=True,
            license_start_date=license_start,
            license_end_date=license_start + timedelta(days=14) # 14 günlük deneme
        )
        db.session.add(salon_demo)
        
        # 2b. Standart Salonu
        salon_standart = Salon(
            name="GlowCut Standart Salonu",
            is_active=True,
            plan_type="standart",
            is_demo=False,
            license_start_date=license_start,
            license_end_date=license_end
        )
        db.session.add(salon_standart)
        
        # 2c. Premium Salonu
        salon_premium = Salon(
            name="Lüks Makas Salon & Spa",
            is_active=True,
            plan_type="premium",
            is_demo=False,
            license_start_date=license_start,
            license_end_date=license_end
        )
        db.session.add(salon_premium)
        db.session.commit() # ID'leri almak için
        
        # 3. Kullanıcılar (Super Admin ve Salon Adminleri) Oluştur
        print("Sistem yöneticileri oluşturuluyor...")
        
        # Super Admin
        super_admin = User(
            email="superadmin@glowcut.com",
            role="super_admin",
            is_active=True
        )
        super_admin.set_password("admin123")
        db.session.add(super_admin)
        
        # Demo Admin
        admin_demo = User(
            email="demo@glowcut.com",
            role="admin",
            is_active=True,
            salon_id=salon_demo.id
        )
        admin_demo.set_password("admin123")
        db.session.add(admin_demo)
        
        # Standart Admin
        admin_standart = User(
            email="standart@glowcut.com",
            role="admin",
            is_active=True,
            salon_id=salon_standart.id
        )
        admin_standart.set_password("admin123")
        db.session.add(admin_standart)
        
        # Premium Admin 1
        admin_premium = User(
            email="premium@glowcut.com",
            role="admin",
            is_active=True,
            salon_id=salon_premium.id
        )
        admin_premium.set_password("admin123")
        db.session.add(admin_premium)

        # Premium Admin 2 (Geriye dönük uyumluluk için luksmakas@glowcut.com)
        admin_luksmakas = User(
            email="luksmakas@glowcut.com",
            role="admin",
            is_active=True,
            salon_id=salon_premium.id
        )
        admin_luksmakas.set_password("admin123")
        db.session.add(admin_luksmakas)
        db.session.commit()
        
        # --- DEMO SALONU VERİLERİ ---
        print("Demo salonu verileri oluşturuluyor...")
        srv_demo_cut = Service(name="Hızlı Kesim", salon_id=salon_demo.id)
        db.session.add(srv_demo_cut)
        db.session.commit()
        
        st_demo = Stylist(
            first_name="Caner",
            last_name="Berber",
            phone_number="+905559990011",
            is_active=True,
            salon_id=salon_demo.id,
            service_id=srv_demo_cut.id
        )
        db.session.add(st_demo)
        
        cust_demo = Customer(
            first_name="Hakan",
            last_name="Deneme",
            phone_number="+905329990011",
            notes="Hassas kafa derisi.",
            is_active=True,
            salon_id=salon_demo.id
        )
        db.session.add(cust_demo)
        db.session.commit()
        
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        app_demo = Appointment(
            stylist_id=st_demo.id,
            customer_id=cust_demo.id,
            service_id=srv_demo_cut.id,
            start_datetime=today + timedelta(hours=10),
            end_datetime=today + timedelta(hours=10, minutes=45),
            price=300.0,
            notes="Erkek saç tıraşı.",
            status="confirmed",
            created_by_id=admin_demo.id
        )
        db.session.add(app_demo)
        
        # --- STANDART SALONU VERİLERİ ---
        print("Standart salonu verileri oluşturuluyor...")
        srv_standart_cut = Service(name="Makas Kesimi", salon_id=salon_standart.id)
        srv_standart_blow = Service(name="Kurutma & Fön", salon_id=salon_standart.id)
        db.session.add_all([srv_standart_cut, srv_standart_blow])
        db.session.commit()
        
        st_std1 = Stylist(
            first_name="Merve",
            last_name="Yılmaz",
            phone_number="+905558880011",
            is_active=True,
            salon_id=salon_standart.id,
            service_id=srv_standart_cut.id
        )
        st_std2 = Stylist(
            first_name="Kadir",
            last_name="Kuaför",
            phone_number="+905558880022",
            is_active=True,
            salon_id=salon_standart.id,
            service_id=srv_standart_blow.id
        )
        db.session.add_all([st_std1, st_std2])
        
        cust_std1 = Customer(
            first_name="Dilek",
            last_name="Öz",
            phone_number="+905328880011",
            notes="Fön çekilirken ısıya dikkat edilmeli.",
            is_active=True,
            salon_id=salon_standart.id
        )
        cust_std2 = Customer(
            first_name="Bora",
            last_name="Koç",
            phone_number="+905328880022",
            notes="",
            is_active=True,
            salon_id=salon_standart.id
        )
        db.session.add_all([cust_std1, cust_std2])
        db.session.commit()
        
        app_std1 = Appointment(
            stylist_id=st_std1.id,
            customer_id=cust_std1.id,
            service_id=srv_standart_cut.id,
            start_datetime=today + timedelta(hours=11),
            end_datetime=today + timedelta(hours=12),
            price=400.0,
            notes="Düz uçlu saç kesimi.",
            status="confirmed",
            created_by_id=admin_standart.id
        )
        app_std2 = Appointment(
            stylist_id=st_std2.id,
            customer_id=cust_std2.id,
            service_id=srv_standart_blow.id,
            start_datetime=today + timedelta(hours=13),
            end_datetime=today + timedelta(hours=13, minutes=30),
            price=150.0,
            notes="Kırık fön.",
            status="confirmed",
            created_by_id=admin_standart.id
        )
        db.session.add_all([app_std1, app_std2])
        
        # --- PREMIUM SALONU VERİLERİ ---
        print("Premium salonu verileri oluşturuluyor...")
        srv_cut = Service(name="Saç Kesim & Tasarım", salon_id=salon_premium.id)
        srv_color = Service(name="Renklendirme & Boya", salon_id=salon_premium.id)
        srv_care = Service(name="El & Ayak Bakımı", salon_id=salon_premium.id)
        db.session.add_all([srv_cut, srv_color, srv_care])
        db.session.commit()
        
        st_ahmet = Stylist(
            first_name="Ahmet",
            last_name="Kaya",
            phone_number="+905551112233",
            is_active=True,
            salon_id=salon_premium.id,
            service_id=srv_cut.id
        )
        st_ayse = Stylist(
            first_name="Ayşe",
            last_name="Yılmaz",
            phone_number="+905551112244",
            is_active=True,
            salon_id=salon_premium.id,
            service_id=srv_color.id
        )
        st_burak = Stylist(
            first_name="Burak",
            last_name="Demir",
            phone_number="+905551112255",
            is_active=True,
            salon_id=salon_premium.id,
            service_id=srv_care.id
        )
        st_elif = Stylist(
            first_name="Elif",
            last_name="Çelik",
            phone_number="+905551112266",
            is_active=True,
            salon_id=salon_premium.id,
            service_id=srv_cut.id
        )
        db.session.add_all([st_ahmet, st_ayse, st_burak, st_elif])
        
        cust_canan = Customer(
            first_name="Canan",
            last_name="Öztürk",
            phone_number="+905321112233",
            notes="Kuru saç tipine sahip. Katlı kesim tercih ediyor.",
            is_active=True,
            salon_id=salon_premium.id
        )
        cust_elif = Customer(
            first_name="Elif",
            last_name="Şahin",
            phone_number="+905321112244",
            notes="Alerjik cilt. Bitkisel saç boyası tercih eder.",
            is_active=True,
            salon_id=salon_premium.id
        )
        cust_merve = Customer(
            first_name="Merve",
            last_name="Yılmaz",
            phone_number="+905321112255",
            notes="Kalıcı oje tonlarında bordo renk favorisi.",
            is_active=True,
            salon_id=salon_premium.id
        )
        cust_selin = Customer(
            first_name="Selin",
            last_name="Demir",
            phone_number="+905321112266",
            notes="Fön sonrası hafif saç spreyi ister.",
            is_active=True,
            salon_id=salon_premium.id
        )
        db.session.add_all([cust_canan, cust_elif, cust_merve, cust_selin])
        db.session.commit()
        
        app1 = Appointment(
            stylist_id=st_ahmet.id,
            customer_id=cust_canan.id,
            service_id=srv_cut.id,
            start_datetime=today + timedelta(hours=9),
            end_datetime=today + timedelta(hours=10, minutes=30),
            price=450.0,
            notes="Katlı kesim ve fön istiyor.",
            status="confirmed",
            created_by_id=admin_premium.id
        )
        app2 = Appointment(
            stylist_id=st_ayse.id,
            customer_id=cust_elif.id,
            service_id=srv_color.id,
            start_datetime=today + timedelta(hours=11),
            end_datetime=today + timedelta(hours=13, minutes=30),
            price=1200.0,
            notes="Küllü sarı tonlarında dip boyası ve komple ombre.",
            status="confirmed",
            created_by_id=admin_premium.id
        )
        app3 = Appointment(
            stylist_id=st_burak.id,
            customer_id=cust_merve.id,
            service_id=srv_care.id,
            start_datetime=today + timedelta(hours=14),
            end_datetime=today + timedelta(hours=15, minutes=30),
            price=350.0,
            notes="Manikür & Pedikür (Kalıcı oje rengi bordo, no:35)",
            status="confirmed",
            created_by_id=admin_premium.id
        )
        app4 = Appointment(
            stylist_id=st_elif.id,
            customer_id=cust_selin.id,
            service_id=srv_cut.id,
            start_datetime=today + timedelta(days=1, hours=10),
            end_datetime=today + timedelta(days=1, hours=11),
            price=150.0,
            notes="Hafif dalgalı kırık fön.",
            status="confirmed",
            created_by_id=admin_premium.id
        )
        db.session.add_all([app1, app2, app3, app4])
        
        # Premium Giderler
        exp1 = Expense(
            title="Dükkan Kirası",
            amount=8000.0,
            category="Kira",
            date=today.date(),
            notes="Haziran ayı kira bedeli",
            salon_id=salon_premium.id,
            payment_status="Ödendi",
            payment_type="Havale"
        )
        exp2 = Expense(
            title="Elektrik & Su Faturası",
            amount=1500.0,
            category="Fatura",
            date=today.date(),
            notes="",
            salon_id=salon_premium.id,
            payment_status="Ödendi",
            payment_type="Kredi Kartı"
        )
        db.session.add_all([exp1, exp2])
        
        log = AuditLog(
            user_id=admin_premium.id,
            action="SEEDING: Sistem veritabanı GlowCut CRM 3 paket yapısı ile seed.py tarafından başarıyla tohumlandı.",
            ip_address="127.0.0.1"
        )
        db.session.add(log)
        db.session.commit()
        
    print("\nTohumlama işlemi başarıyla tamamlandı!")
    print("---------------------------------------")
    print("Eklenen Veriler:")
    print("- Super Admin: superadmin@glowcut.com / admin123")
    print("- Demo Admin: demo@glowcut.com / admin123")
    print("- Standart Admin: standart@glowcut.com / admin123")
    print("- Premium Admin: premium@glowcut.com ve luksmakas@glowcut.com / admin123")
    print("- Örnek Randevular: Müşteri ve stilistler bağlanarak başarıyla oluşturuldu.")
    print("---------------------------------------")

if __name__ == "__main__":
    seed_database()
