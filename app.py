import streamlit as st
from google import genai
import qrcode
from io import BytesIO

# 페이지 설정
st.set_page_config(page_title="ER 스마트 퇴원 안내 시스템", page_icon="🏥", layout="centered")

st.title("🏥 응급실 원터치 스마트 퇴원 안내기")
st.markdown("스마트폰 자판의 **마이크(받아쓰기) 버튼**을 눌러 편하게 말씀하시면 텍스트가 입력됩니다.")

# 사이드바: API 키 입력
st.sidebar.header("⚙️ 설정")
api_key = st.sidebar.text_input(
    "Google Gemini API Key", type="password", help="구글 AI Studio에서 발급받은 키를 입력하세요."
)

# 질환별 템플릿 데이터 (여기에 질환을 계속 추가하시면 됩니다)
DISEASE_TEMPLATES = {
    "급성 장염": {
        "education": "초기에는 미음, 죽 등 자극 없는 유동식을 드시고, 증상이 호전되면 부드러운 일반식으로 넘어가세요. 충분한 수분 섭취가 중요합니다.",
        "warning_signs": ["38도 이상의 고열이 지속될 때", "혈변이나 검은변이 나올 때", "심한 복통이 멈추지 않을 때"],
    },
    "상복부 통증": {
        "education": "기름지거나 맵고 짜 자극적인 음식, 카페인, 탄산음료를 피하세요. 증상이 완화될 때까지 무리한 신체 활동을 자제하고 안정을 취하세요.",
        "warning_signs": ["등 뒤나 어깨로 뻗치는 극심한 통증", "식은땀이 나고 어지러울 때", "토혈이나 흑색변이 보일 때"],
    },
    "타박상": {
        "education": "부상 초기 2~3일간은 냉찜질을 통해 부기를 가라앉히고, 이후에는 온찜질로 전환하세요. 무리한 사용을 피하고 해당 부위를 심장보다 높게 두는 것이 좋습니다.",
        "warning_signs": ["부종과 통증이 시간이 갈수록 심해질 때", "다친 부위의 감각이 사라지거나 손발이 차가워질 때"],
    },
    "단순 발열": {
        "education": "탈수를 막기 위해 미지근한 물과 이온음료를 자주 드시고, 처방된 해열제 용법을 준수하세요. 미지근한 물 마사지가 열을 내리는 데 도움이 됩니다.",
        "warning_signs": ["해열제를 복용해도 열이 떨어지지 않을 때", "심한 두통, 목 뻣뻣함, 호흡 곤란이 동반될 때"],
    },
}

# 메인 입력 섹션
st.subheader("🎙️ 진료 소견 음성/텍스트 입력")
user_input = st.text_area(
    "환자 상태 및 소견",
    placeholder="예: 장염이고 피검사 염증수치 살짝 높음. 수액 맞고 귀가하며 해열제 처방함.",
    height=120
)

if st.button("🚀 AI 분석 및 퇴원 안내문·QR 생성", type="primary"):
    if not api_key:
        st.error("사이드바에 Gemini API Key를 입력해주세요!")
    elif not user_input.strip():
        st.warning("소견 내용을 입력하거나 음성으로 말해 주세요.")
    else:
        with st.spinner("AI가 고품질 퇴원 안내문을 작성 중입니다..."):
            try:
                client = genai.Client(api_key=api_key)

                # 프롬프트를 대폭 강화하여 안내문 퀄리티를 전문가 수준으로 유도
                prompt = f"""
                당신은 응급실 전문의를 보조하는 최고의 임상 AI입니다. 
                아래 입력된 의사의 진료 소견을 바탕으로, 환자가 집에서 완벽하게 이해하고 대처할 수 있는 고품질 퇴원 안내 내용을 작성해주세요.
                
                가능한 질환 카테고리는 다음 중 하나여야 합니다: {list(DISEASE_TEMPLATES.keys())}
                
                입력 소견:
                {user_input}
                
                [작성 지침]
                - education 항목은 환자의 눈높이에 맞춰 친절하고 상세하게 작성하되, 식이요법, 일상생활 주의사항, 복약 지도 등을 체계적으로 포함할 것.
                - warning_signs(재내원 경고 증상)는 의학적 판단에 따라 위험 신호를 명확한 리스트 형태로 구성할 것.
                
                반드시 아래 JSON 형식으로만 결과를 반환해주세요 (마크다운 코드블록 백틱 기호 ``` 도 붙이지 말고 순수 JSON만 출력):
                {{
                  "diagnosis": "진단명",
                  "category": "위 카테고리 중 일치하는 것",
                  "findings": "검사 및 진찰 소견 요약",
                  "education": "환자용 상세 퇴원 및 생활 안내 사항",
                  "medication": "처방 내용 요약"
                }}
                """

                response = client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=prompt
                )

                st.success("분석 완료!")
                st.write("### 📋 AI 분석 결과")
                st.write(response.text)

                st.session_state["generated"] = True
                # 나중에 환자 페이지 연동을 위해 결과 텍스트도 세션에 저장
                st.session_state["ai_result"] = response.text

            except Exception as e:
                st.error(f"오류가 발생했습니다: {e}")

# QR 코드 생성 섹션
if "generated" in st.session_state and st.session_state["generated"]:
    st.divider()
    st.subheader("📱 환자용 모바일 안내 링크 & QR 코드")
    
    # 실제 접속 가능한 로컬 네트워크 주소 연동 (추후 클라우드 배포 시 해당 URL로 변경)
    patient_url = "[http://14.33.241.212:8501](http://14.33.241.212:8501)"

    qr = qrcode.QRCode(version=1, box_size=5, border=2)
    qr.add_data(patient_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = BytesIO()
    img.save(buf, format="PNG")
    st.image(buf.getvalue(), width=200)
    st.write(f"접속 주소: `{patient_url}`")
    st.caption("💡 스마트폰이 컴퓨터와 같은 Wi-Fi에 연결되어 있다면, 위 QR을 찍었을 때 이 앱 화면이 열립니다.")