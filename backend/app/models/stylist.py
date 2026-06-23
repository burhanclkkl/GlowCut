from app.extensions import db
from datetime import datetime

class Stylist(db.Model):
    __tablename__ = 'stylists'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True) # WhatsApp entegrasyonu için
    is_active = db.Column(db.Boolean, default=True)
    
    # Hangi salona ve hangi uzmanlık hizmetine bağlı?
    salon_id = db.Column(db.Integer, db.ForeignKey('salons.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # İlişki: Stilistin randevu geçmişi
    appointments = db.relationship('Appointment', backref='stylist', lazy=True, cascade="all, delete-orphan")
