# CONTEXT.md -- Task Plant Domain Vocabulary

## Product Name
- Canonical name: Task Plant
- Legacy name: Focus Task Manager / task-manager
- Package name: task-plant

## User
- 不注意優勢型ADHDの就活中大学生。
- Android Chrome PWAを主な利用環境とする。
- 対象ユーザーは1人用の自分専用利用。

## Domain Terms
- task: IndexedDBに保存される作業項目。
- dueDate: YYYY-MM-DD形式の期限日。
- dueTime: HH:MM形式の任意の期限時刻。nullは終日。
- category: job / university / life。
- recurrence: none / daily / weekly / monthly。
- streak: タスクが1件以上ある日に全完了した連続日数。
- all view: /all のカレンダー/リスト全体表示。
- voice input: Web Speech API + Gemini APIによる即時タスク登録。

## Naming Rules
- User-facing product name is Task Plant.
- Keep code identifiers in English.
- Keep Japanese UI copy concise and action-oriented.
