from app.models.user import User
from app.extensions import db
from flask_jwt_extended import create_access_token
from datetime import datetime

class AuthService:
    
    @staticmethod
    def create_user(email, password, role='admin', salon_id=None):
        """Sistemde yeni bir kullanıcı (Admin veya Super Admin) oluşturur"""
        if role not in ['admin', 'super_admin']:
            return {"error": "Geçersiz rol tanımı. 'admin' veya 'super_admin' olmalıdır."}, 400

        # E-posta çakışma kontrolü
        email_check = User.query.filter_by(email=email).first()
        if email_check:
            return {"error": "Bu e-posta adresi zaten kayıtlı."}, 400
            
        # Admin için salon kontrolü zorunluluğu
        if role == 'admin':
            if not salon_id:
                return {"error": "Salon yöneticisi (admin) kaydetmek için salon_id zorunludur."}, 400
            from app.models.salon import Salon
            salon = Salon.query.get(salon_id)
            if not salon:
                return {"error": "Belirtilen salon bulunamadı."}, 400
        else:
            # Super admin'in salonu olamaz
            salon_id = None
            
        new_user = User(email=email, role=role, salon_id=salon_id)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return {"message": f"Kullanıcı ({role}) başarıyla oluşturuldu: {email}"}, 201

    @staticmethod
    def login_user(email, password):
        """Kullanıcı giriş işlemlerini ve salon kısıtlamalarını yönetir"""
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return {"error": "E-posta veya şifre hatalı."}, 401
            
        if not user.is_active:
            return {"error": "Hesabınız pasife alınmıştır."}, 403
            
        if user.role == 'admin' and user.salon:
            current_time = datetime.utcnow()
            if not user.salon.is_active:
                return {"error": "Salonunuzun erişimi dondurulmuştur."}, 403
            if user.salon.license_end_date < current_time:
                return {"error": "Salonunuzun lisans kullanım süresi dolmuştur."}, 403

        additional_claims = {
            "role": user.role,
            "company_id": user.salon_id  # JWT claim'i uyumluluk açısından company_id olarak da tutabiliriz veya salon_id olarak. Frontend'in JWT token okuma yapısına bakalım. Çoğu JWT client claims içinden company_id bekleyebilir. Ama frontend'de 'company_id' olarak göndermek uyumluluğu korur! Let's map both or just keep company_id inside JWT but pointing to salon_id to prevent frontend breakage. This is extremely smart!
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        
        return {
            "message": "Giriş başarılı",
            "access_token": access_token,
            "role": user.role
        }, 200

    @staticmethod
    def update_profile(user_id, email=None, password=None):
        """Kullanıcının kendi profilini (e-posta, şifre) güncellemesini sağlar."""
        user = User.query.get(user_id)
        if not user:
            return {"error": "Kullanıcı bulunamadı."}, 404

        has_email_change = email is not None and email != user.email
        has_password_change = password is not None and not user.check_password(password)

        if not has_email_change and not has_password_change:
            return {"message": "Herhangi bir değişiklik yapılmadı."}, 200

        if has_email_change:
            if User.query.filter(User.id != user_id, User.email == email).first():
                return {"error": "Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor."}, 400
            user.email = email

        if has_password_change:
            user.set_password(password)

        db.session.commit()
        return {"message": "Profiliniz başarıyla güncellendi."}, 200

    @staticmethod
    def get_profile(user_id):
        """Kullanıcının kendi profil bilgilerini getirmesini sağlar."""
        user = User.query.get(user_id)
        if not user:
            return {"error": "Kullanıcı bulunamadı."}, 404
        return {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "company_id": user.salon_id,
            "is_active": user.is_active,
            "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }, 200