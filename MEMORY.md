# MEMORY.md -- pm-zero v9.3

## External Memory
LLMの記憶に依存せず、状態をファイルに保存する。

## Files
- docs/vision.md: プロダクト意図、成功条件、失敗ケース。
- tasks.md: 実行タスク、ステータス、スコープ、検証証跡。
- docs/state.md: 現在の実行ポインタ、Write Lock、検証ポインタ。
- docs/repo-map.md: リポジトリのナビゲーション。
- docs/decisions.md: 永続判断、Reference URL、将来見直し条件。
- docs/issues.md: 失敗ログ、Escalation、review timeout。
- CONTEXT.md: ドメイン語彙と表記。

## Rules
- tasks.mdにない作業を実装対象にしない。
- state.mdにない実行中作業を進行中扱いしない。
- decisions.mdにない判断を前提化しない。
- issues.mdの同種エラーを繰り返さない。
- 構造変更後はdocs/repo-map.mdを更新する。
- 3回連続失敗はEscalationに記録する。
