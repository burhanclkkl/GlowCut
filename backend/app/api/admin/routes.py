from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.admin_service import AdminService
from app.services.stylist_service import StylistService
from app.services.customer_service import CustomerService
from app.services.appointment_template_service import AppointmentTemplateService
from app.services.appointment_service import AppointmentService

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def check_admin_authority():
    """Kullanıcının salon admini veya üstü olduğunu doğrular"""
    claims = get_jwt()
    return claims.get("role") in ["admin", "super_admin"]

def get_salon_id_safely(claims, data=None):
    """Claims içinden company_id (salon_id) alır. Eğer super_admin ise istekten dinamik çeker."""
    salon_id = claims.get("company_id")
    if not salon_id and claims.get("role") == "super_admin":
        if data and isinstance(data, dict):
            salon_id = data.get("company_id") or data.get("salon_id")
        if not salon_id:
            salon_id = request.args.get("company_id", type=int) or request.args.get("salon_id", type=int)
    return salon_id


# ==========================================
# === HİZMET KATEGORİSİ YÖNETİMİ ===========
# ==========================================

@admin_bp.route('/services', methods=['POST'])
@jwt_required()
def create_service():
    if not check_admin_authority():
        return jsonify({"error": "Bu işlem için Admin yetkisine sahip olmalısınız."}), 403
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"error": "Hizmet adı zorunludur."}), 400
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    response, status_code = AdminService.create_service(data['name'], salon_id, actor_id, data.get('price'))
    return jsonify(response), status_code

@admin_bp.route('/services', methods=['GET'])
@jwt_required()
def get_services():
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    response, status_code = AdminService.get_my_services(salon_id)
    return jsonify(response), status_code

@admin_bp.route('/services/<int:service_id>', methods=['PUT'])
@jwt_required()
def update_service(service_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    data = request.get_json()
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    response, status_code = AdminService.update_service(service_id, data.get('name'), salon_id, actor_id, data.get('price'))
    return jsonify(response), status_code

@admin_bp.route('/services/<int:service_id>', methods=['DELETE'])
@jwt_required()
def delete_service(service_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    response, status_code = AdminService.delete_service(service_id, salon_id, actor_id)
    return jsonify(response), status_code


# ==========================================
# === STİLİST (PERSONEL) YÖNETİMİ ==========
# ==========================================

@admin_bp.route('/stylists', methods=['POST'])
@admin_bp.route('/employees', methods=['POST'])
@jwt_required()
def create_stylist():
    if not check_admin_authority():
        return jsonify({"error": "Bu işlem için Admin yetkisine sahip olmalısınız."}), 403
        
    data = request.get_json()
    service_id = data.get('department_id') or data.get('service_id')
    if not data or 'first_name' not in data or 'last_name' not in data or not service_id:
        return jsonify({"error": "Ad, soyad ve hizmet alanı (service_id) zorunludur."}), 400
        
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    
    response, status_code = StylistService.create_stylist(
        first_name=data['first_name'],
        last_name=data['last_name'],
        phone=data.get('phone'),
        service_id=service_id,
        salon_id=salon_id,
        actor_id=actor_id
    )
    return jsonify(response), status_code

@admin_bp.route('/stylists', methods=['GET'])
@admin_bp.route('/employees', methods=['GET'])
@jwt_required()
def get_stylists():
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
        
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    response, status_code = StylistService.get_my_stylists(salon_id)
    return jsonify(response), status_code

@admin_bp.route('/stylists/<int:stylist_id>', methods=['PUT'])
@admin_bp.route('/employees/<int:stylist_id>', methods=['PUT'])
@jwt_required()
def update_stylist(stylist_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
        
    data = request.get_json()
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    
    service_id = data.get('department_id') or data.get('service_id')
    
    response, status_code = StylistService.update_stylist(
        stylist_id=stylist_id,
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        phone=data.get('phone'),
        service_id=service_id,
        is_active=data.get('is_active'),
        salon_id=salon_id,
        actor_id=actor_id
    )
    return jsonify(response), status_code

@admin_bp.route('/stylists/<int:stylist_id>', methods=['DELETE'])
@admin_bp.route('/employees/<int:stylist_id>', methods=['DELETE'])
@jwt_required()
def delete_stylist(stylist_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
        
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    
    response, status_code = StylistService.delete_stylist(stylist_id, salon_id, actor_id)
    return jsonify(response), status_code


# ==========================================
# === MÜŞTERİ (CUSTOMER) YÖNETİMİ ==========
# ==========================================

@admin_bp.route('/customers', methods=['POST'])
@jwt_required()
def create_customer():
    if not check_admin_authority():
        return jsonify({"error": "Bu işlem için Admin yetkisine sahip olmalısınız."}), 403
    data = request.get_json()
    if not data or 'first_name' not in data or 'last_name' not in data:
        return jsonify({"error": "Müşteri adı ve soyadı zorunludur."}), 400
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    response, status_code = CustomerService.create_customer(
        first_name=data['first_name'],
        last_name=data['last_name'],
        phone=data.get('phone') or data.get('phone_number'),
        notes=data.get('notes'),
        salon_id=salon_id,
        actor_id=actor_id
    )
    return jsonify(response), status_code

@admin_bp.route('/customers', methods=['GET'])
@jwt_required()
def get_customers():
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    response, status_code = CustomerService.get_my_customers(salon_id)
    return jsonify(response), status_code

@admin_bp.route('/customers/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    data = request.get_json()
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    response, status_code = CustomerService.update_customer(
        customer_id=customer_id,
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        phone=data.get('phone') or data.get('phone_number'),
        notes=data.get('notes'),
        is_active=data.get('is_active'),
        salon_id=salon_id,
        actor_id=actor_id
    )
    return jsonify(response), status_code

@admin_bp.route('/customers/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    response, status_code = CustomerService.delete_customer(customer_id, salon_id, actor_id)
    return jsonify(response), status_code


# ==========================================
# === ŞABLON (TEMPLATE) YÖNETİMİ ============
# ==========================================

@admin_bp.route('/appointment-templates', methods=['POST'])
@jwt_required()
def create_template():
    if not check_admin_authority():
        return jsonify({"error": "Bu işlem için Admin yetkisine sahip olmalısınız."}), 403
        
    data = request.get_json()
    if not data or 'name' not in data or 'start_time' not in data or 'end_time' not in data:
        return jsonify({"error": "Şablon adı, başlangıç ve bitiş saatleri zorunludur."}), 400
        
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    
    response, status_code = AppointmentTemplateService.create_template(
        name=data['name'],
        start_time_str=data['start_time'],
        end_time_str=data['end_time'],
        salon_id=salon_id,
        actor_id=actor_id
    )
    return jsonify(response), status_code

@admin_bp.route('/appointment-templates', methods=['GET'])
@jwt_required()
def get_templates():
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
        
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    
    response, status_code = AppointmentTemplateService.get_my_templates(salon_id)
    return jsonify(response), status_code

@admin_bp.route('/appointment-templates/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_template(template_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
        
    data = request.get_json()
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    
    response, status_code = AppointmentTemplateService.update_template(
        template_id=template_id,
        name=data.get('name'),
        start_time_str=data.get('start_time'),
        end_time_str=data.get('end_time'),
        salon_id=salon_id,
        actor_id=actor_id
    )
    return jsonify(response), status_code

@admin_bp.route('/appointment-templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_template(template_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
        
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    
    response, status_code = AppointmentTemplateService.delete_template(template_id, salon_id, actor_id)
    return jsonify(response), status_code


# ==========================================
# === RANDEVU (APPOINTMENT) YÖNETİMİ =======
# ==========================================

@admin_bp.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    if not check_admin_authority():
        return jsonify({"error": "Bu işlem için Admin yetkisine sahip olmalısınız."}), 403
        
    data = request.get_json()
    
    # Yeni model uyumluluğu
    stylist_id = data.get('employee_id') or data.get('stylist_id')
    customer_id = data.get('customer_id')
    service_id = data.get('service_id')
    start_dt = data.get('start_datetime')
    end_dt = data.get('end_datetime')
    
    if not data or not stylist_id or not customer_id or not start_dt or not end_dt:
        return jsonify({"error": "stylist_id, customer_id, start_datetime ve end_datetime alanları zorunludur."}), 400
        
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    
    price = data.get('price')
    if price is not None:
        try:
            price = float(price)
        except ValueError:
            price = None
            
    notes = data.get('notes', '')
    payment_status = data.get('payment_status', 'Ödeme Bekleniyor')
    payment_type = data.get('payment_type')
    paid_amount = data.get('paid_amount')
    if paid_amount is not None:
        try:
            paid_amount = float(paid_amount)
        except ValueError:
            paid_amount = 0.0
    else:
        paid_amount = 0.0
    
    response, status_code = AppointmentService.create_appointment(
        stylist_id=stylist_id,
        customer_id=customer_id,
        service_id=service_id,
        start_datetime_str=start_dt,
        end_datetime_str=end_dt,
        price=price,
        notes=notes,
        salon_id=salon_id,
        actor_id=actor_id,
        payment_status=payment_status,
        payment_type=payment_type,
        paid_amount=paid_amount
    )
    return jsonify(response), status_code

@admin_bp.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
        
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
        
    response, status_code = AppointmentService.get_my_appointments(salon_id)
    return jsonify(response), status_code

@admin_bp.route('/appointments/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
        
    data = request.get_json()
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    
    stylist_id = data.get('employee_id') or data.get('stylist_id')
    customer_id = data.get('customer_id')
    service_id = data.get('service_id')
    
    price = data.get('price')
    if price is not None:
        try:
            price = float(price)
        except ValueError:
            price = None
            
    paid_amount = data.get('paid_amount')
    if paid_amount is not None:
        try:
            paid_amount = float(paid_amount)
        except ValueError:
            paid_amount = None
 
    response, status_code = AppointmentService.update_appointment(
        appointment_id=appointment_id,
        stylist_id=stylist_id,
        customer_id=customer_id,
        service_id=service_id,
        start_datetime_str=data.get('start_datetime'),
        end_datetime_str=data.get('end_datetime'),
        price=price,
        notes=data.get('notes'),
        status=data.get('status'),
        salon_id=salon_id,
        actor_id=actor_id,
        payment_status=data.get('payment_status'),
        payment_type=data.get('payment_type'),
        paid_amount=paid_amount
    )
    return jsonify(response), status_code

@admin_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
        
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    
    response, status_code = AppointmentService.delete_appointment(appointment_id, salon_id, actor_id)
    return jsonify(response), status_code


# ==========================================
# === SİSTEM LOGLARI (AUDIT LOGS) =========
# ==========================================

@admin_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
        
    claims = get_jwt()
    is_super_admin = claims.get("role") == "super_admin"
    salon_id = get_salon_id_safely(claims)
    
    if not is_super_admin and not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
        
    response, status_code = AdminService.get_audit_logs(
        salon_id=salon_id,
        is_super_admin=is_super_admin
    )
    return jsonify(response), status_code


# ==========================================
# === PROFİL / AYARLAR YÖNETİMİ ===========
# ==========================================

@admin_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    user_id = get_jwt_identity()
    if not salon_id:
        return jsonify({"error": "salon_id bulunamadı."}), 400
        
    response, status_code = AdminService.get_profile(user_id, salon_id)
    return jsonify(response), status_code

@admin_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    user_id = get_jwt_identity()
    data = request.get_json()
    if not salon_id:
        return jsonify({"error": "salon_id bulunamadı."}), 400
         
    response, status_code = AdminService.update_profile(user_id, salon_id, data)
    return jsonify(response), status_code


# ==========================================
# === KAZANç RAPORU / EARNİNGS ============
# ==========================================

@admin_bp.route('/earnings/report', methods=['GET'])
@jwt_required()
def get_earnings_report():
    if not check_admin_authority():
       return jsonify({"error": "Yetkisiz erişim."}), 403
    
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
       return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Tarih formatı YYYY-MM-DD ise datetime'a çevir
    from datetime import datetime
    if start_date:
       try:
           start_date = datetime.strptime(start_date, "%Y-%m-%d")
       except:
           return jsonify({"error": "Geçersiz start_date formatı. YYYY-MM-DD olmalıdır."}), 400
    
    if end_date:
       try:
           end_date = datetime.strptime(end_date, "%Y-%m-%d")
       except:
           return jsonify({"error": "Geçersiz end_date formatı. YYYY-MM-DD olmalıdır."}), 400
    
    response, status_code = StylistService.get_salon_earnings_report(salon_id, start_date, end_date)
    return jsonify(response), status_code


@admin_bp.route('/earnings/stylist/<int:stylist_id>', methods=['GET'])
@jwt_required()
def get_stylist_earnings(stylist_id):
    if not check_admin_authority():
       return jsonify({"error": "Yetkisiz erişim."}), 403
    
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
       return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    from datetime import datetime
    if start_date:
       try:
           start_date = datetime.strptime(start_date, "%Y-%m-%d")
       except:
           return jsonify({"error": "Geçersiz start_date formatı. YYYY-MM-DD olmalıdır."}), 400
    
    if end_date:
       try:
           end_date = datetime.strptime(end_date, "%Y-%m-%d")
       except:
           return jsonify({"error": "Geçersiz end_date formatı. YYYY-MM-DD olmalıdır."}), 400
    
    response, status_code = StylistService.get_stylist_earnings(stylist_id, salon_id, start_date, end_date)
    return jsonify(response), status_code

@admin_bp.route('/verify-password', methods=['POST'])
@jwt_required()
def verify_password():
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
        
    data = request.get_json()
    password = data.get('password')
    if not password:
        return jsonify({"error": "Şifre alanı zorunludur."}), 400
        
    from app.models.user import User
    user = User.query.get(get_jwt_identity())
    if not user or not user.check_password(password):
        return jsonify({"error": "Hatalı şifre."}), 401
        
    return jsonify({"success": True, "message": "Şifre başarıyla doğrulandı."}), 200

# ---- GİDER (EXPENSE) YÖNETİMİ ----
from app.services.expense_service import ExpenseService

@admin_bp.route('/expenses', methods=['GET'])
@jwt_required()
def get_expenses():
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    response, status_code = ExpenseService.get_salon_expenses(salon_id)
    return jsonify(response), status_code

@admin_bp.route('/expenses', methods=['POST'])
@jwt_required()
def create_expense():
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    data = request.get_json() or {}
    title = data.get('title')
    category = data.get('category')
    amount = data.get('amount')
    if not title or not category or amount is None:
        return jsonify({"error": "Başlık, kategori ve tutar alanları zorunludur."}), 400
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    response, status_code = ExpenseService.create_expense(
        salon_id=salon_id,
        title=title,
        category=category,
        amount=amount,
        date_str=data.get('date'),
        payment_status=data.get('payment_status', 'Ödendi'),
        payment_type=data.get('payment_type'),
        notes=data.get('notes'),
        actor_id=actor_id
    )
    return jsonify(response), status_code

@admin_bp.route('/expenses/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    data = request.get_json() or {}
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims, data)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    response, status_code = ExpenseService.update_expense(
        expense_id=expense_id,
        salon_id=salon_id,
        title=data.get('title'),
        category=data.get('category'),
        amount=data.get('amount'),
        date_str=data.get('date'),
        payment_status=data.get('payment_status'),
        payment_type=data.get('payment_type'),
        notes=data.get('notes'),
        actor_id=actor_id
    )
    return jsonify(response), status_code

@admin_bp.route('/expenses/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    if not check_admin_authority():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    claims = get_jwt()
    salon_id = get_salon_id_safely(claims)
    if not salon_id:
        return jsonify({"error": "salon_id parametresi zorunludur."}), 400
    actor_id = get_jwt_identity()
    response, status_code = ExpenseService.delete_expense(expense_id, salon_id, actor_id)
    return jsonify(response), status_code

