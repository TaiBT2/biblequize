import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function PrivacyPolicy() {
  const { t, i18n } = useTranslation()
  const isVi = i18n.language === 'vi'

  return (
    <div className="min-h-screen bg-[#11131e] text-on-surface">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="text-secondary text-sm hover:underline mb-6 inline-block">
          &larr; {t('common.back')}
        </Link>

        <h1 className="text-2xl font-bold text-on-surface mb-2">
          {isVi ? 'Chính sách Bảo mật' : 'Privacy Policy'}
        </h1>
        <p className="text-sm text-on-surface-variant mb-8">
          {isVi ? 'Cập nhật lần cuối: 07/04/2026' : 'Last updated: April 7, 2026'}
        </p>

        <div className="space-y-8 text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              {isVi ? '1. Thông tin chúng tôi thu thập' : '1. Information We Collect'}
            </h2>
            <p>{isVi ? 'Khi bạn sử dụng BibleQuiz, chúng tôi thu thập:' : 'When you use BibleQuiz, we collect:'}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{isVi ? 'Thông tin tài khoản: email, tên, ảnh đại diện (từ Google Sign-In)' : 'Account info: email, name, avatar (from Google Sign-In)'}</li>
              <li>{isVi ? 'Dữ liệu quiz: điểm số, câu trả lời, streak, tier, thành tích' : 'Quiz data: scores, answers, streak, tier, achievements'}</li>
              <li>{isVi ? 'Dữ liệu nhóm: nhóm hội thánh bạn tham gia, vai trò trong nhóm' : 'Group data: church groups you join, your role'}</li>
              <li>{isVi ? 'Dữ liệu thiết bị: loại thiết bị, hệ điều hành (cho push notification)' : 'Device data: device type, OS (for push notifications)'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              {isVi ? '2. Cách chúng tôi sử dụng thông tin' : '2. How We Use Information'}
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isVi ? 'Cung cấp và cải thiện dịch vụ BibleQuiz' : 'Provide and improve BibleQuiz services'}</li>
              <li>{isVi ? 'Hiển thị bảng xếp hạng, thành tích, và tiến trình' : 'Display leaderboards, achievements, and progress'}</li>
              <li>{isVi ? 'Gửi thông báo (nếu bạn cho phép): streak, daily challenge, nhóm' : 'Send notifications (if permitted): streak, daily challenge, groups'}</li>
              <li>{isVi ? 'Phân tích ẩn danh để cải thiện app' : 'Anonymous analytics to improve the app'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              {isVi ? '3. Chia sẻ thông tin' : '3. Information Sharing'}
            </h2>
            <p>{isVi ? 'Chúng tôi KHÔNG bán hoặc chia sẻ thông tin cá nhân với bên thứ ba, ngoại trừ:' : 'We do NOT sell or share personal information with third parties, except:'}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{isVi ? 'Bảng xếp hạng: tên và điểm hiển thị cho người dùng khác trong app' : 'Leaderboards: name and score visible to other users in the app'}</li>
              <li>{isVi ? 'Nhóm: thành viên cùng nhóm thấy tên và điểm của bạn' : 'Groups: group members can see your name and score'}</li>
              <li>{isVi ? 'Yêu cầu pháp luật: khi có yêu cầu từ cơ quan pháp luật' : 'Legal requirements: when required by law enforcement'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              {isVi ? '4. Lưu trữ dữ liệu' : '4. Data Storage'}
            </h2>
            <p>{isVi
              ? 'Dữ liệu được lưu trữ trên Amazon Web Services (AWS) tại khu vực Asia Pacific. Chúng tôi sử dụng mã hóa và biện pháp bảo mật phù hợp để bảo vệ dữ liệu của bạn.'
              : 'Data is stored on Amazon Web Services (AWS) in the Asia Pacific region. We use encryption and appropriate security measures to protect your data.'
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              {isVi ? '5. Quyền của bạn' : '5. Your Rights'}
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isVi ? 'Xem dữ liệu: xem thông tin cá nhân trong trang Profile' : 'View data: see personal info in your Profile'}</li>
              <li>{isVi ? 'Sửa dữ liệu: cập nhật tên, ảnh đại diện trong Profile' : 'Edit data: update name, avatar in Profile'}</li>
              <li>{isVi ? 'Xóa dữ liệu: xóa tài khoản và toàn bộ dữ liệu trong Profile' : 'Delete data: delete account and all data in Profile'}</li>
              <li>{isVi ? 'Rút consent: tắt thông báo, rời nhóm bất kỳ lúc nào' : 'Withdraw consent: disable notifications, leave groups at any time'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              {isVi ? '6. Trẻ em' : '6. Children'}
            </h2>
            <p>{isVi
              ? 'BibleQuiz dành cho mọi lứa tuổi. Chúng tôi không cố ý thu thập thông tin của trẻ dưới 13 tuổi mà không có sự đồng ý của phụ huynh. Nếu phát hiện, chúng tôi sẽ xóa dữ liệu đó.'
              : 'BibleQuiz is for all ages. We do not intentionally collect information from children under 13 without parental consent. If discovered, we will delete that data.'
            }</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              {isVi ? '7. Liên hệ' : '7. Contact'}
            </h2>
            <p>{isVi
              ? 'Nếu có câu hỏi về chính sách bảo mật, vui lòng liên hệ: privacy@biblequiz.app'
              : 'For privacy policy questions, please contact: privacy@biblequiz.app'
            }</p>
          </section>
        </div>
      </div>
    </div>
  )
}
