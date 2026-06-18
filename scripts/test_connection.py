"""
Chạy script này để kiểm tra kết nối Supabase trước khi bắt đầu pipeline.

Usage:
    python scripts/test_connection.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from pipeline.storage import _get_client


def test_supabase_connection():
    print("Testing Supabase connection...")
    client = _get_client()

    # Test insert
    test_url = "https://test.example.com/test-article"
    client.table("articles").upsert({
        "source": "_test_",
        "category": "test",
        "title": "Test Article",
        "url": test_url,
        "content": "Test content",
    }, on_conflict="url", ignore_duplicates=True).execute()

    # Test select
    result = client.table("articles").select("id, title").eq("url", test_url).execute()
    assert result.data, "Insert/select failed — no data returned"
    print(f"  Insert + Select: OK (id={result.data[0]['id'][:8]}...)")

    # Cleanup
    client.table("articles").delete().eq("url", test_url).execute()
    print("  Cleanup: OK")

    print("\n✅ Supabase connection working!")


if __name__ == "__main__":
    try:
        test_supabase_connection()
    except EnvironmentError as e:
        print(f"\n❌ Config error: {e}")
        print("→ Copy .env.example to .env và điền credentials")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        sys.exit(1)
