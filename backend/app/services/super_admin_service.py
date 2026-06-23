from app.models.salon import Salon
from app.models.user import User
from app.models.audit_log import AuditLog
from app.extensions import db
from datetime import datetime

class SuperAdminService:

    # === SALON YÖNETİM METOTLARI ===
    
    @staticmethod
    def create_company(name, license_end_date_str, manager_email, manager_password, actor_id, plan_type='demo'):
        """Yeni bir salon oluşturur, yöneticisini atar ve loglar"""
        if not name or not name.strip():
            return {"error": "Salon adı boş olamaz."}, 400
            
        name = name.strip()
        if Salon.query.filter_by(name=name).first():
            return {"error": "Bu isimde bir salon zaten mevcut."}, 400
            
        if not manager_email or not manager_email.strip():
            return {"error": "Yönetici e-posta adresi boş olamaz."}, 400
        
        manager_email = manager_email.strip().lower()
        if User.query.filter_by(email=manager_email).first():
            return {"error": "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten mevcut."}, 400

        if not manager_password or not manager_password.strip():
            return {"error": "Yönetici şifresi boş olamaz."}, 400

        try:
            end_date = datetime.strptime(license_end_date_str, "%Y-%m-%d")
        except ValueError:
            return {"error": "Geçersiz tarih formatı. YYYY-MM-DD olmalı."}, 400

        # Salonu oluştur
        is_demo = (plan_type == 'demo')
        new_salon = Salon(name=name, license_end_date=end_date, plan_type=plan_type, is_demo=is_demo)
        db.session.add(new_salon)
        db.session.commit()

        # Yöneticiyi oluştur
        new_admin = User(
            email=manager_email,
            role="admin",
            is_active=True,
            salon_id=new_salon.id
        )
        new_admin.set_password(manager_password.strip())
        db.session.add(new_admin)

        # Audit Logs
        log_salon = AuditLog(
            user_id=int(actor_id) if actor_id else None,
            action=f"Yeni salon oluşturuldu: {name} (Paket: {plan_type})"
        )
        db.session.add(log_salon)

        log_admin = AuditLog(
            user_id=int(actor_id) if actor_id else None,
            action=f"Salon yöneticisi oluşturuldu: {manager_email} (Salon: {name})"
        )
        db.session.add(log_admin)

        db.session.commit()

        return {
            "message": f"Salon ({name}) ve yönetici ({manager_email}) başarıyla oluşturuldu.",
            "company_id": new_salon.id
        }, 201

    @staticmethod
    def get_all_companies():
        """Tüm salonları ve bağlı admin sayılarını listeler"""
        salons = Salon.query.all()
        result = []
        for s in salons:
            admin_users = [u for u in s.users if u.role == 'admin']
            manager_email = admin_users[0].email if admin_users else "Yönetici Tanımlanmadı"
            result.append({
                "id": s.id,
                "name": s.name,
                "is_active": s.is_active,
                "plan_type": s.plan_type or ('demo' if s.is_demo else 'premium'),
                "license_start_date": s.license_start_date.strftime("%Y-%m-%d %H:%M:%S"),
                "license_end_date": s.license_end_date.strftime("%Y-%m-%d"),
                "admin_count": len(admin_users),
                "manager_email": manager_email
            })
        return result, 200

    @staticmethod
    def update_company(salon_id, name, license_end_date_str, manager_email, manager_password, actor_id, plan_type=None):
        """Salonun genel bilgilerini ve yöneticisini günceller"""
        salon = Salon.query.get(salon_id)
        if not salon:
            return {"error": "Salon bulunamadı."}, 404

        has_name_change = name is not None and name.strip() != salon.name
        
        has_license_change = False
        if license_end_date_str:
            try:
                new_date = datetime.strptime(license_end_date_str, "%Y-%m-%d")
                has_license_change = new_date != salon.license_end_date
            except ValueError:
                return {"error": "Geçersiz tarih formatı. YYYY-MM-DD olmalı."}, 400

        has_plan_change = plan_type is not None and plan_type != salon.plan_type

        # Yönetici bilgileri güncelleme kontrolü
        admin_user = User.query.filter_by(salon_id=salon_id, role='admin').first()
        has_email_change = False
        has_password_change = False

        if admin_user:
            has_email_change = manager_email is not None and manager_email.strip().lower() != admin_user.email
            has_password_change = manager_password is not None and manager_password.strip() != ""
            
            if has_email_change:
                new_email = manager_email.strip().lower()
                if User.query.filter_by(email=new_email).first():
                    return {"error": "Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor."}, 400

        if not has_name_change and not has_license_change and not has_email_change and not has_password_change and not has_plan_change:
            return {"message": "Herhangi bir değişiklik yapılmadı."}, 200

        # Güncellemeleri uygula
        if has_name_change:
            salon.name = name.strip()
        
        if has_license_change:
            salon.license_end_date = new_date

        if has_plan_change:
            salon.plan_type = plan_type
            salon.is_demo = (plan_type == 'demo')

        if admin_user:
            if has_email_change:
                old_email = admin_user.email
                admin_user.email = manager_email.strip().lower()
                log_email = AuditLog(
                    user_id=int(actor_id) if actor_id else None,
                    action=f"Salon yöneticisinin e-postası değiştirildi (Salon: {salon.name}): {old_email} -> {admin_user.email}"
                )
                db.session.add(log_email)

            if has_password_change:
                admin_user.set_password(manager_password.strip())
                log_pwd = AuditLog(
                    user_id=int(actor_id) if actor_id else None,
                    action=f"Salon yöneticisinin şifresi güncellendi (Salon: {salon.name}): {admin_user.email}"
                )
                db.session.add(log_pwd)

        log = AuditLog(user_id=int(actor_id) if actor_id else None, action=f"Salon genel bilgileri güncellendi (ID: {salon_id}): {salon.name}")
        db.session.add(log)
        db.session.commit()

        return {"message": "Salon bilgileri başarıyla güncellendi."}, 200

    @staticmethod
    def update_company_license(salon_id, license_end_date_str, actor_id):
        """Salonun lisans süresini günceller"""
        salon = Salon.query.get(salon_id)
        if not salon:
            return {"error": "Salon bulunamadı."}, 404

        try:
            new_end_date = datetime.strptime(license_end_date_str, "%Y-%m-%d")
        except ValueError:
            return {"error": "Geçersiz tarih formatı. YYYY-MM-DD olmalı."}, 400

        if salon.license_end_date == new_end_date:
            return {"message": "Herhangi bir değişiklik yapılmadı."}, 200

        old_date_str = salon.license_end_date.strftime("%Y-%m-%d")
        salon.license_end_date = new_end_date
        db.session.commit()

        # Audit Log Kaydı
        log = AuditLog(user_id=int(actor_id) if actor_id else None, action=f"'{salon.name}' salonunun lisans tarihi güncellendi. Eski: {old_date_str} -> Yeni: {license_end_date_str}")
        db.session.add(log)
        db.session.commit()

        return {"message": f"'{salon.name}' salonunun lisans süresi başarıyla güncellendi."}, 200

    @staticmethod
    def toggle_company_status(salon_id, actor_id):
        """Salonu dondurur veya aktifleştirir"""
        salon = Salon.query.get(salon_id)
        if not salon:
            return {"error": "Salon bulunamadı."}, 404

        salon.is_active = not salon.is_active
        status_text = "Aktif" if salon.is_active else "Pasif (Donduruldu)"
        db.session.commit()

        log = AuditLog(user_id=int(actor_id) if actor_id else None, action=f"Salon durumu değiştirildi (ID: {salon_id}): {status_text}")
        db.session.add(log)
        db.session.commit()

        return {"message": f"Salon durumu güncellendi: {status_text}"}, 200

    @staticmethod
    def delete_company(salon_id, actor_id):
        """Salonu ve ona bağlı her şeyi sistemden siler"""
        salon = Salon.query.get(salon_id)
        if not salon:
            return {"error": "Salon bulunamadı."}, 404

        salon_name = salon.name
        db.session.delete(salon)
        db.session.commit()

        log = AuditLog(user_id=int(actor_id) if actor_id else None, action=f"Salon sistemden silindi: {salon_name}")
        db.session.add(log)
        db.session.commit()

        return {"message": f"'{salon_name}' salonu ve bağlı tüm veriler silindi."}, 200


    # === KULLANICI / ADMIN YÖNETİM METOTLARI ===

    @staticmethod
    def get_company_admins(salon_id):
        """Belirli bir salona ait tüm admin kullanıcılarını listeler"""
        salon = Salon.query.get(salon_id)
        if not salon:
            return {"error": "Salon bulunamadı."}, 404

        admins = User.query.filter_by(salon_id=salon_id, role='admin').all()
        result = []
        for a in admins:
            result.append({
                "id": a.id,
                "email": a.email,
                "is_active": a.is_active,
                "created_at": a.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return result, 200

    @staticmethod
    def update_user(user_id, email, password, is_active, actor_id):
        """Diğer kullanıcıların (Adminlerin) bilgilerini günceller"""
        user = User.query.get(user_id)
        if not user:
            return {"error": "Kullanıcı bulunamadı."}, 404

        has_email_change = email is not None and email != user.email
        has_password_change = password is not None and not user.check_password(password)
        has_status_change = is_active is not None and is_active != user.is_active

        if not has_email_change and not has_password_change and not has_status_change:
            return {"message": "Herhangi bir değişiklik yapılmadı."}, 200

        if has_email_change:
            if User.query.filter_by(email=email).first():
                return {"error": "Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor."}, 400
            user.email = email

        if has_password_change:
            user.set_password(password)

        if has_status_change:
            user.is_active = is_active

        db.session.commit()

        log = AuditLog(user_id=int(actor_id) if actor_id else None, action=f"Kullanıcı bilgi güncellemesi (ID: {user_id}): {user.email}")
        db.session.add(log)
        db.session.commit()

        return {"message": "Kullanıcı bilgileri başarıyla güncellendi."}, 200

    @staticmethod
    def toggle_user_status(user_id, actor_id):
        """Admin hesabını dondurur veya aktifleştirir"""
        user = User.query.get(user_id)
        if not user:
            return {"error": "Kullanıcı bulunamadı."}, 404

        user.is_active = not user.is_active
        status_text = "Aktif" if user.is_active else "Pasif"
        db.session.commit()

        log = AuditLog(user_id=int(actor_id) if actor_id else None, action=f"Kullanıcı durumu değiştirildi (ID: {user_id}): {status_text}")
        db.session.add(log)
        db.session.commit()

        return {"message": f"Kullanıcı durumu güncellendi: {status_text}"}, 200

    @staticmethod
    def delete_user(user_id, actor_id):
        """Kullanıcıyı (Admini) tamamen siler"""
        user = User.query.get(user_id)
        if not user:
            return {"error": "Kullanıcı bulunamadı."}, 404

        user_email = user.email
        db.session.delete(user)
        db.session.commit()

        log = AuditLog(user_id=int(actor_id) if actor_id else None, action=f"Kullanıcı sistemden silindi: {user_email}")
        db.session.add(log)
        db.session.commit()

        return {"message": f"'{user_email}' kullanıcısı sistemden başarıyla silindi."}, 200