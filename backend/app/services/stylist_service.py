from app.models.stylist import Stylist
from app.models.service import Service
from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.extensions import db
from datetime import datetime

class StylistService:

    @staticmethod
    def create_stylist(first_name, last_name, phone, service_id, salon_id, actor_id):
        """Adminin kendi salonuna yeni bir stilist/kuaför eklemesini sağlar"""
        
        from app.models.salon import Salon
        
        # Check demo plan limits
        salon = Salon.query.get(salon_id)
        if salon and salon.is_demo:
            stylist_count = Stylist.query.filter_by(salon_id=salon_id).count()
            if stylist_count >= 2:
                return {"error": "Demo plan maksimum 2 stilist sınırına ulaştı. Demo plan sınırlamalarını kaldırmak için yükseltme yapınız."}, 400
        
        # 1. Güvenlik ve Kurumsal Kontrol: Atanmak istenen hizmet alanı gerçekten bu salona mı ait?
        srv = Service.query.filter_by(id=service_id, salon_id=salon_id).first()
        if not srv:
            return {"error": "Seçilen hizmet alanı bulunamadı veya bu salona ait değil."}, 400

        # 2. Salon içi benzersiz telefon kontrolü
        if phone:
            existing_phone = Stylist.query.filter_by(phone_number=phone, salon_id=salon_id).first()
            if existing_phone:
                return {"error": "Bu telefon numarasıyla kayıtlı bir stilist zaten var."}, 400

        # 3. Stilisti oluştur
        new_stylist = Stylist(
            first_name=first_name,
            last_name=last_name,
            phone_number=phone,
            service_id=service_id,
            salon_id=salon_id
        )
        db.session.add(new_stylist)
        db.session.commit()

        # Audit Log
        log = AuditLog(user_id=actor_id, action=f"Yeni stilist eklendi: {first_name} {last_name} (Hizmet: {srv.name})")
        db.session.add(log)
        db.session.commit()

        return {
            "message": f"Stilist başarıyla oluşturuldu: {first_name} {last_name}",
            "stylist_id": new_stylist.id
        }, 201

    @staticmethod
    def get_my_stylists(salon_id):
        """Sadece istek atan adminin salonuna ait stilistleri listeler"""
        stylists = Stylist.query.filter_by(salon_id=salon_id).all()
        result = []
        for s in stylists:
            result.append({
                "id": s.id,
                "first_name": s.first_name,
                "last_name": s.last_name,
                "phone": s.phone_number,
                "is_active": s.is_active,
                "service": {
                    "id": s.service.id,
                    "name": s.service.name
                } if s.service else None
            })
        return result, 200

    @staticmethod
    def update_stylist(stylist_id, first_name, last_name, phone, service_id, is_active, salon_id, actor_id):
        """Adminin kendi salonuna ait bir stilisti güncellemesini sağlar"""
        
        # Güvenlik Kontrolü: Stilist var mı ve bu salona mı ait?
        stylist = Stylist.query.filter_by(id=stylist_id, salon_id=salon_id).first()
        if not stylist:
            return {"error": "Stilist bulunamadı veya bu işlem için yetkiniz yok."}, 404

        has_first_name_change = first_name is not None and first_name != stylist.first_name
        has_last_name_change = last_name is not None and last_name != stylist.last_name
        has_phone_change = phone is not None and phone != stylist.phone_number
        has_srv_change = service_id is not None and service_id != stylist.service_id
        has_status_change = is_active is not None and is_active != stylist.is_active

        if not has_first_name_change and not has_last_name_change and not has_phone_change and not has_srv_change and not has_status_change:
            return {"message": "Herhangi bir değişiklik yapılmadı."}, 200

        # Eğer hizmet kategorisi değiştirilmek isteniyorsa, yeni kategori bu salona mı ait kontrolü
        if has_srv_change:
            srv = Service.query.filter_by(id=service_id, salon_id=salon_id).first()
            if not srv:
                return {"error": "Seçilen yeni hizmet alanı bu salona ait değil."}, 400
            stylist.service_id = service_id

        # Telefon çakışma kontrolü
        if has_phone_change:
            existing_phone = Stylist.query.filter_by(phone_number=phone, salon_id=salon_id).first()
            if existing_phone and existing_phone.id != stylist_id:
                return {"error": "Bu telefon numarası başka bir stilist tarafından kullanılıyor."}, 400
            stylist.phone_number = phone

        if has_first_name_change: stylist.first_name = first_name
        if has_last_name_change: stylist.last_name = last_name
        if has_status_change: stylist.is_active = is_active

        db.session.commit()

        # Audit Log
        log = AuditLog(user_id=actor_id, action=f"Stilist bilgileri güncellendi (ID: {stylist_id}): {stylist.first_name} {stylist.last_name}")
        db.session.add(log)
        db.session.commit()

        return {"message": "Stilist bilgileri başarıyla güncellendi."}, 200

    @staticmethod
    def delete_stylist(stylist_id, salon_id, actor_id):
        """Adminin kendi salonuna ait bir stilisti sistemden silmesini sağlar"""
        stylist = Stylist.query.filter_by(id=stylist_id, salon_id=salon_id).first()
        if not stylist:
            return {"error": "Stilist bulunamadı veya bu işlem için yetkiniz yok."}, 404

        stylist_name = f"{stylist.first_name} {stylist.last_name}"
        db.session.delete(stylist)
        db.session.commit()

        # Audit Log
        log = AuditLog(user_id=actor_id, action=f"Stilist sistemden silindi: {stylist_name}")
        db.session.add(log)
        db.session.commit()

        return {"message": f"'{stylist_name}' isimli stilist sistemden başarıyla silindi."}, 200

    @staticmethod
    def get_stylist_earnings(stylist_id, salon_id, start_date=None, end_date=None):
        """Bir stilistin belirli bir dönem için kazandığı toplam tutarı hesapla"""
        stylist = Stylist.query.filter_by(id=stylist_id, salon_id=salon_id).first()
        if not stylist:
            return {"error": "Stilist bulunamadı veya bu işlem için yetkiniz yok."}, 404
        
        query = Appointment.query.filter(
            Appointment.stylist_id == stylist_id,
            Appointment.status.in_(['confirmed', 'completed'])
        )
        
        if start_date:
            query = query.filter(Appointment.start_datetime >= start_date)
        if end_date:
            query = query.filter(Appointment.start_datetime <= end_date)
        
        appointments = query.all()
        total_earnings = sum(app.price for app in appointments if app.price)
        
        return {
            "stylist_id": stylist_id,
            "stylist_name": f"{stylist.first_name} {stylist.last_name}",
            "total_earnings": total_earnings,
            "appointment_count": len(appointments)
        }, 200

    @staticmethod
    def get_salon_earnings_report(salon_id, start_date=None, end_date=None):
        """Bir salondaki tüm stilistlerin kazanç raporunu al"""
        stylists = Stylist.query.filter_by(salon_id=salon_id).all()
        
        result = []
        total_salon_earnings = 0
        
        for stylist in stylists:
            query = Appointment.query.filter(
                Appointment.stylist_id == stylist.id,
                Appointment.status.in_(['confirmed', 'completed'])
            )
            
            if start_date:
                query = query.filter(Appointment.start_datetime >= start_date)
            if end_date:
                query = query.filter(Appointment.start_datetime <= end_date)
            
            appointments = query.all()
            earnings = sum(app.price for app in appointments if app.price)
            total_salon_earnings += earnings
            
            result.append({
                "stylist_id": stylist.id,
                "stylist_name": f"{stylist.first_name} {stylist.last_name}",
                "service": stylist.service.name if stylist.service else "N/A",
                "earnings": earnings,
                "appointment_count": len(appointments)
            })
        
        return {
            "salon_earnings": result,
            "total_earnings": total_salon_earnings
        }, 200
