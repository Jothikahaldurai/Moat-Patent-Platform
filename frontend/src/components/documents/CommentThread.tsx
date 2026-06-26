import React, { useState } from "react";
import { Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommentThread({ comments, onAddComment }: { comments: any[], onAddComment: (text: string) => void }) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(text);
    setText("");
  };

  return (
    <div className="flex flex-col gap-4 border rounded-lg p-4 bg-white">
      <h3 className="font-semibold text-lg">Review Notes & Comments</h3>
      
      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
        {comments && comments.length > 0 ? (
          comments.map((c, i) => (
            <div key={c.id || i} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-full h-fit">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{c.role || "User"}</span>
                  <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{c.comment_text}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No comments yet. Start the discussion.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <Textarea 
          placeholder="Add a comment or review note..." 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[80px]"
        />
        <Button type="submit" className="self-end" disabled={!text.trim()}>
          <Send className="w-4 h-4 mr-2" /> Send
        </Button>
      </form>
    </div>
  );
}
