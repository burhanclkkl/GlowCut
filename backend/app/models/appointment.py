from app.extensions import db
from datetime import datetime

class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(db.Integer, primary_key=True)
    stylist_id = db.Column(db.Integer, db.ForeignKey('stylists.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=True)
    
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    
    price = db.Column(db.Float, nullable=True)
    paid_amount = db.Column(db.Float, nullable=True, default=0.0)
    notes = db.Column(db.Text, nullable=True) # Randevuya özel not
    status = db.Column(db.String(20), nullable=False, default='confirmed') # confirmed, pending, cancelled, completed
    payment_status = db.Column(db.String(50), nullable=False, default='Ödeme Bekleniyor')
    payment_type = db.Column(db.String(50), nullable=True)
    
    # Denetim
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # İlişkiler
    # Not: stylist ve customer relationship'leri kendi modellerindeki backref ile geliyor
    service = db.relationship('Service', backref=db.backref('service_appointments', lazy=True))
