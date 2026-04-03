import { Link, useNavigate } from 'react-router-dom'
import PageMeta from '../components/PageMeta'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden px-4">
      <PageMeta title="Trang khong tim thay" />
      {/* Decorative blur circles */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Large 404 */}
        <h1 className="text-[8rem] sm:text-[10rem] font-black leading-none tracking-tighter text-secondary select-none">
          404
        </h1>

        {/* Icon */}
        <span className="material-symbols-outlined text-6xl text-on-surface-variant -mt-4 mb-6">
          explore_off
        </span>

        {/* Message */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface mb-3">
          Trang Không Tìm Thấy
        </h2>
        <p className="text-on-surface-variant font-medium leading-relaxed mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/"
            className="gold-gradient text-on-secondary font-bold px-8 py-3 rounded-xl shadow-secondary/20 shadow-lg hover:shadow-secondary/30 transition-all duration-200"
          >
            Về Trang Chủ
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="text-on-surface-variant hover:text-on-surface font-medium px-6 py-3 rounded-xl transition-colors duration-200"
          >
            Quay Lại
          </button>
        </div>

        {/* Bible verse */}
        <p className="mt-16 text-sm text-on-surface-variant/50 italic leading-relaxed">
          "Hãy tìm kiếm, các ngươi sẽ gặp" — Ma-thi-ơ 7:7
        </p>
      </div>
    </div>
  )
}
