import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useStomp } from '../hooks/useStomp';

type Player = { id: string; username: string; avatarUrl?: string; isReady: boolean; score: number };
type RoomDetails = {
  id: string; roomCode: string; roomName: string; status: 'LOBBY'|'IN_PROGRESS'|'ENDED'|'CANCELLED';
  maxPlayers: number; currentPlayers: number; questionCount: number; timePerQuestion: number;
  hostId: string; hostName: string; players: Player[];
};

const RoomLobby: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialRoom: RoomDetails | undefined = location.state?.room;
  const [room, setRoom] = useState<RoomDetails | null>(initialRoom ?? null);
  const [error, setError] = useState<string | null>(null);

  const { connected, send } = useStomp({
    roomId: roomId,
    onMessage: (msg) => {
      switch (msg.type) {
        case 'PLAYER_JOINED':
        case 'PLAYER_LEFT':
        case 'PLAYER_READY':
        case 'PLAYER_UNREADY':
        case 'LEADERBOARD_UPDATE':
        case 'ROOM_STARTING':
        case 'QUESTION_START':
        case 'QUIZ_END':
          // Re-fetch room to sync
          fetchRoom();
          break;
      }
    }
  });

  const fetchRoom = async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await res.json();
      if (data.success) setRoom(data.room);
      else setError(data.message || 'Không lấy được thông tin phòng');
    } catch (e) {
      setError('Lỗi mạng khi tải thông tin phòng');
    }
  };

  useEffect(() => { if (!room) fetchRoom(); }, []);

  const handleToggleReady = () => {
    if (!roomId) return;
    send(`/app/room/${roomId}/ready`, {});
  };

  const handleStart = () => {
    if (!roomId) return;
    // Host triggers REST start for validation
    fetch(`/api/rooms/${roomId}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
    }).then(async (res) => {
      try { await fetchRoom(); } catch {}
      // Điều hướng sang màn quiz ngay sau khi bắt đầu
      navigate(`/room/${roomId}/quiz`, { replace: true });
    });
    // And broadcast start intent
    send(`/app/room/${roomId}/start`, {});
  };

  const readyCount = useMemo(() => room?.players.filter(p => p.isReady).length ?? 0, [room]);

  if (error) {
    return (
      <div className="p-6 text-red-400">{error}</div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">Đang tải phòng...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold neon-text">🔒 Phòng: {room.roomName}</h1>
          <div className="text-sm text-purple-300">Mã: <span className="font-mono">{room.roomCode}</span></div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-black/40 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-purple-200">Người chơi ({room.currentPlayers}/{room.maxPlayers})</div>
              <div className="text-purple-200">Sẵn sàng: {readyCount}/{room.currentPlayers}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {room.players.map(p => (
                <div key={p.id} className={`p-3 rounded-lg border ${p.isReady ? 'border-green-500/60' : 'border-purple-500/30'} bg-black/30 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-800/40 border border-purple-500/40 flex items-center justify-center">
                      <span className="text-lg">{p.username?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{p.username}</div>
                      <div className="text-xs text-gray-400">Điểm: {p.score}</div>
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${p.isReady ? 'bg-green-600/40 text-green-200' : 'bg-gray-600/40 text-gray-300'}`}>{p.isReady ? 'READY' : 'WAIT'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/40 border border-purple-500/30 rounded-xl p-4">
            <div className="space-y-2 text-sm text-purple-200">
              <div>Tổng câu: <b className="text-white">{room.questionCount}</b></div>
              <div>Thời gian/câu: <b className="text-white">{room.timePerQuestion}s</b></div>
              <div>Chủ phòng: <b className="text-white">{room.hostName}</b></div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={handleToggleReady} className="flex-1 py-2 rounded bg-purple-600 hover:bg-purple-500 transition text-white">{room.players.some(p => p.isReady) ? 'Đổi trạng thái' : 'Sẵn sàng'}</button>
              <button onClick={handleStart} disabled={room.status!=='LOBBY'} className="flex-1 py-2 rounded bg-green-600 hover:bg-green-500 transition text-white disabled:opacity-50">Bắt đầu</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomLobby;


