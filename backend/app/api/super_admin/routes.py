from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.super_admin_service import SuperAdminService

super_admin_bp = Blueprint('super_admin', __name__, url_prefix='/api/super-admin')

def check_super_admin():
    """İstek atan kullanıcının rolünü kontrol eden yardımcı fonksiyon"""
    claims = get_jwt()
    return claims.get("role") == "super_admin"


# === SALON (kiracı) ENDPOINT'LERİ ===

@super_admin_bp.route('/salons', methods=['POST'])
@jwt_required()
def create_salon():
    if not check_super_admin():
        return jsonify({"error": "Bu işlem için Super Admin yetkisine sahip olmalısınız."}), 403
    data = request.get_json()
    actor_id = get_jwt_identity()
    response, status_code = SuperAdminService.create_company(
        data.get('name'), 
        data.get('license_end_date'), 
        data.get('manager_email'),
        data.get('manager_password'),
        actor_id,
        data.get('plan_type', 'demo')
    )
    return jsonify(response), status_code

@super_admin_bp.route('/salons', methods=['GET'])
@jwt_required()
def get_salons():
    if not check_super_admin():
        return jsonify({"error": "Yetkisiz erişim. Super Admin olmalısınız."}), 403
    response, status_code = SuperAdminService.get_all_companies()
    return jsonify(response), status_code

@super_admin_bp.route('/salons/<int:salon_id>', methods=['PUT'])
@jwt_required()
def update_salon(salon_id):
    if not check_super_admin():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    data = request.get_json()
    actor_id = get_jwt_identity()
    response, status_code = SuperAdminService.update_company(
        salon_id=salon_id,
        name=data.get('name'),
        license_end_date_str=data.get('license_end_date'),
        manager_email=data.get('manager_email'),
        manager_password=data.get('manager_password'),
        actor_id=actor_id,
        plan_type=data.get('plan_type')
    )
    return jsonify(response), status_code

@super_admin_bp.route('/salons/<int:salon_id>/license', methods=['PUT'])
@jwt_required()
def update_salon_license(salon_id):
    if not check_super_admin():
        return jsonify({"error": "Yetkisiz erişim. Super Admin olmalısınız."}), 403
    data = request.get_json()
    if not data or 'license_end_date' not in data:
        return jsonify({"error": "license_end_date alanı zorunludur."}), 400
    actor_id = get_jwt_identity()
    response, status_code = SuperAdminService.update_company_license(salon_id, data.get('license_end_date'), actor_id)
    return jsonify(response), status_code

@super_admin_bp.route('/salons/<int:salon_id>/toggle', methods=['PATCH'])
@jwt_required()
def toggle_salon(salon_id):
    if not check_super_admin():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    actor_id = get_jwt_identity()
    response, status_code = SuperAdminService.toggle_company_status(salon_id, actor_id)
    return jsonify(response), status_code

@super_admin_bp.route('/salons/<int:salon_id>', methods=['DELETE'])
@jwt_required()
def delete_salon(salon_id):
    if not check_super_admin():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    actor_id = get_jwt_identity()
    response, status_code = SuperAdminService.delete_company(salon_id, actor_id)
    return jsonify(response), status_code


# === KULLANICI / ADMIN ENDPOINT'LERİ ===

@super_admin_bp.route('/salons/<int:salon_id>/admins', methods=['GET'])
@jwt_required()
def get_salon_admins(salon_id):
    if not check_super_admin():
        return jsonify({"error": "Yetkisiz erişim. Super Admin olmalısınız."}), 403
    response, status_code = SuperAdminService.get_company_admins(salon_id)
    return jsonify(response), status_code

@super_admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    if not check_super_admin():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    data = request.get_json()
    if data and 'role' in data:
        return jsonify({"error": "Rol güncellemesi bu rota üzerinden yapılamaz."}), 400
    actor_id = get_jwt_identity()
    response, status_code = SuperAdminService.update_user(user_id, data.get('email'), data.get('password'), data.get('is_active'), actor_id)
    return jsonify(response), status_code

@super_admin_bp.route('/users/<int:user_id>/toggle', methods=['PATCH'])
@jwt_required()
def toggle_user(user_id):
    if not check_super_admin():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    actor_id = get_jwt_identity()
    response, status_code = SuperAdminService.toggle_user_status(user_id, actor_id)
    return jsonify(response), status_code

@super_admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    if not check_super_admin():
        return jsonify({"error": "Yetkisiz erişim."}), 403
    actor_id = get_jwt_identity()
    response, status_code = SuperAdminService.delete_user(user_id, actor_id)
    return jsonify(response), status_code