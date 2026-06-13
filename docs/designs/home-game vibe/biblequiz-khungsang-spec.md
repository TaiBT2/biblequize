# BibleQuiz · "Khung Sáng" — Design Spec

Bộ tài liệu này đi kèm 2 file: `biblequiz-tokens.css` (token layer) và `biblequiz-tailwind.config.js` (Tailwind extend). Mục tiêu: dựng lại trang chủ trong React 18 + Vite + TS mà không phải đoán giá trị thẩm mỹ — mọi màu/bóng/shape đã đóng gói thành token.

---

## 1. Nguyên tắc nhận diện (giữ đúng 4 điều này là ra "BibleQuiz")

1. **Ánh sáng xuyên kính** — nền sáng (gallery), card trắng, mỗi khối phát ra một quầng sáng/bóng *có màu* thay vì bóng xám. Bóng màu = nắng xuyên kính hắt xuống.
2. **Phổ khúc xạ** (`--bq-spectrum`: sapphire→emerald→amber→ruby) lặp lại ở: gạch chân tên, đỉnh card, thanh XP, bệ giếng trời, logo. Đây là chữ ký — đừng thay bằng gradient ngẫu nhiên.
3. **Ngọn đèn / ngọn lửa** — biểu tượng tiến trình. Streak, verse mark, và trạng thái nhiệm vụ đều là đèn (sáng/nhen/tắt), cùng họ màu ấm, **không dùng đỏ làm "đang làm"** (đỏ = lỗi trong UX).
4. **Vòm giếng trời** — câu Kinh Thánh nằm trong khối đỉnh bo vòm (`--bq-arch-well`), là focal point tĩnh lặng duy nhất. Mode card lặp lại vòm ở mức nhẹ (`--bq-arch-card`).

Quy tắc kỷ luật màu: **mỗi component chỉ một màu jewel chủ đạo**. Spectrum chỉ dùng cho các "đường/cạnh", không tô kín mảng lớn.

---

## 2. Bản đồ component

| Component | Vai trò | Token chính | Ghi chú |
|---|---|---|---|
| `AppShell` | layout + atmosphere | `.bq-lightwell` | bọc toàn trang, chứa godray + grain |
| `TopNav` | điều hướng + 3 stat | `--bq-ink` (active), jewel chips | stat: streak/năng lượng/điểm mùa |
| `HeroGreeting` | lời chào + tên + XP | `--bq-spectrum` (highlight tên) | tên có gạch phổ shimmer |
| `XpSpectrumBar` | tiến trình cấp | `--bq-spectrum` | ô đầy sáng dần theo phổ |
| `VersePane` | câu gốc hôm nay | `--bq-arch-well`, `--bq-flame` | giếng trời + ngọn lửa giữa |
| `DailyChallenge` | thử thách ưu tiên | `--bq-action`, `--bq-shadow-amb` | CTA gradient ấm + glow |
| `QuestList` / `QuestRow` | 3 nhiệm vụ | `--bq-quest-lit/warm/off` | đèn + bar, không màu đỏ |
| `Leaderboard` | top tuần | highlight row "me" bằng amber | |
| `ModeCard` | 3 chế độ chơi | `--bq-mode-*` + shadow tương ứng | variant→màu+bóng+vòm |

---

## 3. Component states & props (TypeScript)

### 3.1 `ModeCard` — biến thể qua 1 prop `variant`

```tsx
type ModeVariant = 'study' | 'ranked' | 'rooms';

const MODE: Record<ModeVariant, { accent: string; edge: string; shadow: string; shadowHover: string; tag: string; }> = {
  study:  { accent:'text-bq-sapphire', edge:'from-bq-sapphire to-[#6E86F0]', shadow:'shadow-bq-sap', shadowHover:'hover:shadow-bq-sap-h', tag:'HỌC MỘT MÌNH' },
  ranked: { accent:'text-bq-ruby',     edge:'from-bq-ruby to-[#FF7A5A]',     shadow:'shadow-bq-rub', shadowHover:'hover:shadow-bq-rub-h', tag:'THI ĐẤU' },
  rooms:  { accent:'text-bq-emerald',  edge:'from-bq-emerald to-[#46C89A]',  shadow:'shadow-bq-eme', shadowHover:'hover:shadow-bq-eme-h', tag:'CÙNG NHAU' },
};

interface ModeCardProps {
  variant: ModeVariant;
  title: string;            // "Luyện Tập"
  desc: string;
  href: string;
  cta: string;              // "Tiếp tục" | "Vào trận" | "Tìm phòng"
  children?: React.ReactNode; // inner panel (progress / live count)
}

export function ModeCard({ variant, title, desc, href, cta, children }: ModeCardProps) {
  const m = MODE[variant];
  return (
    <a href={href}
       className={`relative bg-bq-white border border-bq-hair p-6 min-h-[256px]
                   flex flex-col gap-2 overflow-hidden bq-arch-card
                   transition-transform duration-150 ease-bq hover:-translate-y-1.5
                   ${m.shadow} ${m.shadowHover}`}>
      <span className={`absolute inset-x-0 top-0 h-[5px] bg-gradient-to-r ${m.edge}`} />
      <span className={`text-eyebrow font-extrabold tracking-eyebrow mt-1 ${m.accent}`}>{m.tag}</span>
      <h4 className="font-display text-[23px] font-extrabold tracking-tight">{title}</h4>
      <p className="text-sm text-bq-ink2 leading-relaxed">{desc}</p>
      <div className="mt-auto border border-bq-hair bg-bq-paper rounded-2xl px-3.5 py-3 text-xs text-bq-ink2">
        {children}
      </div>
      <div className={`flex justify-between items-center mt-3.5 text-sm font-extrabold ${m.accent}`}>
        <span>{cta}</span><span aria-hidden>→</span>
      </div>
    </a>
  );
}
```

> Vòm `bq-arch-card` cần định nghĩa class trong CSS:
> `.bq-arch-card{ border-radius: var(--bq-arch-card); }`

### 3.2 `QuestRow` — đèn theo trạng thái (không dùng đỏ)

```tsx
type QuestStatus = 'done' | 'progress' | 'todo';

interface QuestRowProps {
  label: string;
  status: QuestStatus;
  value: number;   // ví dụ 1
  target: number;  // ví dụ 5
}

const LAMP: Record<QuestStatus,string> = {
  done:     'bg-bq-flame shadow-bq-flame border-transparent',
  progress: 'bg-[linear-gradient(180deg,#FFD98A,var(--bq-ember))] shadow-bq-flame border-transparent',
  todo:     'bg-bq-inset border-bq-hair',
};
const FILL: Record<QuestStatus,string> = {
  done:     'bg-gradient-to-r from-[#FFD773] to-bq-amber',
  progress: 'bg-gradient-to-r from-bq-amber to-bq-ember',
  todo:     'bg-transparent',
};

export function QuestRow({ label, status, value, target }: QuestRowProps) {
  const pct = status === 'done' ? 100 : Math.round((value / target) * 100);
  return (
    <div className="flex items-center gap-3.5 py-4 border-b border-bq-hair last:border-0">
      {/* đèn: hình giọt lửa */}
      <span aria-hidden
        className={`w-2.5 h-[13px] shrink-0 border rounded-[50%_50%_50%_50%/60%_60%_40%_40%] ${LAMP[status]}`} />
      <span className={`flex-1 text-sm font-semibold ${status==='done' ? 'text-bq-ink2' : 'text-bq-ink'}`}>{label}</span>
      <span className="w-[150px] h-[7px] bg-bq-inset rounded-full overflow-hidden">
        <span className={`block h-full rounded-full ${FILL[status]}`} style={{ width:`${pct}%` }} />
      </span>
      <span className="w-9 text-right text-xs font-extrabold text-bq-ink2 tabular-nums">
        {status==='done' ? '✓' : `${value}/${target}`}
      </span>
    </div>
  );
}
```

**Accessibility:** trạng thái được mã hoá bằng 3 tín hiệu (đèn + nhãn chữ + bar), không chỉ màu → an toàn cho người mù màu. Thêm `aria-label` dạng `"${label}: ${value}/${target}"` nếu cần screen-reader.

### 3.3 `XpSpectrumBar` — ô đầy sáng dần theo phổ

```tsx
interface XpBarProps { value: number; max: number; segments?: number; } // segments mặc định 10

export function XpSpectrumBar({ value, max, segments = 10 }: XpBarProps) {
  const filled = (value / max) * segments;            // vd 3.18
  const full = Math.floor(filled);
  const partial = filled - full;                       // ô đang nhen
  // mỗi ô đầy lấy 1 lát của spectrum → background-position dịch dần
  return (
    <div className="flex gap-[5px]">
      {Array.from({ length: segments }).map((_, i) => {
        if (i < full)
          return <span key={i} className="flex-1 h-[13px] rounded bg-bq-spectrum"
                       style={{ backgroundSize:`${segments*52}% 100%`, backgroundPosition:`${(i/(segments-1))*100}% 50%` }} />;
        if (i === full)
          return <span key={i} className="flex-1 h-[13px] rounded bg-bq-inset border border-bq-hair relative overflow-hidden">
                   <span className="absolute inset-0 bg-bq-amber" style={{ width:`${partial*100}%` }} />
                 </span>;
        return <span key={i} className="flex-1 h-[13px] rounded bg-bq-inset border border-bq-hair" />;
      })}
    </div>
  );
}
```

### 3.4 `VersePane` — giếng trời + ngọn lửa (đã bỏ drop-cap)

```tsx
interface VersePaneProps { text: React.ReactNode; ref_: string; } // text có <em> bọc từ khoá

export function VersePane({ text, ref_ }: VersePaneProps) {
  return (
    <>
      <section className="relative mx-auto max-w-[740px] px-[54px] pt-[46px] pb-9 text-center
                          border border-bq-hair border-b-0 bq-arch-well
                          bg-[radial-gradient(120%_80%_at_50%_4%,rgba(255,236,190,.85),#fff_62%)]
                          shadow-bq-amb">
        <div className="text-eyebrow font-extrabold tracking-eyebrow text-bq-amberd mb-[18px]">CÂU GỐC HÔM NAY</div>
        {/* ngọn lửa giữa — thay cho drop cap */}
        <div className="flex justify-center mb-4" aria-hidden>
          <span className="w-[15px] h-[21px] rounded-[50%_50%_50%_50%/62%_62%_38%_38%] bg-bq-flame shadow-bq-flame animate-flick" />
        </div>
        <p className="font-verse text-verse leading-[1.5] text-bq-ink">{text}</p>
        <div className="mt-4 text-eyebrow font-extrabold tracking-eyebrow text-bq-ink3">{ref_}</div>
      </section>
      {/* bệ cửa sổ: phổ sáng đổ bóng màu xuống trang */}
      <div className="max-w-[740px] mx-auto h-3.5 rounded-b-xl bg-bq-spectrum
                      shadow-[0_26px_50px_-22px_rgba(45,70,200,.35),0_26px_50px_-22px_rgba(224,53,75,.3)]" />
    </>
  );
}
// dùng: <VersePane ref_="THI THIÊN 119 : 105"
//   text={<>“Lời Chúa là <em className="italic text-bq-amberd not-italic">ngọn đèn</em> cho chân tôi, ánh sáng cho đường lối tôi.”</>} />
```

### 3.5 `DailyChallenge` CTA — nút sặc gradient ấm

```tsx
<button className="inline-flex items-center gap-2.5 font-extrabold text-[14.5px] text-white
                   bg-bq-action px-[27px] py-[15px] rounded-[14px] shadow-bq-action
                   transition ease-bq hover:-translate-y-0.5 hover:brightness-105">
  Chơi ngay
  <span className="bg-white/25 text-xs font-extrabold px-2 py-0.5 rounded-md">+50 XP</span>
</button>
```

---

## 4. Data → UI (gợi ý kiểu dữ liệu từ API Spring Boot)

```ts
interface HomeData {
  user: { name: string; level: number; rank: string; nextRank: string;
          xp: number; xpMax: number; weeklyRank: number; weeklyTotal: number;
          streak: number; energy: number; seasonPoints: number; };
  verse: { text: string; keyword: string; ref: string; };   // keyword để render <em>
  daily: { title: string; questions: number; minutes: number; xp: number; endsAt: string; done: boolean; };
  quests: { label: string; value: number; target: number; }[];   // status suy ra: value>=target→done, >0→progress, else todo
  modes: { study: {...}; ranked: { live: number }; rooms: { openRooms: number; players: number; myChurchRooms: number } };
  leaderboard: { rank: number; name: string; points: number; me: boolean }[];
}
```

Quy tắc suy `status` cho quest (đặt ở selector/util, không nhúng trong JSX):
```ts
const statusOf = (v:number,t:number): QuestStatus => v>=t ? 'done' : v>0 ? 'progress' : 'todo';
```

---

## 5. Tích hợp (các bước)

1. Thêm 3 font vào `index.html` (Bricolage Grotesque, Be Vietnam Pro, Literata) hoặc `@fontsource`.
2. `import './styles/tokens.css'` ở `main.tsx`.
3. Thêm 2 class shape vào `tokens.css`:
   ```css
   .bq-arch-card{ border-radius: var(--bq-arch-card); }
   .bq-arch-well{ border-radius: var(--bq-arch-well); }
   ```
4. Merge `theme.extend` từ `biblequiz-tailwind.config.js` vào config hiện có.
5. Bọc trang chủ bằng `<div className="bq-lightwell"> … </div>` (godray + grain).
6. Dựng component theo §3, đổ data theo §4.

---

## 6. Hướng mở rộng (không bắt buộc, để dành phase sau)

- **Season theming:** set `data-season` trên `<body>` → override jewel/spectrum trong `tokens.css`. Toàn UI đổi tông theo mùa Hội thánh mà không sửa 1 dòng component.
- **Time-of-day breathing:** thêm tầng biến `--bq-paper`/godray theo giờ thiết bị (sáng ấm → tối trầm). Tách riêng vì cần test kỹ ngoài nắng.
- **Reduced-motion:** đã chặn global trong `tokens.css`; mọi `animate-*` tự tắt.

---

## 7. Checklist QA trước khi ship

- [ ] Contrast chữ phụ (`--bq-ink-faint`) đạt ≥ 4.5:1 trên nền card/paper.
- [ ] Nút CTA có `:focus-visible` rõ (outline 2px offset) — đừng chỉ dựa hover.
- [ ] Quest đọc được khi giả lập mù màu (đã có đèn + bar + số).
- [ ] Mode card responsive: 3 cột → 1 cột < 980px; vòm `bq-arch-card` không vỡ khi hẹp.
- [ ] Giếng trời verse trên mobile dọc: giảm padding + `--bq-fs-verse` xuống 21px (đã có media query mẫu trong file HTML).
- [ ] Grain/godray là `position:fixed; z-index:0; pointer-events:none` — không chặn click.
