# Design System — HANSOLL Style Picker

## Product Context
- **What this is:** Talbots Outlet 바이어용 의류 스타일 선택/리뷰 내부 도구
- **Who it's for:** 패션 바이어 (Talbots Outlet)
- **Space/industry:** B2B Fashion / Wholesale
- **Project type:** Web app (internal tool)

## Aesthetic Direction
- **Direction:** Luxury/Refined — 의류 제품이 주인공, UI는 절제하고 고급스럽게
- **Decoration level:** Minimal — typography와 whitespace가 디자인을 이끔
- **Mood:** 고급 패션 카탈로그. 바이어가 보는 순간 "진지하게 만든 도구"라는 인상

## Typography
- **Display/Hero:** Instrument Serif — 클래식하고 세련된 serif, Talbots 브랜드와 어울림
- **Body:** DM Sans — 깔끔하고 가독성 높은 sans-serif
- **UI/Labels:** DM Sans 500
- **Data/Tables:** DM Sans (tabular-nums)
- **Loading:** Google Fonts CDN
- **Scale:** 11px labels / 13px meta / 14px body-sm / 15px body / 18px subtitle / 20px stat / 28px section / 32px title

## Color
- **Approach:** Restrained — 1 accent + warm neutrals
- **Background:** #FAF9F7 (warm off-white)
- **Surface:** #FFFFFF
- **Primary text:** #2C2C2C
- **Muted text:** #9B9590 (warm gray)
- **Accent:** #C45A2D (terracotta orange)
- **Accent hover:** #A84B24
- **Accent light:** #FFF6F1
- **Border:** #E8E4E0 (warm)
- **Semantic:** success #3D8B5E, warning #C4862D, error #C43D2D, info #2D6EC4
- **Dark mode:** Not implemented yet

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Grid-disciplined
- **Grid:** 2col mobile / 3col tablet / 4col desktop
- **Max content width:** 800px
- **Border radius:** sm:4px, md:8px, lg:12px, xl:16px, full:9999px

## Motion
- **Approach:** Minimal-functional
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(100ms) short(200ms) medium(300ms)
- **Onboarding:** Conveyor belt background (4 tracks, alternating direction)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-27 | Initial design system created | /design-consultation + B2B fashion platform research |
| 2026-03-27 | Conveyor belt onboarding | MI PDF 사진 활용, 컬렉션 맥락 전달 |
| 2026-03-27 | Instrument Serif for display | Talbots 클래식 여성복 브랜드와 어울리는 serif |
| 2026-03-27 | Terracotta accent #C45A2D | 기존 #E85D2A보다 디프해서 고급스럽고 눈 피로 감소 |
