from app.extensions import db

class AppointmentTemplate(db.Model):
    __tablename__ = 'appointment_templates'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)  # Örn: "Öğle Arası", "Sabah Fönü"
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    
    salon_id = db.Column(db.Integer, db.ForeignKey('salons.id'), nullable=False)
