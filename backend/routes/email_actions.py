
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

@app.get("/api/email/inbox/view")
@with_db
def email_inbox_view():
    from inbox_tasks import find_task_by_token, inbox_urls, record_inbox_view

    token = request.args.get("token", "").strip()
    task = find_task_by_token(mentor_inbox, token, "view_token")
    if not task or task.get("audience") != "mentor":
        return render_email_action_page(
            title="Link không hợp lệ",
            message="Link đã hết hạn hoặc không tồn tại.",
            success=False,
        )

    task = record_inbox_view(mentor_inbox, task) or task
    apply_inbox_view_side_effects(task)
    urls = inbox_urls(BACKEND_PUBLIC_URL, task)
    snooze_html = render_inbox_snooze_html(task)
    body = f"""
    <p><strong>{task.get('title', '')}</strong></p>
    <p>{task.get('description', '')}</p>
    <p>Mentee: {task.get('mentee_name', '')} ({task.get('mentee_email', '')})</p>
    <p style="margin-top:1rem;">
      <a href="{urls['confirm']}" style="display:inline-block;padding:0.65rem 1rem;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Đã xử lí</a>
    </p>
    {snooze_html}
    """
    file_url = urls["file"] if task.get("doc_id") and task.get("doc_id") not in NO_FILE_UPLOAD_DOC_IDS else ""
    return render_email_view_page(title=task.get("title", "Xem nội dung"), body_html=body, file_url=file_url)


@app.get("/api/email/inbox/file")
@with_db
def email_inbox_file():
    from inbox_tasks import find_task_by_token

    token = request.args.get("token", "").strip()
    task = find_task_by_token(mentor_inbox, token, "view_token")
    if not task:
        return render_email_action_page(
            title="Không thể xem file",
            message="Link đã hết hạn hoặc không tồn tại.",
            success=False,
        )

    result, error = build_inbox_document_payload(task)
    if error:
        return render_email_action_page(title="Không thể xem file", message=error, success=False)

    payload, download_name, mimetype = result
    return make_inline_file_response(payload, download_name, mimetype)


@app.get("/api/email/inbox/confirm")
@with_db
def email_inbox_confirm():
    from inbox_tasks import confirm_inbox_task, serialize_inbox_task

    token = request.args.get("token", "").strip()
    task = confirm_inbox_task(mentor_inbox, confirm_token=token, via="email")
    if not task:
        return render_email_action_page(
            title="Không thể xác nhận",
            message="Link đã hết hạn, đã dùng, hoặc công việc đã được xử lý.",
            success=False,
        )

    apply_inbox_confirm_side_effects(task)
    notify_mentee_inbox_processed(task)
    return render_email_action_page(
        title="Đã xác nhận xử lí",
        message=f"Đã ghi nhận: <strong>{task.get('title', '')}</strong>. Mentee sẽ nhận email thông báo.",
        success=True,
    )


@app.get("/api/email/inbox/snooze")
@with_db
def email_inbox_snooze():
    from inbox_tasks import find_task_by_token, inbox_urls, snooze_inbox_by_token

    token = request.args.get("token", "").strip()
    hours_raw = request.args.get("hours", "").strip()
    try:
        hours = int(hours_raw)
    except (TypeError, ValueError):
        hours = 0

    task = snooze_inbox_by_token(mentor_inbox, token, hours)
    if not task:
        return render_email_action_page(
            title="Không thể đặt nhắc nhở",
            message="Link đã hết hạn hoặc công việc đã được xử lý.",
            success=False,
        )

    urls = inbox_urls(BACKEND_PUBLIC_URL, task)
    label_map = {24: "1 ngày", 72: "3 ngày", 168: "1 tuần"}
    label = label_map.get(hours, f"{hours} giờ")
    return render_email_action_page(
        title="Đã đặt nhắc nhở",
        message=(
            f"Sẽ nhắc lại sau <strong>{label}</strong>. "
            f'Bạn có thể <a href="{urls["view"]}" style="color:#eb2233;font-weight:600;">xem nội dung</a> '
            f'hoặc <a href="{urls["confirm"]}" style="color:#059669;font-weight:600;">xác nhận đã xử lí</a>.'
        ),
        success=True,
    )


@app.get("/api/email/mentee/view")
@with_db
def email_mentee_view():
    from inbox_tasks import find_task_by_token, mentee_doc_urls

    token = request.args.get("token", "").strip()
    task = find_task_by_token(mentor_inbox, token, "view_token")
    if not task or task.get("audience") != "mentee":
        return render_email_action_page(
            title="Link không hợp lệ",
            message="Link đã hết hạn hoặc không tồn tại.",
            success=False,
        )

    urls = mentee_doc_urls(BACKEND_PUBLIC_URL, task)
    body = f"""
    <p>{task.get('description', '')}</p>
    <p>Mentor: {task.get('mentor_name', 'Mentor')}</p>
    """
    file_url = urls["file"] if task.get("doc_id") else ""
    return render_email_view_page(title=task.get("title", "Xem giấy tờ"), body_html=body, file_url=file_url)


@app.get("/api/email/mentee/file")
@with_db
def email_mentee_file():
    from inbox_tasks import find_task_by_token

    token = request.args.get("token", "").strip()
    task = find_task_by_token(mentor_inbox, token, "view_token")
    if not task or task.get("audience") != "mentee":
        return render_email_action_page(
            title="Không thể xem file",
            message="Link đã hết hạn hoặc không tồn tại.",
            success=False,
        )

    result, error = build_inbox_document_payload(task)
    if error:
        return render_email_action_page(title="Không thể xem file", message=error, success=False)

    payload, download_name, mimetype = result
    return make_inline_file_response(payload, download_name, mimetype)

