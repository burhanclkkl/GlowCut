from app.models.service import Service
from app.models.audit_log import AuditLog
from app.extensions import db

class AdminService:

    @staticmethod
    def create_service(name, salon_id, actor_id, price=None):
        """Adminin kendi salonuna özel yeni bir hizmet alanı/kategorisi eklemesini sağlar"""
        # Aynı salonda aynı isimde iki hizmet olamaz
        existing = Service.query.filter_by(name=name, salon_id=salon_id).first()
        if existing:
            return {"error": f"'{name}' adında bir hizmet kategorisi salonunuzda zaten mevcut."}, 400

        new_srv = Service(name=name, salon_id=salon_id, price=price)
        db.session.add(new_srv)
        db.session.commit()

        # İşlem loglama
        log = AuditLog(user_id=actor_id, action=f"Salona yeni hizmet kategorisi eklendi: {name} (Fiyat: {price or 'Belirtilmedi'}, Salon ID: {salon_id})")
        db.session.add(log)
        db.session.commit()

        return {"message": f"'{name}' hizmet kategorisi başarıyla oluşturuldu.", "service_id": new_srv.id}, 201

    @staticmethod
    def get_my_services(salon_id):
        """
        Sadece istek atan adminin salonuna ait hizmetleri ve stilist sayılarını listeler.
        """
        from sqlalchemy import func
        from app.models.stylist import Stylist

        services = Service.query.filter_by(salon_id=salon_id).all()
        result = []
        for s in services:
            stylist_count = Stylist.query.filter_by(service_id=s.id).count()
            result.append({
                "id": s.id,
                "name": s.name,
                "price": s.price,
                "stylist_count": stylist_count
            })
        return result, 200

    @staticmethod
    def update_service(service_id, name, salon_id, actor_id, price=None):
        """Adminin kendi salonuna ait bir hizmet kategorisini güncellemesini sağlar"""
        dept = Service.query.filter_by(id=service_id, salon_id=salon_id).first()
        if not dept:
            return {"error": "Hizmet kategorisi bulunamadı veya bu işlem için yetkiniz yok."}, 404

        if not name or not name.strip():
            return {"error": "Hizmet kategorisi adı boş olamaz."}, 400

        name = name.strip()
        
        changes = []
        
        if name != dept.name:
            # Başka bir hizmet kategorisi ismiyle çakışma kontrolü
            existing = Service.query.filter_by(name=name, salon_id=salon_id).first()
            if existing and existing.id != service_id:
                return {"error": f"'{name}' adında başka bir hizmet kategorisi zaten mevcut."}, 400
            
            changes.append(f"İsim: {dept.name} -> {name}")
            dept.name = name
        
        if price is not None and price != dept.price:
            changes.append(f"Fiyat: {dept.price} -> {price}")
            dept.price = price
        
        if not changes:
            return {"message": "Herhangi bir değişiklik yapılmadı."}, 200
        
        db.session.commit()

        # İşlem loglama
        log = AuditLog(user_id=actor_id, action=f"Hizmet kategorisi güncellendi: {', '.join(changes)}")
        db.session.add(log)
        db.session.commit()

        return {"message": "Hizmet kategorisi başarıyla güncellendi."}, 200

    @staticmethod
    def delete_service(service_id, salon_id, actor_id):
        """Adminin kendi salonuna ait bir hizmet kategorisini silmesini sağlar"""
        dept = Service.query.filter_by(id=service_id, salon_id=salon_id).first()
        if not dept:
            return {"error": "Hizmet kategorisi bulunamadı veya bu işlem için yetkiniz yok."}, 404

        # Kurumsal Kontrol: Eğer kategoriye bağlı stilistler varsa silme engellenmeli
        if len(dept.stylists) > 0:
            return {"error": "Bu hizmet kategorisine bağlı stilistler bulunmaktadır. Önce stilistlerin hizmet alanını değiştiriniz."}, 400

        dept_name = dept.name
        db.session.delete(dept)
        db.session.commit()

        # İşlem loglama
        log = AuditLog(user_id=actor_id, action=f"Hizmet kategorisi silindi: {dept_name}")
        db.session.add(log)
        db.session.commit()

        return {"message": f"'{dept_name}' hizmet kategorisi başarıyla silindi."}, 200

    @staticmethod
    def get_audit_logs(salon_id=None, is_super_admin=False):
        """Salona ait veya (super admin ise) tüm sistem loglarını getirir."""
        from app.models.user import User

        if is_super_admin and not salon_id:
            query = db.session.query(
                AuditLog.id,
                AuditLog.action,
                AuditLog.ip_address,
                AuditLog.timestamp,
                User.email
            ).outerjoin(User, AuditLog.user_id == User.id).order_by(AuditLog.timestamp.desc())
        else:
            query = db.session.query(
                AuditLog.id,
                AuditLog.action,
                AuditLog.ip_address,
                AuditLog.timestamp,
                User.email
            ).join(User, AuditLog.user_id == User.id).filter(User.salon_id == salon_id).order_by(AuditLog.timestamp.desc())

        logs = query.all()
        result = []
        for l in logs:
            result.append({
                "id": l.id,
                "user_email": l.email if l.email else "Sistem",
                "action": l.action,
                "ip_address": l.ip_address,
                "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            })
        return result, 200

    @staticmethod
    def get_profile(user_id, salon_id):
        from app.models.user import User
        from app.models.salon import Salon
        from app.models.stylist import Stylist
        from app.models.customer import Customer
        from datetime import datetime
        
        user = User.query.get(user_id)
        salon = Salon.query.get(salon_id)
        
        if not user or not salon:
            return {"error": "Kullanıcı veya salon bulunamadı."}, 404
            
        remaining_days = 0
        if salon.license_end_date:
            delta = salon.license_end_date - datetime.utcnow()
            remaining_days = max(0, delta.days)
        
        response = {
            "email": user.email,
            "company_name": salon.name,
            "license_end_date": salon.license_end_date.strftime('%Y-%m-%d %H:%M:%S') if salon.license_end_date else None,
            "remaining_days": remaining_days,
            "is_demo": salon.is_demo,
            "plan_type": salon.plan_type or ('demo' if salon.is_demo else 'premium')
        }
        
        # Add demo limits if enabled
        if salon.is_demo:
            stylist_count = Stylist.query.filter_by(salon_id=salon_id).count()
            customer_count = Customer.query.filter_by(salon_id=salon_id).count()
            response.update({
                "demo_stylist_limit": 2,
                "demo_customer_limit": 10,
                "current_stylists": stylist_count,
                "current_customers": customer_count
            })
            
        return response, 200

    @staticmethod
    def update_profile(user_id, salon_id, data):
        from app.models.user import User
        from app.models.salon import Salon
        
        user = User.query.get(user_id)
        salon = Salon.query.get(salon_id)
        
        if not user or not salon:
            return {"error": "Kullanıcı veya salon bulunamadı."}, 404
            
        # Salon adını güncelle
        new_company_name = data.get("company_name")
        if new_company_name and new_company_name.strip():
            existing = Salon.query.filter(Salon.name == new_company_name.strip(), Salon.id != salon_id).first()
            if existing:
                return {"error": "Bu salon adı zaten kullanılıyor."}, 400
            salon.name = new_company_name.strip()
            
        # Şifre güncelle
        new_password = data.get("new_password")
        if new_password and len(new_password) >= 6:
            user.set_password(new_password)
            
        db.session.commit()
        return {"message": "Profil başarıyla güncellendi."}, 200
