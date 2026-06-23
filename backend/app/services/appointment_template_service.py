from app.models.appointment_template import AppointmentTemplate
from app.models.audit_log import AuditLog
from app.extensions import db
from datetime import datetime

class AppointmentTemplateService:

    @staticmethod
    def create_template(name, start_time_str, end_time_str, salon_id, actor_id):
        """Adminin salona özel yeni bir randevu/blok saat şablonu oluşturmasını sağlar"""
        
        # 1. Aynı salonda aynı isimde şablon çakışma kontrolü
        existing = AppointmentTemplate.query.filter_by(name=name, salon_id=salon_id).first()
        if existing:
            return {"error": f"'{name}' adında bir şablon zaten mevcut."}, 400

        try:
            start_time = datetime.strptime(start_time_str, "%H:%M").time()
            end_time = datetime.strptime(end_time_str, "%H:%M").time()
        except ValueError:
            return {"error": "Geçersiz saat formatı. HH:MM olmalı (Örn: 08:30)."}, 400

        # 2. Şablonu kaydet
        new_template = AppointmentTemplate(
            name=name,
            start_time=start_time,
            end_time=end_time,
            salon_id=salon_id
        )
        db.session.add(new_template)
        db.session.commit()

        # Audit Log
        log = AuditLog(user_id=actor_id, action=f"Yeni randevu/mola şablonu oluşturuldu: {name} ({start_time_str} - {end_time_str})")
        db.session.add(log)
        db.session.commit()

        return {
            "message": f"'{name}' şablonu başarıyla oluşturuldu.",
            "template_id": new_template.id
        }, 201

    @staticmethod
    def get_my_templates(salon_id):
        """Sadece istek atan adminin salonuna ait şablonları listeler"""
        templates = AppointmentTemplate.query.filter_by(salon_id=salon_id).all()
        result = []
        for t in templates:
            result.append({
                "id": t.id,
                "name": t.name,
                "start_time": t.start_time.strftime("%H:%M"),
                "end_time": t.end_time.strftime("%H:%M")
            })
        return result, 200

    @staticmethod
    def update_template(template_id, name, start_time_str, end_time_str, salon_id, actor_id):
        """Mevcut bir şablonu günceller"""
        template = AppointmentTemplate.query.filter_by(id=template_id, salon_id=salon_id).first()
        if not template:
            return {"error": "Şablon bulunamadı veya yetkiniz yok."}, 404

        has_name_change = name is not None and name != template.name
        
        has_start_change = False
        if start_time_str:
            try:
                new_start = datetime.strptime(start_time_str, "%H:%M").time()
                has_start_change = new_start != template.start_time
            except ValueError:
                return {"error": "Geçersiz saat formatı. HH:MM olmalı."}, 400

        has_end_change = False
        if end_time_str:
            try:
                new_end = datetime.strptime(end_time_str, "%H:%M").time()
                has_end_change = new_end != template.end_time
            except ValueError:
                return {"error": "Geçersiz saat formatı. HH:MM olmalı."}, 400

        if not has_name_change and not has_start_change and not has_end_change:
            return {"message": "Herhangi bir değişiklik yapılmadı."}, 200

        if has_name_change:
            existing = AppointmentTemplate.query.filter_by(name=name, salon_id=salon_id).first()
            if existing and existing.id != template_id:
                return {"error": f"'{name}' adında başka bir şablon zaten var."}, 400
            template.name = name

        if has_start_change:
            template.start_time = new_start

        if has_end_change:
            template.end_time = new_end

        db.session.commit()

        # Audit Log
        log = AuditLog(user_id=actor_id, action=f"Şablon güncellendi (ID: {template_id}): {template.name}")
        db.session.add(log)
        db.session.commit()

        return {"message": "Şablon başarıyla güncellendi."}, 200

    @staticmethod
    def delete_template(template_id, salon_id, actor_id):
        """Şablonu sistemden siler"""
        template = AppointmentTemplate.query.filter_by(id=template_id, salon_id=salon_id).first()
        if not template:
            return {"error": "Şablon bulunamadı veya yetkiniz yok."}, 404

        template_name = template.name
        db.session.delete(template)
        db.session.commit()

        # Audit Log
        log = AuditLog(user_id=actor_id, action=f"Şablon silindi: {template_name}")
        db.session.add(log)
        db.session.commit()

        return {"message": f"'{template_name}' şablonu başarıyla silindi."}, 200
