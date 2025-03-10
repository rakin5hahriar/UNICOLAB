import React, { useState } from 'react';
import { useCollaboration } from '../contexts/CollaborationContext';

const Comment = ({ comment }) => {
    const formattedTime = new Date(comment.timestamp).toLocaleTimeString();

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">{comment.username}</span>
                <span className="text-sm text-gray-500">{formattedTime}</span>
            </div>
            <p className="text-gray-600">{comment.content}</p>
        </div>
    );
};

const CommentSection = ({ workspaceId, userId, username }) => {
    const { comments, addComment } = useCollaboration();
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        addComment(workspaceId, {
            content: newComment,
            userId,
            username,
            timestamp: new Date()
        }, userId);

        setNewComment('');
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Comments</h3>
            
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {comments.map((comment, index) => (
                    <Comment key={index} comment={comment} />
                ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
                <div className="flex items-start space-x-4">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CommentSection; 