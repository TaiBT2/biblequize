import { useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface RoomPlayerInfo {
  id: string;
  username: string;
  avatarUrl?: string;
  isReady: boolean;
  score: number;
}

export interface RoomDetails {
  id: string;
  roomCode: string;
  roomName: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'ENDED' | 'CANCELLED';
  maxPlayers: number;
  currentPlayers: number;
  questionCount: number;
  timePerQuestion: number;
  hostId: string;
  hostName: string;
  players: RoomPlayerInfo[];
}

export interface PlayerJoinedData {
  playerId: string;
  username: string;
  avatarUrl?: string;
  playerInfo: RoomPlayerInfo;
}

export interface PlayerReadyData {
  playerId: string;
  username: string;
  isReady: boolean;
}

export interface QuestionStartData {
  questionIndex: number;
  totalQuestions: number;
  question: any;
  timeLimit: number;
}

export interface AnswerSubmittedData {
  playerId: string;
  username: string;
  questionIndex: number;
  answerIndex: number;
  reactionTimeMs: number;
}

export interface ScoreUpdateData {
  playerId: string;
  username: string;
  newScore: number;
  correctAnswers: number;
  totalAnswered: number;
}

export interface LeaderboardEntry {
  playerId: string;
  username: string;
  avatarUrl?: string;
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  accuracy: number;
}

export interface ErrorData {
  error: string;
  message: string;
}

// Message Types
export const MESSAGE_TYPES = {
  PLAYER_JOINED: 'PLAYER_JOINED',
  PLAYER_LEFT: 'PLAYER_LEFT',
  PLAYER_READY: 'PLAYER_READY',
  PLAYER_UNREADY: 'PLAYER_UNREADY',
  ROOM_STARTING: 'ROOM_STARTING',
  ROOM_ENDED: 'ROOM_ENDED',
  QUESTION_START: 'QUESTION_START',
  ANSWER_SUBMITTED: 'ANSWER_SUBMITTED',
  QUESTION_END: 'QUESTION_END',
  QUIZ_END: 'QUIZ_END',
  SCORE_UPDATE: 'SCORE_UPDATE',
  LEADERBOARD_UPDATE: 'LEADERBOARD_UPDATE',
  ERROR: 'ERROR'
};

export interface UseWebSocketProps {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onPlayerJoined?: (data: PlayerJoinedData) => void;
  onPlayerLeft?: (data: any) => void;
  onPlayerReady?: (data: PlayerReadyData) => void;
  onRoomStarting?: (data: any) => void;
  onQuestionStart?: (data: QuestionStartData) => void;
  onAnswerSubmitted?: (data: AnswerSubmittedData) => void;
  onQuizEnd?: (data: any) => void;
  onScoreUpdate?: (data: ScoreUpdateData) => void;
  onLeaderboardUpdate?: (data: LeaderboardEntry[]) => void;
  onError?: (data: ErrorData) => void;
}

export const useWebSocket = ({
  url,
  onMessage,
  onPlayerJoined,
  onPlayerLeft,
  onPlayerReady,
  onRoomStarting,
  onQuestionStart,
  onAnswerSubmitted,
  onQuizEnd,
  onScoreUpdate,
  onLeaderboardUpdate,
  onError
}: UseWebSocketProps) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const wsUrl = url.startsWith('ws') ? url : `ws://localhost:8081${url}`;
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log('[WebSocket] Connected to:', wsUrl);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      newSocket.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[WebSocket] Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      newSocket.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');
      };

      newSocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] Received message:', message);

          // Call general message handler
          onMessage?.(message);

          // Call specific handlers based on message type
          switch (message.type) {
            case MESSAGE_TYPES.PLAYER_JOINED:
              onPlayerJoined?.(message.data);
              break;
            case MESSAGE_TYPES.PLAYER_LEFT:
              onPlayerLeft?.(message.data);
              break;
            case MESSAGE_TYPES.PLAYER_READY:
              onPlayerReady?.(message.data);
              break;
            case MESSAGE_TYPES.PLAYER_UNREADY:
              onPlayerReady?.(message.data);
              break;
            case MESSAGE_TYPES.ROOM_STARTING:
              onRoomStarting?.(message.data);
              break;
            case MESSAGE_TYPES.QUESTION_START:
              onQuestionStart?.(message.data);
              break;
            case MESSAGE_TYPES.ANSWER_SUBMITTED:
              onAnswerSubmitted?.(message.data);
              break;
            case MESSAGE_TYPES.QUIZ_END:
              onQuizEnd?.(message.data);
              break;
            case MESSAGE_TYPES.SCORE_UPDATE:
              onScoreUpdate?.(message.data);
              break;
            case MESSAGE_TYPES.LEADERBOARD_UPDATE:
              onLeaderboardUpdate?.(message.data);
              break;
            case MESSAGE_TYPES.ERROR:
              onError?.(message.data);
              break;
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', event.data, err);
        }
      };

      setSocket(newSocket);

    } catch (err) {
      console.error('[WebSocket] Failed to connect:', err);
      setError('Failed to connect to WebSocket');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socket) {
      socket.close(1000, 'Manual disconnect');
      setSocket(null);
    }
    setIsConnected(false);
  };

  const sendMessage = (type: string, data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: String(Date.now())
      };
      console.log('[WebSocket] Sending message:', message);
      socket.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message: socket not connected');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    error,
    connect,
    disconnect,
    sendMessage
  };
};
