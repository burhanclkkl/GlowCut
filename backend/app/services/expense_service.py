from app.extensions import db
from app.models.expense import Expense
from app.models.audit_log import AuditLog
from datetime import datetime

class ExpenseService:
    @staticmethod
    def get_salon_expenses(salon_id):
        expenses = Expense.query.filter_by(salon_id=salon_id).order_by(Expense.date.desc()).all()
        return [e.to_dict() for e in expenses], 200

    @staticmethod
    def create_expense(salon_id, title, category, amount, date_str, payment_status, payment_type, notes, actor_id):
        try:
            date_val = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else datetime.utcnow().date()
        except ValueError:
            return {"error": "Geçersiz tarih formatı. YYYY-MM-DD olmalıdır."}, 400

        new_expense = Expense(
            salon_id=salon_id,
            title=title,
            category=category,
            amount=amount,
            date=date_val,
            payment_status=payment_status,
            payment_type=payment_type,
            notes=notes
        )
        db.session.add(new_expense)
        db.session.commit()

        # Audit Log
        log = AuditLog(
            user_id=actor_id,
            action=f"Yeni gider eklendi: {title} ({amount} ₺)",
            ip_address="127.0.0.1"
        )
        db.session.add(log)
        db.session.commit()

        return new_expense.to_dict(), 201

    @staticmethod
    def update_expense(expense_id, salon_id, title, category, amount, date_str, payment_status, payment_type, notes, actor_id):
        expense = Expense.query.filter_by(id=expense_id, salon_id=salon_id).first()
        if not expense:
            return {"error": "Gider bulunamadı veya bu işlem için yetkiniz yok."}, 404

        if title is not None:
            expense.title = title
        if category is not None:
            expense.category = category
        if amount is not None:
            expense.amount = amount
        if date_str is not None:
            try:
                expense.date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return {"error": "Geçersiz tarih formatı. YYYY-MM-DD olmalıdır."}, 400
        if payment_status is not None:
            expense.payment_status = payment_status
        if payment_type is not None:
            expense.payment_type = payment_type
        if notes is not None:
            expense.notes = notes

        db.session.commit()

        # Audit Log
        log = AuditLog(
            user_id=actor_id,
            action=f"Gider güncellendi (ID: {expense_id}): {expense.title} ({expense.amount} ₺)",
            ip_address="127.0.0.1"
        )
        db.session.add(log)
        db.session.commit()

        return expense.to_dict(), 200

    @staticmethod
    def delete_expense(expense_id, salon_id, actor_id):
        expense = Expense.query.filter_by(id=expense_id, salon_id=salon_id).first()
        if not expense:
            return {"error": "Gider bulunamadı veya bu işlem için yetkiniz yok."}, 404

        title = expense.title
        amount = expense.amount

        db.session.delete(expense)
        db.session.commit()

        # Audit Log
        log = AuditLog(
            user_id=actor_id,
            action=f"Gider silindi: {title} ({amount} ₺)",
            ip_address="127.0.0.1"
        )
        db.session.add(log)
        db.session.commit()

        return {"message": "Gider başarıyla silindi."}, 200
