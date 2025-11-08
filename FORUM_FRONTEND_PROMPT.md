# Forum Module - Frontend Implementation Guide

## Overview
Implement a Reddit-style forum system with threads, comments, voting/karma, and admin moderation features. The backend API is complete and ready for integration.

---

## API Base URL
All endpoints are prefixed with: `/api/v1/forum`

---

## Authentication
- Most endpoints require authentication (JWT token in cookies or Authorization header)
- Public endpoints: `GET /threads`, `GET /thread/:id`
- Admin endpoints require `user_type === "admin"`

---

## API Endpoints Reference

### 📝 Threads

#### 1. List Threads (Public)
```http
GET /api/v1/forum/threads
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20, max: 100)
  - tags: string[] (comma-separated or array)
  - status: "open" | "locked"
  - sortBy: "newest" | "popular" | "trending" (default: "newest")

Response: {
  statusCode: 200,
  success: true,
  message: "Threads retrieved successfully",
  data: {
    threads: [
      {
        _id: string,
        title: string,
        content: string,
        authorId: {
          _id: string,
          name: string,
          email: string,
          user_type: string,
          karma: number
        },
        tags: string[],
        votes: {
          upvotes: number,
          downvotes: number
        },
        netVotes: number, // virtual field
        status: "open" | "locked",
        isPinned: boolean,
        commentCount: number, // virtual field
        createdAt: string,
        updatedAt: string
      }
    ],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

#### 2. Get Single Thread (Public)
```http
GET /api/v1/forum/thread/:id

Response: {
  statusCode: 200,
  success: true,
  message: "Thread retrieved successfully",
  data: {
    _id: string,
    title: string,
    content: string,
    authorId: {
      _id: string,
      name: string,
      email: string,
      user_type: string,
      karma: number
    },
    tags: string[],
    votes: {
      upvotes: number,
      downvotes: number
    },
    netVotes: number,
    status: "open" | "locked",
    isPinned: boolean,
    commentCount: number,
    comments: [
      {
        _id: string,
        threadId: string,
        content: string,
        authorId: {
          _id: string,
          name: string,
          email: string,
          user_type: string,
          karma: number
        },
        votes: {
          upvotes: number,
          downvotes: number
        },
        netVotes: number,
        createdAt: string,
        updatedAt: string
      }
    ],
    createdAt: string,
    updatedAt: string
  }
}
```

#### 3. Create Thread (Auth Required)
```http
POST /api/v1/forum/thread
Headers: {
  Authorization: "Bearer <token>" // or cookie
  Content-Type: "application/json"
}
Body: {
  title: string (3-200 chars),
  content: string (10-10000 chars),
  tags: string[] (max 10, optional)
}

Response: {
  statusCode: 201,
  success: true,
  message: "Thread created successfully",
  data: { /* thread object */ }
}
```

#### 4. Update Thread (Auth Required - Author or Admin)
```http
PUT /api/v1/forum/thread/:id
Body: {
  title?: string (3-200 chars),
  content?: string (10-10000 chars),
  tags?: string[] (max 10)
}

Response: {
  statusCode: 200,
  success: true,
  message: "Thread updated successfully",
  data: { /* updated thread object */ }
}
```

#### 5. Delete Thread (Auth Required - Author or Admin)
```http
DELETE /api/v1/forum/thread/:id

Response: {
  statusCode: 200,
  success: true,
  message: "Thread deleted successfully",
  data: null
}
```

#### 6. Lock/Unlock Thread (Admin Only)
```http
POST /api/v1/forum/thread/:id/lock

Response: {
  statusCode: 200,
  success: true,
  message: "Thread status updated successfully",
  data: { /* updated thread object */ }
}
```

#### 7. Pin/Unpin Thread (Admin Only)
```http
POST /api/v1/forum/thread/:id/pin

Response: {
  statusCode: 200,
  success: true,
  message: "Thread pin status updated successfully",
  data: { /* updated thread object */ }
}
```

---

### 💬 Comments

#### 8. Create Comment (Auth Required)
```http
POST /api/v1/forum/comment
Body: {
  threadId: string (ObjectId),
  content: string (1-5000 chars)
}

Response: {
  statusCode: 201,
  success: true,
  message: "Comment created successfully",
  data: { /* comment object */ }
}
```

#### 9. Update Comment (Auth Required - Author or Admin)
```http
PUT /api/v1/forum/comment/:id
Body: {
  content: string (1-5000 chars)
}

Response: {
  statusCode: 200,
  success: true,
  message: "Comment updated successfully",
  data: { /* updated comment object */ }
}
```

#### 10. Delete Comment (Auth Required - Author or Admin)
```http
DELETE /api/v1/forum/comment/:id

Response: {
  statusCode: 200,
  success: true,
  message: "Comment deleted successfully",
  data: null
}
```

---

### ⬆️ Voting

#### 11. Vote on Thread/Comment (Auth Required)
```http
POST /api/v1/forum/vote
Body: {
  targetId: string (ObjectId),
  targetType: "thread" | "comment",
  type: "upvote" | "downvote"
}

Response: {
  statusCode: 200,
  success: true,
  message: "Vote processed successfully",
  data: {
    action: "added" | "removed" | "changed",
    vote: { /* vote object or null */ }
  }
}
```

**Vote Behavior:**
- First vote: Adds vote
- Same vote again: Removes vote
- Different vote: Changes vote type
- Cannot vote on own content
- Automatically updates karma of content author

---

### 🚨 Reporting

#### 12. Report Content (Auth Required)
```http
POST /api/v1/forum/report
Body: {
  targetId: string (ObjectId),
  targetType: "thread" | "comment",
  reason: string (10-500 chars)
}

Response: {
  statusCode: 201,
  success: true,
  message: "Content reported successfully",
  data: { /* report object */ }
}
```

#### 13. Get Reports (Admin Only)
```http
GET /api/v1/forum/reports
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20)
  - status: "pending" | "reviewed" | "resolved" | "dismissed"

Response: {
  statusCode: 200,
  success: true,
  message: "Reports retrieved successfully",
  data: {
    reports: [ /* report objects */ ],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

---

### 👑 Admin Actions

#### 14. Adjust User Karma (Admin Only)
```http
PUT /api/v1/forum/reputation
Body: {
  userId: string (ObjectId),
  karmaChange: number (integer, can be negative),
  reason?: string (max 500 chars, optional)
}

Response: {
  statusCode: 200,
  success: true,
  message: "User karma adjusted successfully",
  data: {
    oldKarma: number,
    newKarma: number
  }
}
```

---

## Error Responses

All errors follow this format:
```json
{
  statusCode: number,
  success: false,
  message: string,
  details?: array // for validation errors
}
```

Common status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Frontend Implementation Requirements

### 1. Pages/Components to Build

#### Thread List Page
- Display threads in a list/grid
- Show: title, author, karma, comment count, tags, pinned status, lock status
- Filters: tags, status (open/locked), sort (newest/popular/trending)
- Pagination
- "Create Thread" button (if authenticated)

#### Thread Detail Page
- Full thread content
- Author info with karma badge
- Vote buttons (upvote/downvote) with current vote state
- Tags display
- Edit/Delete buttons (if author or admin)
- Lock/Pin buttons (admin only)
- Report button
- Comments section:
  - List all comments
  - Comment form (if thread not locked)
  - Vote on comments
  - Edit/Delete comment (if author or admin)

#### Create/Edit Thread Page
- Title input (3-200 chars)
- Content textarea (10-10000 chars)
- Tags input (multi-select, max 10)
- Validation feedback
- Submit/Cancel buttons

#### Admin Dashboard (Forum Section)
- Reports list with filters
- Actions: review, resolve, dismiss
- Karma adjustment tool
- Moderation logs view

### 2. UI/UX Features

#### Voting UI
- Upvote button (↑) and Downvote button (↓)
- Show current vote count (net votes)
- Highlight user's current vote (if any)
- Disable voting on own content
- Show loading state during vote
- Optimistic UI updates

#### Karma Display
- Show user karma next to username
- Badge/icon for high karma users
- Tooltip showing karma breakdown

#### Thread Status Indicators
- Pin icon for pinned threads
- Lock icon for locked threads
- Visual distinction for locked threads

#### Tags System
- Display tags as chips/badges
- Clickable tags (filter by tag)
- Color-coded or styled tags
- Tag autocomplete when creating thread

#### Real-time Updates (Optional)
- Consider WebSocket/SSE for live vote updates
- Or polling for active threads

### 3. State Management

#### Recommended State Structure
```typescript
// Example with Redux/Zustand/Context
{
  forum: {
    threads: {
      items: Thread[],
      pagination: {
        page: number,
        limit: number,
        total: number,
        totalPages: number
      },
      filters: {
        tags: string[],
        status: string,
        sortBy: string
      },
      loading: boolean,
      error: string | null
    },
    currentThread: {
      data: Thread | null,
      comments: Comment[],
      loading: boolean,
      error: string | null
    },
    votes: {
      // Cache user votes for threads/comments
      [targetId]: {
        type: "upvote" | "downvote" | null
      }
    },
    reports: {
      items: Report[],
      pagination: {...},
      loading: boolean
    }
  }
}
```

### 4. Form Validation

#### Client-side Validation
- Title: 3-200 characters
- Content: 10-10000 characters (threads), 1-5000 (comments)
- Tags: max 10, no duplicates
- Report reason: 10-500 characters

#### Show validation errors:
- Inline field errors
- Toast notifications
- Disable submit until valid

### 5. Error Handling

#### Handle these scenarios:
- Network errors → Show retry button
- 401 Unauthorized → Redirect to login
- 403 Forbidden → Show "Access Denied" message
- 404 Not Found → Show "Thread not found"
- 400 Validation → Show field-specific errors
- 500 Server Error → Show generic error message

### 6. Loading States

- Skeleton loaders for thread list
- Loading spinners for actions (vote, comment, etc.)
- Disable buttons during API calls
- Show progress indicators

### 7. Responsive Design

- Mobile-friendly thread list
- Collapsible comment threads
- Touch-friendly vote buttons
- Responsive forms

### 8. Accessibility

- Keyboard navigation
- ARIA labels for buttons
- Screen reader support
- Focus management
- WCAG 2.2 AA compliance

---

## Integration Checklist

- [ ] Set up API client/axios instance with base URL
- [ ] Add authentication headers to requests
- [ ] Create thread list page with filters
- [ ] Create thread detail page
- [ ] Implement voting system
- [ ] Implement comment system
- [ ] Add create/edit thread forms
- [ ] Add report functionality
- [ ] Add admin moderation tools
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add form validation
- [ ] Test all user flows
- [ ] Test admin flows
- [ ] Test error scenarios
- [ ] Mobile responsiveness
- [ ] Accessibility audit

---

## Example API Calls (JavaScript/TypeScript)

### Fetch Threads
```typescript
const fetchThreads = async (filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || '1',
    limit: filters.limit || '20',
    sortBy: filters.sortBy || 'newest',
    ...(filters.tags && { tags: filters.tags.join(',') }),
    ...(filters.status && { status: filters.status })
  });

  const response = await fetch(`/api/v1/forum/threads?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      // Add auth token if needed
    }
  });

  const data = await response.json();
  return data;
};
```

### Create Thread
```typescript
const createThread = async (threadData) => {
  const response = await fetch('/api/v1/forum/thread', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // or use cookie
    },
    body: JSON.stringify({
      title: threadData.title,
      content: threadData.content,
      tags: threadData.tags || []
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create thread');
  }
  return data;
};
```

### Vote
```typescript
const vote = async (targetId, targetType, voteType) => {
  const response = await fetch('/api/v1/forum/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      targetId,
      targetType, // 'thread' or 'comment'
      type: voteType // 'upvote' or 'downvote'
    })
  });

  const data = await response.json();
  return data;
};
```

---

## Design Suggestions

### Thread Card Design
```
┌─────────────────────────────────────┐
│ 📌 [PINNED] 🔒 [LOCKED]             │
│ Title of the Thread                 │
│ ─────────────────────────────────── │
│ Content preview...                  │
│                                     │
│ 👤 Author Name (Karma: 150)         │
│ 🏷️ #tag1 #tag2 #tag3               │
│                                     │
│ ⬆️ 42  ⬇️ 5  💬 23  📅 2h ago      │
└─────────────────────────────────────┘
```

### Comment Design
```
┌─────────────────────────────────────┐
│ 👤 User Name (Karma: 50)           │
│ ─────────────────────────────────── │
│ Comment content here...             │
│                                     │
│ ⬆️ 5  ⬇️ 1  📅 1h ago  ✏️ 🗑️      │
└─────────────────────────────────────┘
```

---

## Testing Scenarios

1. **Guest User**
   - Can view threads and comments
   - Cannot vote, comment, or create threads
   - Redirected to login when trying to interact

2. **Authenticated User**
   - Can create threads and comments
   - Can vote on content (not own)
   - Can edit/delete own content
   - Can report content

3. **Admin User**
   - All authenticated user features
   - Can lock/unlock threads
   - Can pin/unpin threads
   - Can delete any thread/comment
   - Can view and manage reports
   - Can adjust user karma

---

## Notes

- Karma is separate from badges/levels system
- Karma updates automatically on votes
- Users cannot vote on their own content
- Locked threads prevent new comments
- Pinned threads appear at top of list
- Reports are visible only to admins
- All timestamps are in ISO format

---

## Support

For backend API questions or issues, refer to the backend documentation or contact the backend team.

Good luck with the implementation! 🚀

