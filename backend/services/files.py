
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

from auth.security import *
from auth.users import *
from auth.login_tracking import *
from auth.validators import *
from services.admins import *
from services.apply_documents import *
from services.apply_progress import *
from services.feedback import *
from services.files import *
from services.hdnk_nckh import *
from services.inbox import *
from services.notifications import *
from services.utils import *

def make_download_response(data: bytes, download_name: str, mimetype: str | None = None):
    from urllib.parse import quote

    buffer = io.BytesIO(data)
    buffer.seek(0)
    response = send_file(
        buffer,
        as_attachment=True,
        download_name=download_name,
        mimetype=mimetype or "application/octet-stream",
    )
    response.headers["X-Download-Filename"] = quote(download_name)
    return response


def make_inline_file_response(data: bytes, download_name: str, mimetype: str | None = None):
    buffer = io.BytesIO(data)
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=False,
        download_name=download_name,
        mimetype=mimetype or "application/pdf",
    )

