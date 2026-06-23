from app.extensions import db
from datetime import datetime

class Salon(db.Model):
    __tablename__ = 'salons'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, default=True)
    is_demo = db.Column(db.Boolean, default=False)  # Demo plan flag with user limits
    plan_type = db.Column(db.String(20), default='demo', nullable=False)  # 'demo', 'standart', 'premium'
    
    # Lisans Süresi Yönetimi
    license_start_date = db.Column(db.DateTime, default=datetime.utcnow)
    license_end_date = db.Column(db.DateTime, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # İlişkiler
    users = db.relationship('User', backref='salon', lazy=True, cascade="all, delete-orphan")
    services = db.relationship('Service', backref='salon', lazy=True, cascade="all, delete-orphan")
    stylists = db.relationship('Stylist', backref='salon', lazy=True, cascade="all, delete-orphan")
