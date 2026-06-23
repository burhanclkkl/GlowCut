from app.extensions import db
from datetime import datetime

class Expense(db.Model):
    __tablename__ = 'expenses'

    id = db.Column(db.Integer, primary_key=True)
    salon_id = db.Column(db.Integer, db.ForeignKey('salons.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False) # Gider Başlığı
    category = db.Column(db.String(50), nullable=False) # Gider Kategorisi (Kira, Fatura, Personel, Ürün, Diğer)
    amount = db.Column(db.Numeric(10, 2), nullable=False) # Tutar
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow) # Tarih
    payment_status = db.Column(db.String(50), nullable=False, default='Ödendi') # Ödeme Durumu (Ödendi, Ödeme Bekleniyor)
    payment_type = db.Column(db.String(50), nullable=True) # Ödeme Türü (Nakit, Kredi Kartı, Havale/EFT, vb.)
    notes = db.Column(db.Text, nullable=True) # Notlar
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "salon_id": self.salon_id,
            "title": self.title,
            "category": self.category,
            "amount": float(self.amount),
            "date": self.date.isoformat(),
            "payment_status": self.payment_status,
            "payment_type": self.payment_type,
            "notes": self.notes,
            "created_at": self.created_at.isoformat()
        }
