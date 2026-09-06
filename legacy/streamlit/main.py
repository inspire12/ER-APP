import json
import hmac
import os
import secrets
import socket
import sqlite3
from io import BytesIO
from pathlib import Path
from urllib.parse import urlencode

import qrcode
import streamlit as st
from google import genai

st.set_page_config(page_title="ER 스마트 퇴원 안내", page_icon="🏥", layout="centered")
st.markdown(
    """
    <style>
    .block-container {max-width: 860px; padding-top: 2rem; padding-bottom: 4rem;}
    h1 {letter-spacing: -0.04em;} h2, h3 {letter-spacing: -0.025em;}
    [data-testid="stAlert"] {border-radius: 14px;}
    [data-testid="stForm"] {border: 1px solid #e5e7eb; border-radius: 16px; padding: 1.25rem;}
    .patient-header {padding: 1.4rem; background: #eff6ff; border-radius: 18px; margin-bottom: 1rem;}
    .patient-card {padding: 1.2rem; border: 1px solid #e5e7eb; border-radius: 16px; margin: .8rem 0;}
    .danger-card {padding: 1.2rem; background: #fff1f2; border: 2px solid #fda4af; border-radius: 16px; margin: .8rem 0;}
    .patient-card p, .danger-card p {font-size: 1.08rem; line-height: 1.8; white-space: pre-wrap;}
    </style>
    """,
    unsafe_allow_html=True,
)

DB_PATH = Path(os.getenv("DATABASE_PATH", Path(__file__).with_name("reports.db")))

# 기존 MVP의 짧고 설명적인 어투를 초기 콘텐츠 기준으로 사용한다.
DISEASE_TEMPLATES = {
    "급성 장염": {
        "aliases": "장염, 위장염, 설사, 구토",
        "medication": "처방된 약은 처방전의 용법과 용량에 따라 복용하세요.",
        "education": "초기에는 미음, 죽 등 자극 없는 유동식을 드시고, 증상이 호전되면 부드러운 일반식으로 넘어가세요. 충분한 수분 섭취가 중요합니다.",
        "warning_signs": "38도 이상의 고열이 지속될 때, 혈변이나 검은변이 나올 때, 심한 복통이 멈추지 않을 때",
    },
    "상복부 통증": {
        "aliases": "명치 통증, 복통, 위염, 소화불량",
        "medication": "처방된 위장약과 진통제는 안내받은 방법대로 복용하세요.",
        "education": "기름지거나 맵고 짠 음식, 카페인, 탄산음료를 피하세요. 증상이 완화될 때까지 무리한 신체 활동을 자제하고 안정을 취하세요.",
        "warning_signs": "등 뒤나 어깨로 뻗치는 극심한 통증이 있을 때, 식은땀이 나고 어지러울 때, 토혈이나 흑색변이 보일 때",
    },
    "타박상": {
        "aliases": "멍, 부딪힘, 염좌, 삠, 근육통",
        "medication": "처방된 소염진통제와 근육 이완제는 안내받은 방법대로 복용하세요.",
        "education": "부상 초기 2~3일간은 냉찜질을 통해 부기를 가라앉히고, 이후에는 온찜질로 전환하세요. 무리한 사용을 피하고 해당 부위를 심장보다 높게 두는 것이 좋습니다.",
        "warning_signs": "부종과 통증이 시간이 갈수록 심해질 때, 다친 부위의 감각이 사라지거나 손발이 차가워질 때",
    },
    "단순 발열": {
        "aliases": "열, 고열, 몸살, 감기",
        "medication": "처방된 해열진통제는 처방전의 용법과 용량에 따라 복용하세요.",
        "education": "탈수를 막기 위해 미지근한 물과 이온음료를 자주 드시고, 처방된 해열제 용법을 준수하세요. 무리한 활동을 피하고 충분히 휴식하세요.",
        "warning_signs": "해열제를 복용해도 열이 떨어지지 않을 때, 심한 두통이나 목 뻣뻣함이 있을 때, 호흡 곤란이 동반될 때",
    },
}

DEMO_INPUT = (
    "성인 환자. 오늘 새벽부터 설사 5회와 구토 2회, 배꼽 주변 복통으로 내원함. "
    "활력징후 안정적이고 의식 명료함. 복부는 부드럽고 반발통과 우하복부 국소 압통 없음. "
    "혈액검사에서 경미한 염증수치 상승 외 특이소견 없음. 수액 치료 후 증상 호전됨. "
    "위장관 증상 조절약 처방함."
)
DEMO_ANALYSIS = {
    "diagnosis": "급성 위장염 의심",
    "template_name": "급성 장염",
    "findings": "활력징후는 안정적이고 의식은 명료합니다. 복부는 부드럽고 반발통이나 우하복부 국소 압통은 없습니다. 혈액검사에서는 경미한 염증수치 상승 외 특이소견이 확인되지 않았습니다.",
    "medication_note": "위장관 증상 조절약이 처방되었습니다.",
}


def connect_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS disease_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                aliases TEXT NOT NULL DEFAULT '',
                medication TEXT NOT NULL DEFAULT '',
                education TEXT NOT NULL DEFAULT '',
                warning_signs TEXT NOT NULL DEFAULT '',
                active INTEGER NOT NULL DEFAULT 1,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        for name, template in DISEASE_TEMPLATES.items():
            conn.execute("""
                INSERT OR IGNORE INTO disease_templates
                    (name, aliases, medication, education, warning_signs)
                VALUES (?, ?, ?, ?, ?)
            """, (name, template["aliases"], template["medication"], template["education"], template["warning_signs"]))


def list_templates(active_only=False):
    query = "SELECT * FROM disease_templates"
    if active_only:
        query += " WHERE active = 1"
    query += " ORDER BY name"
    with connect_db() as conn:
        return [dict(row) for row in conn.execute(query).fetchall()]


def get_template(template_id):
    with connect_db() as conn:
        row = conn.execute("SELECT * FROM disease_templates WHERE id = ?", (template_id,)).fetchone()
    return dict(row) if row else None


def save_template(template_id, data):
    with connect_db() as conn:
        values = (data["name"], data["aliases"], data["medication"], data["education"], data["warning_signs"], data["active"])
        if template_id:
            conn.execute("""
                UPDATE disease_templates
                SET name = ?, aliases = ?, medication = ?, education = ?, warning_signs = ?,
                    active = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, values + (template_id,))
        else:
            conn.execute("""
                INSERT INTO disease_templates
                    (name, aliases, medication, education, warning_signs, active)
                VALUES (?, ?, ?, ?, ?, ?)
            """, values)


def save_report(report_id, data):
    with connect_db() as conn:
        conn.execute("INSERT INTO reports (id, payload) VALUES (?, ?)", (report_id, json.dumps(data, ensure_ascii=False)))


def load_report(report_id):
    with connect_db() as conn:
        row = conn.execute("SELECT payload FROM reports WHERE id = ?", (report_id,)).fetchone()
    return json.loads(row["payload"]) if row else None


def get_lan_ip():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "localhost"
    finally:
        sock.close()


def get_base_url():
    configured = os.getenv("PUBLIC_BASE_URL", "").strip().rstrip("/")
    if configured:
        return configured
    try:
        headers = st.context.headers
        host = headers.get("X-Forwarded-Host") or headers.get("Host", "localhost:8501")
        scheme = headers.get("X-Forwarded-Proto") or ("http" if "localhost" in host else "https")
        if host.startswith(("localhost", "127.0.0.1")):
            port = host.rsplit(":", 1)[1] if ":" in host else "8501"
            host = f"{get_lan_ip()}:{port}"
        return f"{scheme}://{host}"
    except Exception:
        return f"http://{get_lan_ip()}:8501"


def make_qr_png(value):
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=4)
    qr.add_data(value)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


def parse_json_response(text):
    cleaned = text.strip().removeprefix("```json").removesuffix("```").strip()
    return json.loads(cleaned)


def require_staff_access():
    """배포 시 환경변수 하나로 의료진 화면을 보호하는 최소 인증."""
    expected_password = os.getenv("APP_PASSWORD", "")
    if not expected_password or st.session_state.get("staff_authenticated"):
        return True

    st.title("의료진 로그인")
    st.caption("퇴원 안내문 작성과 콘텐츠 관리는 의료진만 사용할 수 있습니다.")
    password = st.text_input("접근 비밀번호", type="password")
    if st.button("로그인", type="primary", use_container_width=True):
        if hmac.compare_digest(password, expected_password):
            st.session_state["staff_authenticated"] = True
            st.rerun()
        else:
            st.error("비밀번호가 올바르지 않습니다.")
    return False


def analyze_input(user_input, templates, api_key, demo_mode):
    if demo_mode:
        return DEMO_ANALYSIS.copy()
    catalog = [{"name": item["name"], "aliases": item["aliases"]} for item in templates]
    prompt = f"""
당신은 응급실 의료진의 입력을 정리하는 보조 도구입니다.
새로운 진단, 처방, 검사 결과, 생활 안내를 만들지 마세요.
입력에 명시된 정보만 환자가 이해하기 쉬운 존댓말로 정리하세요.
아래 DB 템플릿 중 가장 가까운 하나를 추천하세요. 확실하지 않으면 template_name을 빈 문자열로 반환하세요.

템플릿 목록: {json.dumps(catalog, ensure_ascii=False)}
의료진 입력: {user_input}

아래 JSON 형식으로만 답하세요.
{{"diagnosis":"입력에 기재된 진단명 또는 의심 진단","template_name":"추천 템플릿명 또는 빈 문자열","findings":"입력에 기재된 검사 및 진찰 소견","medication_note":"입력에 기재된 처방 내용"}}
"""
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), contents=prompt)
    return parse_json_response(response.text)


def render_patient_page(data):
    st.markdown("""
        <div class="patient-header"><h1 style="margin:0 0 .4rem 0">응급실 퇴원 안내</h1>
        <p style="margin:0;font-size:1.05rem">집에서 안전하게 회복하실 수 있도록 꼭 확인해 주세요.</p></div>
    """, unsafe_allow_html=True)
    st.success(f"진단명 · {data.get('diagnosis') or '응급실 진료 질환'}")
    sections = [
        ("오늘 확인한 내용", data.get("findings") or "의료진에게 안내받은 진료 내용을 참고하세요.", "patient-card"),
        ("처방 및 복약 안내", data.get("medication") or "처방전의 용법과 용량을 확인해 주세요.", "patient-card"),
        ("집에서 이렇게 관리하세요", data.get("education") or "충분히 휴식하세요.", "patient-card"),
        ("이런 증상이 있으면 다시 오세요", data.get("warning_signs") or "증상이 악화되면 응급실로 다시 오세요.", "danger-card"),
    ]
    for title, content, css_class in sections:
        st.subheader(title)
        st.markdown(f'<div class="{css_class}"><p>{content}</p></div>', unsafe_allow_html=True)
    st.caption("이 안내문은 담당 의료진이 확인하고 승인한 내용입니다.")


def render_content_manager():
    st.title("질환별 안내 콘텐츠 관리")
    st.caption("환자에게 반복해서 제공할 검수 문구를 등록합니다. 저장 전 미리보기를 확인해 주세요.")
    templates = list_templates()
    choices = {"새 콘텐츠 등록": None, **{item["name"]: item["id"] for item in templates}}
    selected_name = st.selectbox("등록된 질환", list(choices.keys()))
    selected_id = choices[selected_name]
    selected = get_template(selected_id) if selected_id else None

    with st.form("template_form"):
        name = st.text_input("질환명 *", value=selected["name"] if selected else "")
        aliases = st.text_input("별칭·검색어", value=selected["aliases"] if selected else "", placeholder="쉼표로 구분: 장염, 위장염, 설사")
        medication = st.text_area("처방·복약 안내 *", value=selected["medication"] if selected else "", height=120)
        education = st.text_area("생활·식이·자가관리 안내 *", value=selected["education"] if selected else "", height=220)
        warning_signs = st.text_area("즉시 재내원해야 하는 증상 *", value=selected["warning_signs"] if selected else "", height=180)
        active = st.checkbox("진료 화면에서 사용", value=bool(selected["active"]) if selected else False)
        submitted = st.form_submit_button("저장", type="primary", use_container_width=True)

    if submitted:
        if not all(value.strip() for value in (name, medication, education, warning_signs)):
            st.error("별표(*) 항목을 모두 입력해 주세요.")
        else:
            try:
                save_template(selected_id, {"name": name.strip(), "aliases": aliases.strip(), "medication": medication.strip(), "education": education.strip(), "warning_signs": warning_signs.strip(), "active": int(active)})
                st.success("콘텐츠를 저장했습니다.")
            except sqlite3.IntegrityError:
                st.error("같은 질환명이 이미 등록되어 있습니다.")

    if any((name, medication, education, warning_signs)):
        with st.expander("환자 화면 미리보기"):
            render_patient_page({"diagnosis": name, "findings": "환자별 검사 및 진찰 소견이 여기에 표시됩니다.", "medication": medication, "education": education, "warning_signs": warning_signs})


def apply_template_to_draft(template):
    analysis = st.session_state.get("analysis", {})
    medication = "\n\n".join(filter(None, (analysis.get("medication_note", ""), template["medication"])))
    st.session_state.update({
        "draft_diagnosis": analysis.get("diagnosis", ""),
        "draft_findings": analysis.get("findings", ""),
        "draft_medication": medication,
        "draft_education": template["education"],
        "draft_warning": template["warning_signs"],
        "applied_template_id": template["id"],
    })


def render_qr_result():
    report_id = st.session_state.get("report_id")
    if not report_id:
        return
    patient_url = st.session_state["patient_url"]
    st.success("안내문이 승인되었습니다. 아래 링크와 QR은 같은 안내문을 엽니다.")
    st.link_button("환자용 안내문 열기", patient_url, use_container_width=True)
    st.code(patient_url, language=None)
    qr_png = make_qr_png(patient_url)
    st.image(qr_png, width=260, caption="환자 스마트폰으로 스캔하세요")
    st.download_button("QR 코드 PNG 다운로드", data=qr_png.getvalue(), file_name=f"discharge-{report_id[:8]}.png", mime="image/png", use_container_width=True)


def render_doctor_page():
    st.title("응급실 스마트 퇴원 안내")
    st.caption("진료 내용을 정리하고, 검수된 안내문을 선택한 뒤 직접 확인하여 발급합니다.")
    templates = list_templates(active_only=True)
    if not templates:
        st.warning("사용 가능한 안내 콘텐츠가 없습니다. 먼저 콘텐츠 관리에서 등록해 주세요.")
        return

    st.subheader("1. 진료 내용 입력")
    demo_mode = st.toggle("데모 모드", help="API Key 없이 전체 흐름을 시험합니다.")
    if demo_mode and not st.session_state.get("clinical_input"):
        st.session_state["clinical_input"] = DEMO_INPUT
    user_input = st.text_area("진단명, 검사·진찰 소견, 처방 내용을 입력하세요.", height=180, key="clinical_input", placeholder="예: 급성 장염 의심. 복부는 부드럽고 반발통 없음...")
    api_key = os.getenv("GEMINI_API_KEY", "") or st.sidebar.text_input("Gemini API Key", type="password", help="배포 환경에서는 GEMINI_API_KEY 환경변수를 사용하세요.")

    if st.button("진료 내용 분석", type="primary", use_container_width=True):
        if not user_input.strip():
            st.warning("진료 내용을 입력해 주세요.")
        elif not demo_mode and not api_key:
            st.error("Gemini API Key를 입력하거나 데모 모드를 켜 주세요.")
        else:
            try:
                with st.spinner("진료 내용을 정리하고 있습니다..."):
                    analysis = analyze_input(user_input, templates, api_key, demo_mode)
                st.session_state["analysis"] = analysis
                st.session_state["report_id"] = None
                recommended = next((item for item in templates if item["name"] == analysis.get("template_name")), None)
                if recommended:
                    apply_template_to_draft(recommended)
                st.success("분석했습니다. 추천 템플릿과 내용을 확인해 주세요.")
            except Exception as error:
                st.error(f"분석하지 못했습니다. 템플릿을 직접 선택해 주세요. ({error})")
                st.session_state["analysis"] = {"diagnosis": "", "template_name": "", "findings": "", "medication_note": ""}

    if "analysis" not in st.session_state:
        return

    st.divider()
    st.subheader("2. 안내문 선택 및 확인")
    recommended_name = st.session_state["analysis"].get("template_name")
    st.info(f"추천 안내문: {recommended_name}" if recommended_name else "추천 결과가 없습니다. 안내문을 직접 선택해 주세요.")
    names = [item["name"] for item in templates]
    selected_name = st.selectbox("질환별 안내문", names, index=names.index(recommended_name) if recommended_name in names else 0)
    selected_template = next(item for item in templates if item["name"] == selected_name)
    if st.button("선택한 안내문 적용", use_container_width=True):
        apply_template_to_draft(selected_template)
        st.rerun()
    if "draft_diagnosis" not in st.session_state:
        st.warning("안내문을 선택하고 적용해 주세요.")
        return

    with st.form("approval_form"):
        diagnosis = st.text_input("진단명 또는 의심 진단", key="draft_diagnosis")
        findings = st.text_area("검사 및 진찰 소견", height=140, key="draft_findings")
        medication = st.text_area("처방 및 복약 안내", height=150, key="draft_medication")
        education = st.text_area("생활·식이·자가관리 안내", height=200, key="draft_education")
        warning_signs = st.text_area("즉시 재내원해야 하는 증상", height=170, key="draft_warning")
        confirmed = st.checkbox("위 내용을 직접 확인했습니다.")
        approved = st.form_submit_button("승인 및 QR 발급", type="primary", use_container_width=True)

    if approved:
        if not confirmed:
            st.error("내용 확인 항목을 선택해 주세요.")
        elif not all(value.strip() for value in (diagnosis, medication, education, warning_signs)):
            st.error("진단명과 안내 문구를 모두 확인해 주세요.")
        else:
            report_id = secrets.token_urlsafe(24)
            save_report(report_id, {"diagnosis": diagnosis.strip(), "findings": findings.strip(), "medication": medication.strip(), "education": education.strip(), "warning_signs": warning_signs.strip(), "template_id": st.session_state.get("applied_template_id")})
            st.session_state["report_id"] = report_id
            st.session_state["patient_url"] = f"{get_base_url()}/?{urlencode({'id': report_id})}"

    if st.session_state.get("report_id"):
        st.divider()
        st.subheader("3. 환자 링크 및 QR")
        render_qr_result()


init_db()
if "id" in st.query_params:
    patient_data = load_report(st.query_params["id"])
    render_patient_page(patient_data) if patient_data else st.error("유효하지 않거나 만료된 안내문 링크입니다.")
    st.stop()

if not require_staff_access():
    st.stop()

st.sidebar.title("메뉴")
page = st.sidebar.radio("화면 선택", ["퇴원 안내문 작성", "질환별 콘텐츠 관리"])
render_content_manager() if page == "질환별 콘텐츠 관리" else render_doctor_page()
