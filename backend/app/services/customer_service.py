from app.models.customer import Customer
from app.models.audit_log import AuditLog
from app.extensions import db

class CustomerService:

    @staticmethod
    def create_customer(first_name, last_name, phone, notes, salon_id, actor_id):
        """Adminin kendi salonuna yeni bir müşteri eklemesini sağlar"""
        
        from app.models.salon import Salon
        
        # Check demo plan limits
        salon = Salon.query.get(salon_id)
        if salon and salon.is_demo:
            customer_count = Customer.query.filter_by(salon_id=salon_id).count()
            if customer_count >= 10:
                return {"error": "Demo plan maksimum 10 müşteri sınırına ulaştı. Demo plan sınırlamalarını kaldırmak için yükseltme yapınız."}, 400
        
        # 1. Salon içi benzersiz telefon kontrolü
        if phone:
            existing_phone = Customer.query.filter_by(phone_number=phone, salon_id=salon_id).first()
            if existing_phone:
                return {"error": "Bu telefon numarasıyla kayıtlı bir müşteri zaten var."}, 400

        # 2. Müşteriyi oluştur
        new_customer = Customer(
            first_name=first_name,
            last_name=last_name,
            phone_number=phone,
            notes=notes,
            salon_id=salon_id
        )
        db.session.add(new_customer)
        db.session.commit()

        # Audit Log
        log = AuditLog(user_id=actor_id, action=f"Yeni müşteri eklendi: {first_name} {last_name}")
        db.session.add(log)
        db.session.commit()

        return {
            "message": f"Müşteri başarıyla oluşturuldu: {first_name} {last_name}",
            "customer_id": new_customer.id
        }, 201

    @staticmethod
    def get_my_customers(salon_id):
        """Salon sahibi adminin salonuna ait müşterileri listeler"""
        customers = Customer.query.filter_by(salon_id=salon_id).all()
        result = []
        for c in customers:
            result.append({
                "id": c.id,
                "first_name": c.first_name,
                "last_name": c.last_name,
                "phone": c.phone_number,
                "notes": c.notes,
                "is_active": c.is_active,
                "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return result, 200

    @staticmethod
    def update_customer(customer_id, first_name, last_name, phone, notes, is_active, salon_id, actor_id):
        """Müşteri bilgilerinin güncellenmesi"""
        customer = Customer.query.filter_by(id=customer_id, salon_id=salon_id).first()
        if not customer:
            return {"error": "Müşteri bulunamadı veya bu işlem için yetkiniz yok."}, 404

        has_first_name_change = first_name is not None and first_name != customer.first_name
        has_last_name_change = last_name is not None and last_name != customer.last_name
        has_phone_change = phone is not None and phone != customer.phone_number
        has_notes_change = notes is not None and notes != customer.notes
        has_status_change = is_active is not None and is_active != customer.is_active

        if not has_first_name_change and not has_last_name_change and not has_phone_change and not has_notes_change and not has_status_change:
            return {"message": "Herhangi bir değişiklik yapılmadı."}, 200

        # Telefon çakışma kontrolü
        if has_phone_change and phone:
            existing_phone = Customer.query.filter_by(phone_number=phone, salon_id=salon_id).first()
            if existing_phone and existing_phone.id != customer_id:
                return {"error": "Bu telefon numarası başka bir müşteri tarafından kullanılıyor."}, 400
            customer.phone_number = phone

        if has_first_name_change: customer.first_name = first_name
        if has_last_name_change: customer.last_name = last_name
        if has_notes_change: customer.notes = notes
        if has_status_change: customer.is_active = is_active

        db.session.commit()

        # Audit Log
        log = AuditLog(user_id=actor_id, action=f"Müşteri bilgileri güncellendi (ID: {customer_id}): {customer.first_name} {customer.last_name}")
        db.session.add(log)
        db.session.commit()

        return {"message": "Müşteri bilgileri başarıyla güncellendi."}, 200

    @staticmethod
    def delete_customer(customer_id, salon_id, actor_id):
        """Müşteriyi veritabanından tamamen siler"""
        customer = Customer.query.filter_by(id=customer_id, salon_id=salon_id).first()
        if not customer:
            return {"error": "Müşteri bulunamadı veya bu işlem için yetkiniz yok."}, 404

        customer_name = f"{customer.first_name} {customer.last_name}"
        db.session.delete(customer)
        db.session.commit()

        # Audit Log
        log = AuditLog(user_id=actor_id, action=f"Müşteri silindi: {customer_name}")
        db.session.add(log)
        db.session.commit()

        return {"message": f"'{customer_name}' isimli müşteri başarıyla silindi."}, 200
