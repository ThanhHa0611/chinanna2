
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

@app.get("/api/admin/mentees")
@with_db
def admin_list_mentees():
    admin, error_response = get_authenticated_admin()
    if error_response:
        return error_response

    query = mentee_admin_list_query(admin)
    cursor = users.find(query).sort("created_at", -1)

    items = []
    for user in cursor:
        items.append(serialize_admin_mentee_summary(user, admin))

    return jsonify(items)


@app.get("/api/admin/mentee-registrations")
@with_db
def admin_list_mentee_registrations():
    admin, error_response = get_authenticated_admin()
    if error_response:
        return error_response

    if not admin_is_approved(admin):
        return jsonify({"detail": "Tài khoản chưa được cấp quyền admin."}), 403

    query = pending_mentee_registration_query(admin)
    cursor = users.find(query).sort("requested_at", -1)
    return jsonify([serialize_unified_access_request_mentee(doc) for doc in cursor])


@app.patch("/api/admin/mentee-registrations/<mentee_id>")
@with_db
def admin_review_mentee_registration(mentee_id: str):
    admin, error_response = get_authenticated_admin()
    if error_response:
        return error_response

    if not admin_is_approved(admin):
        return jsonify({"detail": "Tài khoản chưa được cấp quyền admin."}), 403

    data = request.get_json(silent=True) or {}
    return apply_mentee_registration_review(admin, mentee_id, data)

