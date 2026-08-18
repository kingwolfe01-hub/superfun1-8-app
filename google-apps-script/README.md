# Google Apps Script 遮罩姓名驗證整合說明

## 工作表名稱

`Students`

## 欄位

| enabled | school | gradeClass | number | nameMask | fullName | bookId | note |
|---|---|---|---|---|---|---|---|
| TRUE | 華龍國小 | 三年甲班 | 1 | 黃x智 |  | sf1 |  |
| TRUE | 華龍國小 | 六年甲班 | 8 | 阿x・巴xx |  | sf7 |  |
| TRUE | 華龍國小 | 六年乙班 | 15 | Mxxx Rxxxx |  | sf7 |  |
| TRUE | 大同國小 | 五年甲班 | 1 |  | 測試生 | sf5 | 完整姓名模式 |

## 前端相容性

此 Apps Script 保留現有前端判斷：

```js
data.status === "success"
```

失敗時會回傳：

```json
{ "status": "error", "message": "資料不符合，請確認學校、班級、座號或姓名。" }
```

## 遮罩規則

- `x`：任意 1 個文字字母
- `?`：任意 1 個字元
- `*`：任意 0 到 20 個字元
- `・ / ･ / ‧ / ·`：統一視為分隔符
- 空白：可比對一個或多個空白

## 建議

正式上線建議使用：學校 + 班級 + 座號 + 姓名遮罩。
