from app.models.appointment import Appointment
from app.models.stylist import Stylist
from app.models.customer import Customer
from app.models.service import Service
from app.models.audit_log import AuditLog
from app.extensions import db
from datetime import datetime

class AppointmentService:

    @staticmethod
    def create_appointment(stylist_id, customer_id, service_id, start_datetime_str, end_datetime_str, price, notes, salon_id, actor_id, payment_status='Ödeme Bekleniyor', payment_type=None, paid_amount=0.0):
        # 1. Stilist var mı ve bu salona mı ait?
        stylist = Stylist.query.filter_by(id=stylist_id, salon_id=salon_id).first()
        if not stylist:
            return {"error": "Stilist bulunamadı veya bu salona ait değil."}, 400

        # 2. Müşteri var mı ve bu salona mı ait?
        customer = Customer.query.filter_by(id=customer_id, salon_id=salon_id).first()
        if not customer:
            return {"error": "Müşteri bulunamadı veya bu salona ait değil."}, 400

        # 3. Hizmet var mı ve bu salona mı ait? (Opsiyonel)
        service = None
        if service_id:
            service = Service.query.filter_by(id=service_id, salon_id=salon_id).first()
            if not service:
                return {"error": "Hizmet alanı bulunamadı veya bu salona ait değil."}, 400

        try:
            start_dt = datetime.strptime(start_datetime_str, "%Y-%m-%d %H:%M:%S")
            end_dt = datetime.strptime(end_datetime_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            try:
                start_dt = datetime.fromisoformat(start_datetime_str)
                end_dt = datetime.fromisoformat(end_datetime_str)
            except ValueError:
                return {"error": "Geçersiz tarih formatı. YYYY-MM-DD HH:MM:SS formatında olmalıdır."}, 400

        if start_dt >= end_dt:
            return {"error": "Başlangıç tarihi bitiş tarihinden önce olmalıdır."}, 400

        # Geçmiş tarih kontrolü (Bypass edildi - geçmiş tarihe ödeme/randevu eklenebilir)
        # if start_dt < datetime.utcnow():
        #     return {"error": "Geçmiş tarihe randevu eklenemez. Lütfen gelecek bir tarih seçiniz."}, 400

        # 4. Randevu Çakışma Kontrolü (Aynı stilist için aynı zaman diliminde başka bir randevu var mı?)
        overlap = Appointment.query.filter(
            Appointment.stylist_id == stylist_id,
            Appointment.start_datetime < end_dt,
            Appointment.end_datetime > start_dt
        ).first()
        if overlap:
            return {"error": f"Stilistin bu saatler arasında başka bir randevusu bulunmaktadır ({overlap.start_datetime.strftime('%Y-%m-%d %H:%M')} - {overlap.end_datetime.strftime('%Y-%m-%d %H:%M')})."}, 400

        # 5. Randevuyu oluştur
        # Fiyat kullanıcı tarafından belirtilmemişse, hizmetin varsayılan fiyatını kullan
        final_price = price if price is not None else (service.price if service else None)
        
        if payment_status == 'Ödendi':
            final_paid_amount = final_price if final_price is not None else 0.0
        elif payment_status == 'Ödeme Bekleniyor':
            final_paid_amount = 0.0
        else:
            final_paid_amount = paid_amount if paid_amount is not None else 0.0

        new_appointment = Appointment(
            stylist_id=stylist_id,
            customer_id=customer_id,
            service_id=service_id,
            start_datetime=start_dt,
            end_datetime=end_dt,
            price=final_price,
            paid_amount=final_paid_amount,
            notes=notes,
            status='confirmed',
            created_by_id=actor_id,
            payment_status=payment_status or 'Ödeme Bekleniyor',
            payment_type=payment_type
        )
        db.session.add(new_appointment)
        db.session.commit()

        customer_name = f"{customer.first_name} {customer.last_name}"
        # Audit Log
        log = AuditLog(user_id=actor_id, action=f"Yeni randevu oluşturuldu: Stilist {stylist.first_name} {stylist.last_name}, Müşteri: {customer_name} ({start_datetime_str} - {end_datetime_str})")
        db.session.add(log)
        db.session.commit()

        return {
            "message": "Randevu başarıyla oluşturuldu.",
            "appointment_id": new_appointment.id
        }, 201

    @staticmethod
    def get_my_appointments(salon_id):
        # Salona ait stilistlerin randevularını getir
        appointments = db.session.query(Appointment).join(Stylist).filter(Stylist.salon_id == salon_id).all()
        result = []
        for app in appointments:
            cust = app.customer
            srv = app.service
            result.append({
                "id": app.id,
                "stylist_id": app.stylist_id,
                "stylist_name": f"{app.stylist.first_name} {app.stylist.last_name}" if app.stylist else "Bilinmeyen",
                "employee_name": f"{app.stylist.first_name} {app.stylist.last_name}" if app.stylist else "Bilinmeyen", # Frontend uyumluluğu
                "customer_id": app.customer_id,
                "customer_name": f"{cust.first_name} {cust.last_name}" if cust else "Bilinmeyen Müşteri",
                "customer_phone": cust.phone_number if cust else "",
                "service_id": app.service_id,
                "service_name": srv.name if srv else "Belirtilmedi",
                "start_datetime": app.start_datetime.strftime("%Y-%m-%d %H:%M:%S"),
                "end_datetime": app.end_datetime.strftime("%Y-%m-%d %H:%M:%S"),
                "price": app.price,
                "paid_amount": app.paid_amount,
                "notes": app.notes,
                "status": app.status,
                "payment_status": app.payment_status,
                "payment_type": app.payment_type,
                "created_by_id": app.created_by_id,
                "created_at": app.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return result, 200

    @staticmethod
    def update_appointment(appointment_id, stylist_id, customer_id, service_id, start_datetime_str, end_datetime_str, price, notes, status, salon_id, actor_id, payment_status=None, payment_type=None, paid_amount=None):
        # 1. Randevu var mı ve bu salonun stilistine mi ait?
        appointment = db.session.query(Appointment).join(Stylist).filter(Appointment.id == appointment_id, Stylist.salon_id == salon_id).first()
        if not appointment:
            return {"error": "Randevu bulunamadı veya bu işlem için yetkiniz yok."}, 404

        has_stylist_change = stylist_id is not None and stylist_id != appointment.stylist_id
        has_customer_change = customer_id is not None and customer_id != appointment.customer_id
        has_service_change = service_id is not None and service_id != appointment.service_id
        
        # Saatleri doğrula ve değişiklik kontrolü yap
        start_dt = appointment.start_datetime
        end_dt = appointment.end_datetime

        has_start_change = False
        if start_datetime_str:
            try:
                new_start = datetime.strptime(start_datetime_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                try:
                    new_start = datetime.fromisoformat(start_datetime_str)
                except ValueError:
                    return {"error": "Geçersiz başlangıç tarihi formatı."}, 400
            has_start_change = new_start != appointment.start_datetime
            if has_start_change:
                start_dt = new_start
                
        has_end_change = False
        if end_datetime_str:
            try:
                new_end = datetime.strptime(end_datetime_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                try:
                    new_end = datetime.fromisoformat(end_datetime_str)
                except ValueError:
                    return {"error": "Geçersiz bitiş tarihi formatı."}, 400
            has_end_change = new_end != appointment.end_datetime
            if has_end_change:
                end_dt = new_end

        has_price_change = price is not None and price != appointment.price
        has_notes_change = notes is not None and notes != appointment.notes
        has_status_change = status is not None and status != appointment.status
        has_payment_status_change = payment_status is not None and payment_status != appointment.payment_status
        has_payment_type_change = payment_type is not None and payment_type != appointment.payment_type
        has_paid_amount_change = paid_amount is not None and paid_amount != appointment.paid_amount

        if (not has_stylist_change and not has_customer_change and not has_service_change and 
            not has_start_change and not has_end_change and not has_price_change and 
            not has_notes_change and not has_status_change and not has_payment_status_change and not has_payment_type_change and not has_paid_amount_change):
            return {"message": "Herhangi bir değişiklik yapılmadı."}, 200

        target_stylist_id = stylist_id if stylist_id else appointment.stylist_id
        
        # Stilist kontrolü
        if has_stylist_change:
            stylist = Stylist.query.filter_by(id=stylist_id, salon_id=salon_id).first()
            if not stylist:
                return {"error": "Seçilen yeni stilist bu salona ait değil."}, 400
            appointment.stylist_id = stylist_id

        # Müşteri kontrolü
        if has_customer_change:
            customer = Customer.query.filter_by(id=customer_id, salon_id=salon_id).first()
            if not customer:
                return {"error": "Seçilen yeni müşteri bu salona ait değil."}, 400
            appointment.customer_id = customer_id

        # Hizmet kontrolü
        if has_service_change and service_id:
            service = Service.query.filter_by(id=service_id, salon_id=salon_id).first()
            if not service:
                return {"error": "Seçilen yeni hizmet bu salona ait değil."}, 400
            appointment.service_id = service_id

        if start_dt >= end_dt:
            return {"error": "Başlangıç tarihi bitiş tarihinden önce olmalıdır."}, 400

        # Çakışma kontrolü (Güncellenen randevunun kendisi hariç)
        overlap = Appointment.query.filter(
            Appointment.id != appointment_id,
            Appointment.stylist_id == target_stylist_id,
            Appointment.start_datetime < end_dt,
            Appointment.end_datetime > start_dt
        ).first()
        
        if overlap:
            return {"error": f"Stilistin bu saatler arasında başka bir randevusu bulunmaktadır ({overlap.start_datetime.strftime('%Y-%m-%d %H:%M')} - {overlap.end_datetime.strftime('%Y-%m-%d %H:%M')})."}, 400

        if has_start_change:
            appointment.start_datetime = start_dt
        if has_end_change:
            appointment.end_datetime = end_dt
        if has_price_change:
            appointment.price = price
        if has_notes_change:
            appointment.notes = notes
        if has_status_change:
            appointment.status = status
        if has_payment_status_change:
            appointment.payment_status = payment_status
            if paid_amount is None:
                if payment_status == 'Ödendi':
                    appointment.paid_amount = price if price is not None else appointment.price
                elif payment_status == 'Ödeme Bekleniyor':
                    appointment.paid_amount = 0.0
        if has_payment_type_change:
            appointment.payment_type = payment_type
        if has_paid_amount_change:
            appointment.paid_amount = paid_amount

        db.session.commit()

        # Audit Log
        cust_name = f"{appointment.customer.first_name} {appointment.customer.last_name}" if appointment.customer else "Bilinmeyen"
        log = AuditLog(user_id=actor_id, action=f"Randevu güncellendi (ID: {appointment_id}): Müşteri {cust_name}")
        db.session.add(log)
        db.session.commit()

        return {"message": "Randevu başarıyla güncellendi."}, 200

    @staticmethod
    def delete_appointment(appointment_id, salon_id, actor_id):
        appointment = db.session.query(Appointment).join(Stylist).filter(Appointment.id == appointment_id, Stylist.salon_id == salon_id).first()
        if not appointment:
            return {"error": "Randevu bulunamadı veya bu işlem için yetkiniz yok."}, 404

        cust_name = f"{appointment.customer.first_name} {appointment.customer.last_name}" if appointment.customer else "Bilinmeyen"
        db.session.delete(appointment)
        db.session.commit()

        # Audit Log
        log = AuditLog(user_id=actor_id, action=f"Randevu silindi (ID: {appointment_id}): Müşteri {cust_name}")
        db.session.add(log)
        db.session.commit()

        return {"message": "Randevu başarıyla silindi."}, 200
