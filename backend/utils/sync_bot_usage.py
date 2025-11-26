"""
Utility to sync bot_usage table with chat_history
Run this if the tables ever get out of sync
"""
from supabase_client import get_supabase_client
from datetime import date, timedelta

def sync_bot_usage(days_back=7):
    """
    Sync bot_usage table with actual message counts from chat_history
    
    Args:
        days_back: Number of days to sync (default 7)
    """
    supabase = get_supabase_client()
    today = date.today()
    
    print(f"🔄 Syncing bot_usage with chat_history for last {days_back} days...")
    
    synced_count = 0
    
    for i in range(days_back):
        check_date = today - timedelta(days=i)
        date_str = str(check_date)
        
        # Get all users who have messages on this date
        messages = supabase.table('chat_history').select(
            'user_id'
        ).eq('message_date', date_str).eq('role', 'user').execute()
        
        if not messages.data:
            print(f"  {date_str}: No messages")
            continue
        
        # Group by user_id and count
        user_counts = {}
        for msg in messages.data:
            user_id = msg['user_id']
            user_counts[user_id] = user_counts.get(user_id, 0) + 1
        
        # Update bot_usage for each user
        for user_id, count in user_counts.items():
            # Check if record exists
            existing = supabase.table('bot_usage').select('*').eq(
                'user_id', user_id
            ).eq('usage_date', date_str).execute()
            
            if existing.data:
                old_count = existing.data[0]['query_count']
                if old_count != count:
                    # Update with correct count
                    supabase.table('bot_usage').update({
                        'query_count': count
                    }).eq('user_id', user_id).eq('usage_date', date_str).execute()
                    print(f"  {date_str}: Updated user {user_id[:8]}... from {old_count} to {count}")
                    synced_count += 1
            else:
                # Insert new record
                supabase.table('bot_usage').insert({
                    'user_id': user_id,
                    'usage_date': date_str,
                    'query_count': count
                }).execute()
                print(f"  {date_str}: Created record for user {user_id[:8]}... with count {count}")
                synced_count += 1
    
    print(f"✅ Sync complete! Updated {synced_count} records.")
    return synced_count

def verify_consistency(check_date=None):
    """
    Verify that bot_usage matches chat_history for a given date
    
    Args:
        check_date: Date to check (default: today)
    
    Returns:
        dict with consistency report
    """
    supabase = get_supabase_client()
    
    if check_date is None:
        check_date = date.today()
    
    date_str = str(check_date)
    
    print(f"🔍 Checking consistency for {date_str}...")
    
    # Get counts from chat_history
    history_counts = {}
    messages = supabase.table('chat_history').select(
        'user_id'
    ).eq('message_date', date_str).eq('role', 'user').execute()
    
    for msg in messages.data:
        user_id = msg['user_id']
        history_counts[user_id] = history_counts.get(user_id, 0) + 1
    
    # Get counts from bot_usage
    usage_records = supabase.table('bot_usage').select('*').eq(
        'usage_date', date_str
    ).execute()
    
    usage_counts = {}
    for record in usage_records.data:
        usage_counts[record['user_id']] = record['query_count']
    
    # Compare
    all_users = set(history_counts.keys()) | set(usage_counts.keys())
    
    mismatches = []
    for user_id in all_users:
        history_count = history_counts.get(user_id, 0)
        usage_count = usage_counts.get(user_id, 0)
        
        if history_count != usage_count:
            mismatches.append({
                'user_id': user_id,
                'chat_history': history_count,
                'bot_usage': usage_count,
                'difference': history_count - usage_count
            })
    
    if mismatches:
        print(f"❌ Found {len(mismatches)} mismatches:")
        for m in mismatches:
            print(f"  User {m['user_id'][:8]}...: history={m['chat_history']}, usage={m['bot_usage']}")
    else:
        print(f"✅ All records consistent! ({len(all_users)} users checked)")
    
    return {
        'date': date_str,
        'total_users': len(all_users),
        'mismatches': mismatches,
        'is_consistent': len(mismatches) == 0
    }

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'sync':
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
            sync_bot_usage(days)
        elif sys.argv[1] == 'verify':
            verify_consistency()
    else:
        print("Usage:")
        print("  python sync_bot_usage.py sync [days]    - Sync bot_usage with chat_history")
        print("  python sync_bot_usage.py verify         - Verify consistency for today")
