# Product Requirement Document: Basketdubs

**Version:** 1.1
**Date:** November 19, 2025
**Status:** Definition Phase

---

## 1. Executive Summary
**Basketdubs** is a gamified NBA "pick'em" application. Users predict game winners to earn points, which serve as currency to customize personal avatars. The platform prioritizes a fun, risk-free environment (0% gambling) with a competitive global leaderboard. It features "LeBot," an AI assistant with an NBA-fan personality, to drive engagement.

## 2. Technical Stack

### Frontend
* **Framework:** React.js
* **Styling:** Tailwind CSS (Mobile-first approach)
* **Icons:** Lucide React or Heroicons

### Backend
* **Server:** Python Flask
* **Task Scheduler:** APScheduler (for background score updates)
* **External APIs:**
    * **NBA Data:** `balldontlie.io` (Free Tier)
    * **AI:** Google Gemini API

### Data & Auth
* **Platform:** Supabase
* **Authentication:** Google OAuth
* **Database:** PostgreSQL (via Supabase)

---

## 3. User Interface Architecture
The application is structured around **3 Main Pages**:

### Page 1: The Court (Predictions & Scores)
* **Default/Home View.**
* **Upcoming Games Card:** Displays tomorrow's games.
    * *Action:* User clicks Team A or Team B to predict.
* **Live/Past Games Card:** Displays games from the last 3 days.
    * *Visuals:* Live scores updated every 10 mins.
    * *Feedback:* Green highlight for correct predictions, Red for incorrect.
* **Global Leaderboard:** A toggle or section showing the top users by `all_time_points`.

### Page 2: The Locker Room (Shop)
* **Grid Layout:** Displays available accessories (Headbands, Jerseys, Shoes, Backgrounds).
* **Pricing:** Items range from 1 to 100 points.
* **Purchase Action:** clicking an item deducts from `spendable_points` and adds the item ID to the user's inventory in Supabase.
* **Visuals:** Simple preview of the item.

### Page 3: My Player (Profile & Avatar Editor)
* **Avatar Viewer:** Large central view of the user's current avatar.
* **Editor:** UI to equip/unequip items owned in the inventory.
    * *Tech:* Layered SVGs (Body Layer + Clothing Layer).
* **User Stats:** Displays `Username`, `All-Time Ws`, and `Current Balance`.
* **Settings:** Logout button.

> **Global Element:** "LeBot" Chat Button
> A floating action button (FAB) available on all pages to open the AI chat modal.

---

## 4. Core Mechanics & Logic

### 4.1. The Prediction Engine (Scoring)
* **Logic:** High Risk / High Reward System.
* **Correct Prediction:** **+2 Points** (Added to `spendable` and `all_time`).
* **Incorrect Prediction:** **-1 Point** (Deducted from `spendable`).
* **Safety Net:** `spendable_points` cannot drop below 0. If a user has 0 points and guesses wrong, they remain at 0.
* **Locking:** Predictions are locked continuously as soon as the external API reports the game status as distinct from "Scheduled" (e.g., "1st Qtr", "Final").

### 4.2. The Cron Job (Background Worker)
* **Frequency:** Every 10 minutes.
* **Workflow:**
    1.  Fetch games from `balldontlie`.
    2.  Identify games marked as `Final` that haven't been processed yet.
    3.  Compare `game_winner` with user `predictions`.
    4.  Batch update user point balances in Supabase.

### 4.3. LeBot (AI Assistant)
* **Engine:** Google Gemini.
* **Personality:** Enthusiastic NBA fan, uses basketball slang (dunks, buzzer beaters, travel, brick).
* **Restrictions:**
    * **Stateless:** No chat history stored.
    * **Rate Limit:** Max 10 queries per user/day (tracked via Redis or DB table).
    * **Scope:** Answers NBA rules, history, and fun facts.

---

## 5. Database Schema (Supabase)

### `users`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (Linked to Auth) |
| `email` | String | |
| `username` | String | Editable |
| `spendable_points` | Integer | Used for Shop |
| `all_time_points` | Integer | Used for Leaderboard |
| `avatar_config` | JSONB | e.g. `{"head": 101, "body": 204}` |

### `predictions`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | FK to Users |
| `game_id` | Integer | ID from balldontlie API |
| `predicted_team_id` | Integer | |
| `status` | String | `pending`, `settled` |
| `result` | String | `win`, `loss` (nullable until settled) |

### `inventory`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | FK to Users |
| `item_id` | Integer | Hardcoded ID of the shop item |

### `bot_usage`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | UUID | FK to Users |
| `date` | Date | YYYY-MM-DD |
| `query_count` | Integer | Resets daily via logic |

---

## 6. API Endpoints (Flask)

### Game Logic
* `GET /api/games`: Fetch upcoming and recent games.
* `POST /api/predict`: Submit a prediction.
    * *Body:* `{ game_id, team_id }`

### Shop & Avatar
* `GET /api/shop`: List all purchasable items.
* `POST /api/shop/buy`: Purchase item (Validates points -> Deducts points -> Adds to inventory).
* `PUT /api/profile/avatar`: Update currently equipped items.

### LeBot
* `POST /api/chat`: Send message to Gemini.
    * *Logic:* Check `bot_usage` < 10. If yes, call Gemini -> Return response -> Increment usage.