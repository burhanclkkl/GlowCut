from app.extensions import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = 'customers'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    notes = db.Column(db.Text, nullable=True) # Kalıcı müşteri notu (saç derisi vb.)
    is_active = db.Column(db.Boolean, default=True)
    
    # Hangi salona bağlı?
    salon_id = db.Column(db.Integer, db.ForeignKey('salons.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # İlişki: Müşterinin randevuları
    appointments = db.relationship('Appointment', backref='customer', lazy=True, cascade="all, delete-orphan")
