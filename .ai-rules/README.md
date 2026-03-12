# 🤖 AI Coding Rules - BizFlow

## Mục đích

Folder này chứa các quy tắc coding để AI assistants (GitHub Copilot, Windsurf)
tuân theo khi generate code cho project BizFlow.

## Setup

### GitHub Copilot

- File `.github/copilot-instructions.md` sẽ reference đến folder này
- Copilot tự động đọc khi bạn code

### Windsurf (Cascade)

- Mention `@.ai-rules/general.md` khi cần AI tuân theo rules
- Hoặc thêm folder này vào context window

## Files

| File | Mô tả |
| ---- | ----- |

| `general.md` | Architecture, naming conventions, patterns chung |
| `frontend-nextjs.md` | Rules cho Next.js frontend (App Router, TanStack Query, shadcn/ui) |

## Cập nhật

Khi project có convention mới, update files tương ứng và thông báo team.
