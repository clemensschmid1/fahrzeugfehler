'use client';

type CommentSectionProps = {
  questionId: string;
  comments: any[];
  onCommentsChange: (comments: any[]) => void;
};

export function CommentSection({ questionId, comments, onCommentsChange }: CommentSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Comments</h2>
      {comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        <ul>
          {comments.map((c, i) => (
            <li key={i}>{c.content || JSON.stringify(c)}</li>
          ))}
        </ul>
      )}
      {/* Add your comment form here */}
    </div>
  );
} 