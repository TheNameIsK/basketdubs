# Leaderboard System Documentation

**Feature:** Competitive Rankings  
**Date Completed:** November 24, 2025  
**Status:** ✅ Production Ready

---

## Overview

The leaderboard system displays the top 50 players ranked by all-time points, creating a competitive element that encourages users to make more predictions.

---

## Features

### Display
- **Top 50 Players:** Shows the highest-ranked users by all-time points
- **Medal System:** 🥇 Gold, 🥈 Silver, 🥉 Bronze for top 3
- **Color-Coded Ranks:** Visual hierarchy with different colors
- **Current User Highlight:** Blue background for your position
- **Dual Points Display:** Shows both all-time and spendable points

### User Experience
- **Personal Rank Card:** If you're not in top 50, shows your rank in a special card
- **Motivational Message:** Encourages users to climb the ranks
- **Clean Table Design:** Responsive and mobile-friendly
- **Loading States:** Smooth loading experience
- **Error Handling:** Graceful error messages with retry option

### Navigation
- **Integrated Everywhere:** Leaderboard button on all main pages
- **Consistent Design:** Yellow button (🏆 Leaderboard) across the app
- **Protected Route:** Requires authentication

---

## Technical Implementation

### Backend (`backend/routes/leaderboard.py`)

**Endpoint:** `GET /api/leaderboard`

**Logic:**
1. Fetch top 50 users ordered by `all_time_points` (descending)
2. Filter out users without username (first-time users)
3. Add rank number to each user (1-50)
4. Check if current user is in top 50
5. If not, calculate their rank separately
6. Return leaderboard + current user data

**Query Optimization:**
- Single query for top 50 users
- Conditional query for current user rank (only if needed)
- Uses Supabase ordering and filtering

**Response Format:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "uuid",
      "username": "Player1",
      "all_time_points": 150,
      "spendable_points": 75,
      "is_current_user": false
    }
  ],
  "current_user_rank": 23,
  "current_user_data": {
    "rank": 23,
    "username": "You",
    "all_time_points": 50,
    "spendable_points": 25,
    "is_current_user": true
  },
  "total_users": 50
}
```

### Frontend (`frontend/src/pages/Leaderboard.jsx`)

**Components:**
- Header with navigation
- Current user rank card (if not in top 50)
- Leaderboard table
- Loading/error states
- Footer info

**Styling:**
- Tailwind CSS for responsive design
- Color-coded ranks (gold, silver, bronze)
- Blue highlight for current user
- Hover effects on table rows
- Medal emojis for visual appeal

**State Management:**
- `leaderboard`: Array of top 50 players
- `currentUserRank`: User's rank number
- `currentUserData`: User's data if not in top 50
- `loading`: Loading state
- `error`: Error message

---

## Integration

### Routing (`frontend/src/App.jsx`)
```jsx
<Route
  path="/leaderboard"
  element={
    <ProtectedRoute>
      <Leaderboard />
    </ProtectedRoute>
  }
/>
```

### Navigation Buttons
Added to all main pages:
- Court page
- Shop page
- Profile page
- Leaderboard page (for consistency)

**Button Style:**
```jsx
<button
  onClick={() => navigate('/leaderboard')}
  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
>
  🏆 Leaderboard
</button>
```

---

## User Flow

1. **User clicks "🏆 Leaderboard"** from any page
2. **Page loads** with loading state
3. **Backend fetches** top 50 users + current user rank
4. **Table displays** with medals and highlights
5. **If user not in top 50:** Special card shows their rank
6. **User can navigate** back to other pages

---

## Future Enhancements

### Potential Features
- [ ] Pagination (show more than top 50)
- [ ] Filter by time period (weekly, monthly, all-time)
- [ ] Search for specific users
- [ ] Leaderboard history/trends
- [ ] Friend leaderboard (compare with friends)
- [ ] Achievements/badges display
- [ ] Export leaderboard data

### Performance Optimizations
- [ ] Cache leaderboard data (5-minute cache)
- [ ] Infinite scroll instead of pagination
- [ ] Real-time updates with WebSocket
- [ ] Lazy loading for large lists

---

## Testing Checklist

- [x] Top 50 users display correctly
- [x] Current user highlighted in table
- [x] Current user rank card shows when not in top 50
- [x] Medals display for top 3
- [x] Navigation works from all pages
- [x] Loading state displays
- [x] Error handling works
- [x] Protected route requires auth
- [x] Responsive design on mobile
- [x] Points display correctly (all-time + spendable)

---

## Known Limitations

1. **Static Top 50:** Only shows top 50, no pagination yet
2. **No Filters:** Can't filter by time period or category
3. **No Search:** Can't search for specific users
4. **Manual Refresh:** No auto-refresh, must reload page
5. **No Caching:** Fetches fresh data every time

---

## Files Modified

### New Files
- `backend/routes/leaderboard.py` - Backend endpoint
- `frontend/src/pages/Leaderboard.jsx` - Frontend page
- `docs/leaderboard-feature.md` - This documentation

### Modified Files
- `backend/app.py` - Registered leaderboard blueprint
- `frontend/src/App.jsx` - Added leaderboard route
- `frontend/src/pages/Court.jsx` - Added navigation button
- `frontend/src/pages/Shop.jsx` - Added navigation button
- `frontend/src/pages/Profile.jsx` - Added navigation button
- `docs/project-progress.md` - Updated completion status

---

## API Endpoints

### Get Leaderboard
```
GET /api/leaderboard
Authorization: Bearer <token>

Response: 200 OK
{
  "leaderboard": [...],
  "current_user_rank": 23,
  "current_user_data": {...},
  "total_users": 50
}
```

### Get Leaderboard Stats (Future Use)
```
GET /api/leaderboard/stats
Authorization: Bearer <token>

Response: 200 OK
{
  "total_users": 150,
  "average_points": 45.5,
  "highest_points": 200,
  "lowest_points": 0
}
```

---

## Conclusion

The leaderboard system is complete and production-ready. It adds a competitive element to Basketdubs, encouraging users to make more predictions to climb the ranks. The implementation is clean, efficient, and integrates seamlessly with the existing app architecture.

**Status:** ✅ Ready for production deployment
