
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

@app.post("/api/feedback")
@with_db
def create_feedback():
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    data = request.get_json(silent=True) or {}
    content = data.get("content", "").strip()

    if not content:
        return jsonify({"detail": "Nội dung phản hồi không được để trống"}), 400

    if len(content) > 5000:
        return jsonify({"detail": "Phản hồi không được vượt quá 5000 ký tự"}), 400

    now = datetime.now(timezone.utc)
    from bson import ObjectId

    initial_message = {
        "id": str(ObjectId()),
        "sender": "mentee",
        "content": content,
        "created_at": now,
    }
    doc = {
        "user_id": user["_id"],
        "username": user["username"],
        "email": user["email"],
        "content": content,
        "messages": [initial_message],
        "status": FEEDBACK_STATUS_PENDING,
        "created_at": now,
        "updated_at": now,
        "processed_at": None,
        "admin_reply": "",
        "mentor_unread": True,
        "mentee_unread": False,
        "mentee_status_label": "",
    }

    result = feedback_app.insert_one(doc)
    doc["_id"] = result.inserted_id
    notify_mentors_mentee_feedback(user, content)
    return jsonify(feedback_response(doc)), 201


@app.post("/api/feedback/<feedback_id>/reply")
@with_db
def mentee_reply_feedback(feedback_id: str):
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    data = request.get_json(silent=True) or {}
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"detail": "Nội dung phản hồi không được để trống"}), 400
    if len(content) > 5000:
        return jsonify({"detail": "Phản hồi không được vượt quá 5000 ký tự"}), 400

    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        oid = ObjectId(feedback_id)
    except InvalidId:
        return jsonify({"detail": "Phản hồi không tồn tại"}), 404

    doc = feedback_app.find_one({"_id": oid, "user_id": user["_id"]})
    if not doc:
        return jsonify({"detail": "Phản hồi không tồn tại"}), 404

    now = datetime.now(timezone.utc)
    messages = feedback_messages(doc)
    messages.append({
        "id": str(ObjectId()),
        "sender": "mentee",
        "content": content,
        "created_at": now,
    })

    feedback_app.update_one(
        {"_id": oid},
        {
            "$set": {
                "messages": messages,
                "updated_at": now,
                "mentor_unread": True,
                "mentee_unread": False,
                "mentee_status_label": "",
                "status": FEEDBACK_STATUS_PENDING,
                "processed_at": None,
                "processed_by": "",
            }
        },
    )
    updated = feedback_app.find_one({"_id": oid})
    notify_mentors_mentee_feedback(user, content)
    return jsonify(feedback_response(updated)), 201


@app.post("/api/feedback/<feedback_id>/ack")
@with_db
def mentee_ack_feedback(feedback_id: str):
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        oid = ObjectId(feedback_id)
    except InvalidId:
        return jsonify({"detail": "Phản hồi không tồn tại"}), 404

    doc = feedback_app.find_one({"_id": oid, "user_id": user["_id"]})
    if not doc:
        return jsonify({"detail": "Phản hồi không tồn tại"}), 404

    feedback_app.update_one({"_id": oid}, {"$set": {"mentee_unread": False}})
    updated = feedback_app.find_one({"_id": oid})
    return jsonify(feedback_response(updated, admin))


@app.delete("/api/feedback/<feedback_id>")
@with_db
def mentee_delete_feedback(feedback_id: str):
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        oid = ObjectId(feedback_id)
    except InvalidId:
        return jsonify({"detail": "Phản hồi không tồn tại"}), 404

    doc = feedback_app.find_one({"_id": oid, "user_id": user["_id"]})
    if not doc:
        return jsonify({"detail": "Phản hồi không tồn tại"}), 404

    feedback_app.delete_one({"_id": oid})
    return jsonify({"message": "Đã xóa tin nhắn"})


@app.get("/api/feedback")
@with_db
def list_feedback():
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    cursor = feedback_app.find({"user_id": user["_id"]}).sort("created_at", -1)
    items = [feedback_response(doc) for doc in cursor]
    return jsonify({
        "items": items,
        "unread_count": count_mentee_unread_feedback_threads(user["_id"]),
    })

