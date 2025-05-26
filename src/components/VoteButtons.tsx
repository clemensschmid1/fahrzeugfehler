'use client';

type VoteButtonsProps = {
  votes: { up: number; down: number };
  userVote: 'up' | 'down' | null;
  onVote: (voteType: 'up' | 'down') => void;
  isLoading: boolean;
};

export function VoteButtons({ votes, userVote, onVote, isLoading }: VoteButtonsProps) {
  return (
    <div className="flex gap-4 mb-4">
      <button
        disabled={isLoading}
        className={`px-3 py-1 rounded ${userVote === 'up' ? 'bg-green-200' : 'bg-gray-200'}`}
        onClick={() => onVote('up')}
      >
        👍 {votes.up}
      </button>
      <button
        disabled={isLoading}
        className={`px-3 py-1 rounded ${userVote === 'down' ? 'bg-red-200' : 'bg-gray-200'}`}
        onClick={() => onVote('down')}
      >
        👎 {votes.down}
      </button>
    </div>
  );
} 