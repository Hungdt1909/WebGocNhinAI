ANALYSIS_PROMPT = """\
Bạn là chuyên gia phân tích thị trường Việt Nam với 20 năm kinh nghiệm.
Dưới đây là {article_count} tin tức kinh doanh thu thập hôm nay ({date}).

DANH SÁCH TIN TỨC:
{articles_text}

Nhiệm vụ: Phân tích sâu, tìm PATTERN xuyên nhiều nguồn, KHÔNG chỉ tóm tắt tin.
Phát hiện: xu hướng mới, dịch chuyển ngành, thay đổi dòng vốn, cơ hội kinh doanh.

Trả về JSON hợp lệ theo đúng schema (KHÔNG thêm text hay markdown bên ngoài JSON):

{{
  "top_events": [
    {{
      "rank": 1,
      "title": "Tiêu đề sự kiện ngắn gọn",
      "summary": "Tóm tắt 2-3 câu súc tích",
      "why_matters": "Tại sao quan trọng với thị trường VN",
      "affected": ["Đối tượng bị ảnh hưởng"],
      "opportunities": ["Cơ hội cụ thể"],
      "risks": ["Rủi ro cụ thể"],
      "sources": ["Tên nguồn tin"]
    }}
  ],
  "emerging_trends": [
    {{
      "trend": "Tên xu hướng",
      "evidence": "Bằng chứng từ nhiều tin tức (cite nguồn)",
      "industries": ["Ngành liên quan"],
      "significance": "Tại sao xu hướng này quan trọng"
    }}
  ],
  "watch_list": [
    {{
      "item": "Điều cần theo dõi",
      "reason": "Tại sao cần theo dõi",
      "trigger": "Dấu hiệu/sự kiện cần chú ý"
    }}
  ],
  "predictions": {{
    "timeframe": "30 ngày tới",
    "forecasts": [
      {{
        "sector": "Ngành",
        "prediction": "Dự báo cụ thể",
        "confidence": "cao",
        "basis": "Cơ sở dự báo từ dữ liệu hôm nay"
      }}
    ],
    "macro_outlook": "Nhận định vĩ mô tổng thể cho 30 ngày tới"
  }}
}}

Yêu cầu:
- top_events: đúng 10 sự kiện, xếp theo mức độ quan trọng
- emerging_trends: 3-5 xu hướng, PHẢI có bằng chứng từ ít nhất 2 nguồn
- watch_list: 3-5 mục cần theo dõi
- predictions.forecasts: 3-5 dự báo theo ngành
- Tất cả nội dung viết bằng tiếng Việt
- sources array KHÔNG được rỗng
"""
