
from datetime import datetime, timedelta, timezone
from functools import wraps
import hashlib
import io
import json
import os
import re
import secrets
import shutil
import uuid
from pathlib import Path
from urllib import error as urllib_error
from urllib import request as urllib_request

import bcrypt
import jwt
from bson import ObjectId
from bson.errors import InvalidId
from flask import g, jsonify, make_response, request, send_file
from pymongo.errors import DuplicateKeyError, PyMongoError
from werkzeug.utils import secure_filename

from config import *
from database import *

from extensions import app
from database import with_db
from auth.security import *
from auth.users import *
from auth.login_tracking import *
from auth.validators import *
from services.access import *
from services.admins import *
from services.apply_documents import *
from services.apply_progress import *
from services.feedback import *
from services.files import *
from services.hdnk_nckh import *
from services.inbox import *
from services.notifications import *
from services.utils import *

@app.get("/api/admin/feedback")
@with_db
def admin_list_feedback():
    admin, error_response = get_authenticated_admin()
    if error_response:
        return error_response

    mentee_query = mentee_filter_for_admin(admin)
    if mentee_query:
        mentee_ids = [u["_id"] for u in users.find(mentee_query, {"_id": 1})]
        cursor = feedback_app.find({"user_id": {"$in": mentee_ids}}).sort("created_at", -1)
    else:
        cursor = feedback_app.find().sort("created_at", -1)

    return jsonify([feedback_response(doc, admin) for doc in cursor])


@app.patch("/api/admin/feedback/<feedback_id>")
@with_db
def admin_update_feedback(feedback_id):
    admin, error_response = get_authenticated_admin()
    if error_response:
        return error_response

    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        oid = ObjectId(feedback_id)
    except InvalidId:
        return jsonify({"detail": "Phản hồi không tồn tại"}), 404

    doc = feedback_app.find_one({"_id": oid})
    if not doc:
        return jsonify({"detail": "Phản hồi không tồn tại"}), 404

    mentee_query = mentee_filter_for_admin(admin)
    if mentee_query:
        mentee = users.find_one({"_id": doc["user_id"], **mentee_query})
        if not mentee:
            return jsonify({"detail": "Không có quyền xử lý phản hồi này"}), 403

    data = request.get_json(silent=True) or {}
    updates = {}
    now = datetime.now(timezone.utc)

    if "mentor_unread" in data:
        updates["mentor_unread"] = bool(data.get("mentor_unread"))
        if updates["mentor_unread"]:
            updates["status"] = FEEDBACK_STATUS_PENDING
            updates["mentee_status_label"] = FEEDBACK_STATUS_PENDING
            updates["updated_at"] = now
        else:
            updates["mentee_status_label"] = FEEDBACK_MENTEE_RECEIVED
            updates["updated_at"] = now

    if "message" in data:
        message = str(data.get("message", "")).strip()
        if not message:
            return jsonify({"detail": "Nội dung nhắn lại không được để trống"}), 400
        if len(message) > 5000:
            return jsonify({"detail": "Nội dung nhắn lại không được vượt quá 5000 ký tự"}), 400
        from bson import ObjectId

        messages = feedback_messages(doc)
        messages.append({
            "id": str(ObjectId()),
            "sender": "mentor",
            "content": message,
            "created_at": now,
        })
        updates["messages"] = messages
        updates["admin_reply"] = message
        updates["mentee_unread"] = True
        updates["mentor_unread"] = False
        updates["mentee_status_label"] = ""
        updates["updated_at"] = now
        updates["status"] = FEEDBACK_STATUS_DONE
        updates["processed_at"] = now
        updates["processed_by"] = str(admin["_id"])
        updates["processed_by_name"] = admin_display_name(admin)

    if "admin_reply" in data and "message" not in data:
        updates["admin_reply"] = data["admin_reply"].strip()

    if "status" in data and "message" not in data:
        status = data["status"].strip()
        if status not in {FEEDBACK_STATUS_PENDING, FEEDBACK_STATUS_DONE}:
            return jsonify({"detail": "Trạng thái không hợp lệ"}), 400
        updates["status"] = status
        if status == FEEDBACK_STATUS_DONE:
            updates["processed_at"] = now
            updates["processed_by"] = str(admin["_id"])
            updates["processed_by_name"] = admin_display_name(admin)
            updates["mentor_unread"] = False
        else:
            updates["processed_at"] = None
            updates["processed_by"] = ""
            updates["processed_by_name"] = ""

    if not updates:
        return jsonify({"detail": "Không có dữ liệu để cập nhật"}), 400

    feedback_app.update_one({"_id": oid}, {"$set": updates})
    updated = feedback_app.find_one({"_id": oid})

    desc_parts = []
    if "message" in data or "admin_reply" in updates:
        desc_parts.append("nhắn lại mentee")
    if updates.get("mentor_unread") is True:
        desc_parts.append("đánh dấu chưa đọc")
    elif updates.get("mentor_unread") is False and "mentor_unread" in data:
        desc_parts.append("đánh dấu đã đọc")
    if updates.get("status") == FEEDBACK_STATUS_DONE and "message" not in data:
        desc_parts.append("đánh dấu đã xử lí")
    if desc_parts:
        log_mentor_activity(
            admin,
            "feedback_processed",
            f"{' · '.join(desc_parts)} — mentee {updated.get('username')} ({updated.get('email')})",
            target_id=str(oid),
            target_type="feedback",
        )
    if "message" in data and is_l2_mentor_admin(admin):
        push_l2_mentor_activity(
            str(doc["user_id"]),
            admin,
            "messages",
            "feedback_reply",
            f"Trả lời phản hồi mentee ({updated.get('username') or updated.get('email') or 'mentee'})",
        )

    if "message" in data:
        mentee = users.find_one({"_id": doc["user_id"]})
        if mentee:
            preview = message if len(message) <= 500 else f"{message[:497]}..."
            notify_mentee_mentor_activity(
                mentee,
                action="feedback_reply",
                title="Mentor trả lời phản hồi của bạn",
                description=preview,
                mentor_name=admin_display_name(admin),
                mentor_admin=admin,
            )

    return jsonify(feedback_response(updated, admin))


@app.delete("/api/admin/feedback/<feedback_id>")
@with_db
def admin_delete_feedback(feedback_id: str):
    admin, error_response = get_authenticated_admin()
    if error_response:
        return error_response

    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        oid = ObjectId(feedback_id)
    except InvalidId:
        return jsonify({"detail": "Phản hồi không tồn tại"}), 404

    doc = feedback_app.find_one({"_id": oid})
    if not doc:
        return jsonify({"detail": "Phản hồi không tồn tại"}), 404

    mentee_query = mentee_filter_for_admin(admin)
    if mentee_query:
        mentee = users.find_one({"_id": doc["user_id"], **mentee_query})
        if not mentee:
            return jsonify({"detail": "Không có quyền xóa phản hồi này"}), 403

    feedback_app.delete_one({"_id": oid})
    log_mentor_activity(
        admin,
        "feedback_deleted",
        f"Xóa tin nhắn — mentee {doc.get('username')} ({doc.get('email')})",
        target_id=str(oid),
        target_type="feedback",
    )
    return jsonify({"message": "Đã xóa tin nhắn"})

