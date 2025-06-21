'use client';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id?: string;
  user_name?: string;
}

type CommentSectionProps = {
  comments: Comment[];
};

export function CommentSection({ comments }: CommentSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Comments</h2>
      {comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        <ul>
          {comments.map((c) => (
            <li key={c.id}>{c.content}</li>
          ))}
        </ul>
      )}
      {/* Add your comment form here */}
    </div>
  );
} 