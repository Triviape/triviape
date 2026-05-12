/**
 * Maximum global leaderboard rows read when building the Friends leaderboard view.
 *
 * The Friends board is derived by taking this leading window of the global ranking
 * (same period and optional category filters) and keeping only you and your friends.
 * Anyone in your circle who ranks below this window will not appear until storage
 * supports a dedicated friends-scoped query or a larger window is chosen deliberately.
 */
export const FRIENDS_LEADERBOARD_GLOBAL_SLICE_ROW_LIMIT = 250;
