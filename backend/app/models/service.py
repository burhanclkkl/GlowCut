from app.extensions import db

class Service(db.Model):
    __tablename__ = 'services'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False) # Örn: "Saç Kesimi", "Boya", "Manikür"
    price = db.Column(db.Float, nullable=True) # Hizmetin varsayılan fiyatı
    
    # Her hizmet bir salona aittir
    salon_id = db.Column(db.Integer, db.ForeignKey('salons.id'), nullable=False)

    # İlişki: Bu hizmet kategorisine bağlı stilistler listesi
    stylists = db.relationship('Stylist', backref='service', lazy=True)
