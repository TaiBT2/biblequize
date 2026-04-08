import { useState, useEffect } from 'react'

interface StarPopupProps {
  starIndex: number
  bonusXp: number
  onDismiss: () => void
}

export default function StarPopup({ starIndex, bonusXp, onDismiss }: StarPopupProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300) // wait for fade out
    }, 2500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } bg-gradient-to-r from-amber-500 to-yellow-400 text-black`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">⭐</span>
        <div>
          <p className="font-black text-sm">Sao mới! +{bonusXp} XP</p>
          <p className="text-xs opacity-80">Sao {starIndex + 1}/5</p>
        </div>
      </div>
    </div>
  )
}
