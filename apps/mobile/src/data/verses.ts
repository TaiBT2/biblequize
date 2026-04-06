export interface DailyVerse {
  text: string
  ref: string
}

export const DAILY_VERSES: DailyVerse[] = [
  { text: "Lời Chúa là ngọn đèn cho chân tôi, ánh sáng cho đường lối tôi.", ref: "Thi Thiên 119:105" },
  { text: "Hãy hết lòng tin cậy Đức Giê-hô-va, chớ nương cậy nơi sự thông sáng của con.", ref: "Châm Ngôn 3:5" },
  { text: "Vì Đức Chúa Trời yêu thương thế gian, đến nỗi đã ban Con một của Ngài.", ref: "Giăng 3:16" },
  { text: "Ta là đường đi, lẽ thật, và sự sống. Chẳng bởi ta thì không ai được đến cùng Cha.", ref: "Giăng 14:6" },
  { text: "Hãy tìm kiếm nước Đức Chúa Trời và sự công bình của Ngài trước hết.", ref: "Ma-thi-ơ 6:33" },
  { text: "Đức Giê-hô-va là Đấng chăn giữ tôi; tôi sẽ chẳng thiếu thốn gì.", ref: "Thi Thiên 23:1" },
  { text: "Mọi sự hiệp lại làm ích cho kẻ yêu mến Đức Chúa Trời.", ref: "Rô-ma 8:28" },
  { text: "Hãy vui mừng trong Chúa luôn luôn. Tôi lại còn nói nữa: hãy vui mừng đi.", ref: "Phi-líp 4:4" },
  { text: "Sự kính sợ Đức Giê-hô-va là khởi đầu sự khôn ngoan.", ref: "Châm Ngôn 9:10" },
  { text: "Ta đã chiến thắng thế gian.", ref: "Giăng 16:33" },
  { text: "Hãy trao mọi điều lo lắng mình cho Ngài, vì Ngài hay săn sóc anh em.", ref: "1 Phi-e-rơ 5:7" },
  { text: "Đức Chúa Trời là nơi nương náu và sức lực của chúng tôi, Ngài sẵn giúp đỡ trong cơn gian truân.", ref: "Thi Thiên 46:1" },
  { text: "Hãy nếm thử xem Đức Giê-hô-va tốt lành dường bao!", ref: "Thi Thiên 34:8" },
  { text: "Ta sẽ không bao giờ lìa ngươi, không bao giờ bỏ ngươi đâu.", ref: "Hê-bơ-rơ 13:5" },
  { text: "Vì chính ta biết ý định ta định cho các ngươi, là ý định bình an, không phải tai họa.", ref: "Giê-rê-mi 29:11" },
  { text: "Phàm việc gì các ngươi làm, hãy hết lòng mà làm, như làm cho Chúa.", ref: "Cô-lô-se 3:23" },
  { text: "Nhưng ai trông đợi Đức Giê-hô-va sẽ được sức mới, cất cánh bay cao như chim ưng.", ref: "Ê-sai 40:31" },
  { text: "Đức Giê-hô-va phán: Hãy yên lặng và biết rằng ta là Đức Chúa Trời.", ref: "Thi Thiên 46:10" },
  { text: "Ân điển ta đủ cho ngươi rồi, vì sức mạnh ta nên trọn vẹn trong sự yếu đuối.", ref: "2 Cô-rinh-tô 12:9" },
  { text: "Vì đức tin là sự biết chắc vững vàng của những điều mình đang trông mong.", ref: "Hê-bơ-rơ 11:1" },
  { text: "Hãy làm mọi việc mà đừng lằm bằm và tranh luận.", ref: "Phi-líp 2:14" },
  { text: "Chúa ở gần mọi người kêu cầu Ngài, tức mọi người thành tâm cầu khẩn Ngài.", ref: "Thi Thiên 145:18" },
  { text: "Hãy cứ ở trong ta, thì ta sẽ ở trong các ngươi.", ref: "Giăng 15:4" },
  { text: "Vì tiền công của tội lỗi là sự chết, nhưng sự ban cho của Đức Chúa Trời là sự sống đời đời.", ref: "Rô-ma 6:23" },
  { text: "Hãy giữ lòng con hơn mọi vật phải giữ, vì các nguồn sự sống do nơi nó mà ra.", ref: "Châm Ngôn 4:23" },
  { text: "Đức Chúa Trời chúng ta là nơi ẩn náu và sức lực.", ref: "Thi Thiên 46:1" },
  { text: "Bông huệ ngoài đồng mọc lên thể nào: chẳng làm lụng, chẳng kéo chỉ.", ref: "Ma-thi-ơ 6:28" },
  { text: "Hãy giao phó đường lối mình cho Đức Giê-hô-va và nhờ cậy nơi Ngài.", ref: "Thi Thiên 37:5" },
  { text: "Đức Chúa Trời đã chẳng ban Con một của Ngài cho chúng ta sao?", ref: "Rô-ma 8:32" },
  { text: "Hãy vui vẻ trong sự trông cậy, nhịn nhục trong sự hoạn nạn, bền lòng mà cầu nguyện.", ref: "Rô-ma 12:12" },
]

export function getDailyVerse(): DailyVerse {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 0))
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length]
}
